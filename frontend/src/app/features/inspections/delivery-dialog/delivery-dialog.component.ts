import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '../../../core/api/api-error';
import { AqlLookup } from '../../../core/models/aql';
import { InspectionDetail, Judgment, LineStatus } from '../../../core/models/inspection';
import { JUDGMENT, LINE_STATUS } from '../../../shared/judgement';
import { Modal } from '../../../shared/ui/modal/modal';
import { OkNgPill } from '../../../shared/ui/ok-ng-pill/ok-ng-pill';
import { AqlService } from '../../aql/aql.service';
import { CATEGORIES, CATEGORY_LABEL, INSPECT_CATEGORY } from '../inspection.model';
import { InspectionService } from '../inspection.service';
import {
  DeliveryDraft,
  OtherLineDraft,
  StdLineDraft,
  buildDraft,
  countNgCells,
  deliveryPayload,
  headerProblems,
  judgmentChoices,
  linesOfType,
  ngHint,
  resultProblems,
  stdStatus,
  suggestedJudgment,
} from './delivery-dialog.model';

// One delivery column of the check sheet, filled in three steps (PLAN.md §3.3).
// The OK/NG shown here is the same calculation as the server; the server value
// replaces this draft after every save.
@Component({
  selector: 'app-delivery-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    Modal,
    OkNgPill,
  ],
  templateUrl: './delivery-dialog.component.html',
  styleUrl: './delivery-dialog.component.scss',
})
export class DeliveryDialogComponent {
  readonly open = model(false);
  readonly detail = input.required<InspectionDetail>();
  /** Column to edit; null adds the next delivery. */
  readonly editN = input<number | null>(null);
  readonly saved = output<InspectionDetail>();

  private readonly aqlService = inject(AqlService);
  private readonly inspectionService = inject(InspectionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly step = signal<1 | 2 | 3>(1);
  readonly draft = signal<DeliveryDraft | null>(null);
  readonly saving = signal(false);
  readonly aql = signal<AqlLookup | null>(null);
  readonly aqlLoading = signal(false);
  readonly aqlError = signal('');
  readonly problems = signal<string[]>([]);

  readonly categoryLabel = CATEGORY_LABEL;
  readonly categories = CATEGORIES;

  readonly title = computed(() => {
    const draft = this.draft();
    return draft ? `Delivery ${draft.n}${draft.isNew ? ' · new' : ''}` : 'Delivery';
  });

  readonly subtitle = computed(() => {
    const detail = this.detail();
    return `${detail.itemid} · ${detail.itemname} · ${detail.name}`;
  });

  readonly hint = computed(() => {
    const draft = this.draft();
    return draft ? ngHint(draft) : '';
  });

  readonly suggestion = computed(() => {
    const draft = this.draft();
    return draft ? suggestedJudgment(this.aql(), draft.notgood) : null;
  });

  readonly choices = computed(() => {
    const draft = this.draft();
    return draft ? judgmentChoices(this.aql(), draft.notgood, draft.note) : [];
  });

  readonly certificateLines = computed(() => {
    const draft = this.draft();
    return draft ? linesOfType(draft, 'CERTIFIKAT') : [];
  });

  readonly visualLines = computed(() => {
    const draft = this.draft();
    return draft ? linesOfType(draft, 'VISUAL') : [];
  });

  readonly fittingLines = computed(() => {
    const draft = this.draft();
    return draft ? linesOfType(draft, 'FITTING') : [];
  });

  private aqlTimer: ReturnType<typeof setTimeout> | null = null;
  private aqlSequence = 0;

  constructor() {
    effect(() => {
      if (!this.open()) return;
      const detail = this.detail();
      const n = this.editN();
      untracked(() => this.reset(detail, n));
    });
    this.destroyRef.onDestroy(() => {
      if (this.aqlTimer) clearTimeout(this.aqlTimer);
    });
  }

  private reset(detail: InspectionDetail, editN: number | null): void {
    const used = detail.deliveries.filter((d) => d.used).length;
    const n = editN ?? Math.min(7, used + 1);
    this.draft.set(buildDraft(detail, n));
    this.step.set(1);
    this.problems.set([]);
    this.aql.set(null);
    this.aqlLoading.set(false);
    this.aqlError.set('');
    void this.refreshAql();
  }

  private patch(changes: Partial<DeliveryDraft>): void {
    this.draft.update((draft) => (draft ? { ...draft, ...changes } : draft));
    this.problems.set([]);
  }

  private patchLine(linenum: number, changes: Partial<StdLineDraft>): void {
    this.draft.update((draft) =>
      draft
        ? {
            ...draft,
            std: draft.std.map((line) =>
              line.linenum === linenum ? { ...line, ...changes } : line,
            ),
          }
        : draft,
    );
    this.problems.set([]);
  }

  private patchOther(linenum: number, changes: Partial<OtherLineDraft>): void {
    this.draft.update((draft) =>
      draft
        ? {
            ...draft,
            other: draft.other.map((line) =>
              line.linenum === linenum ? { ...line, ...changes } : line,
            ),
          }
        : draft,
    );
    this.problems.set([]);
  }

  // ---- Step 1 -------------------------------------------------------------

  setPo(value: string): void {
    this.patch({ purchordernum: value ?? '' });
  }

  setDeliverydate(value: string): void {
    this.patch({ deliverydate: value ?? '' });
  }

  setQty(value: number | string | null): void {
    const qty = String(value ?? '').replace(/[^\d]/g, '');
    this.patch({ qty });
    this.scheduleAql();
  }

  setCategory(category: number): void {
    if (!Object.values(INSPECT_CATEGORY).includes(category as 0 | 1 | 2 | 3)) return;
    this.patch({ inspectcategory: category as 0 | 1 | 2 | 3 });
    void this.refreshAql();
  }

  private scheduleAql(): void {
    if (this.aqlTimer) clearTimeout(this.aqlTimer);
    this.aqlTimer = setTimeout(() => void this.refreshAql(), 250);
  }

  private async refreshAql(): Promise<void> {
    const draft = this.draft();
    if (!draft) return;

    const lot = Number(draft.qty);
    if (!Number.isInteger(lot) || lot < 1) {
      this.aqlSequence += 1;
      this.aql.set(null);
      this.aqlError.set('');
      this.aqlLoading.set(false);
      return;
    }

    const sequence = ++this.aqlSequence;
    this.aqlLoading.set(true);
    this.aqlError.set('');
    try {
      const result = await firstValueFrom(
        this.aqlService.lookup(lot, draft.inspectcategory, this.detail().aqlplanid ?? undefined),
      );
      if (sequence !== this.aqlSequence) return;
      this.aql.set(result);
    } catch (err) {
      if (sequence !== this.aqlSequence) return;
      this.aql.set(null);
      this.aqlError.set(ApiError.from(err).message);
    } finally {
      if (sequence === this.aqlSequence) this.aqlLoading.set(false);
    }
  }

  // ---- Step 2 -------------------------------------------------------------

  setActual(linenum: number, value: string): void {
    this.patchLine(linenum, { actual: value ?? '' });
  }

  setManualStatus(linenum: number, status: LineStatus): void {
    this.patchLine(linenum, { manualStatus: status });
  }

  setOtherStatus(linenum: number, status: LineStatus): void {
    this.patchOther(linenum, { status });
  }

  setCertificate(linenum: number, text: string): void {
    this.patchOther(linenum, { actualTxt: text ?? '' });
  }

  statusOf(line: StdLineDraft): LineStatus {
    return stdStatus(line);
  }

  /** Enter moves to the next actual, like the paper form. */
  onActualEnter(event: Event): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const inputs = Array.from(
      input.closest('table')?.querySelectorAll<HTMLInputElement>('.actual-input') ?? [],
    );
    const index = inputs.indexOf(input);
    const next = inputs[index + 1];
    if (next) next.focus();
  }

  // ---- Step 3 -------------------------------------------------------------

  setNotgood(value: number | string | null): void {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    this.patch({ notgood: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 });
  }

  setJudgment(judgment: Judgment): void {
    this.patch({ judgment });
  }

  setNote(value: string): void {
    this.patch({ note: value ?? '' });
  }

  choice(value: Judgment) {
    return this.choices().find((c) => c.value === value);
  }

  // ---- Navigation / save --------------------------------------------------

  next(): void {
    const draft = this.draft();
    if (!draft) return;

    if (this.step() === 1) {
      const problems = headerProblems(draft);
      if (this.aqlLoading()) problems.push('Wait for the sample size to load.');
      if (this.aqlError()) problems.push(this.aqlError());
      if (!this.aqlLoading() && !this.aqlError() && !this.aql())
        problems.push('Enter the QTY received to get the sample size.');
      if (problems.length) {
        this.problems.set(problems);
        return;
      }
      this.problems.set([]);
      this.step.set(2);
      return;
    }

    if (this.step() === 2) {
      this.prepareResult(draft);
      this.problems.set([]);
      this.step.set(3);
      return;
    }

    void this.save();
  }

  back(): void {
    if (this.saving()) return;
    this.problems.set([]);
    this.step.update((step) => (step === 3 ? 2 : 1));
  }

  private prepareResult(draft: DeliveryDraft): void {
    const cells = countNgCells(draft);
    const changes: Partial<DeliveryDraft> = {};
    if (cells > 0 && draft.notgood < 1) changes.notgood = 1;

    const defects = changes.notgood ?? draft.notgood;
    const allowed =
      judgmentChoices(this.aql(), defects, draft.note).find(
        (choice) => choice.value === draft.judgment,
      )?.enabled ?? false;
    if (!allowed) {
      const suggestion = suggestedJudgment(this.aql(), defects);
      if (suggestion) changes.judgment = suggestion;
    }
    if (Object.keys(changes).length) this.patch(changes);
  }

  async save(): Promise<void> {
    const draft = this.draft();
    if (!draft || this.saving()) return;

    const problems = resultProblems(draft, this.aql());
    if (problems.length) {
      this.problems.set(problems);
      return;
    }

    this.saving.set(true);
    this.problems.set([]);
    try {
      const updated = await firstValueFrom(
        this.inspectionService.saveDelivery(
          this.detail().inspectnum,
          draft.n,
          deliveryPayload(draft),
        ),
      );
      this.snackBar.open(`Delivery ${draft.n} saved`, 'OK', { duration: 2500 });
      this.open.set(false);
      this.saved.emit(updated);
    } catch (err) {
      const error = ApiError.from(err);
      this.problems.set([
        error.message,
        ...error.details.map((detail) => `${detail.field}: ${detail.message}`),
      ]);
    } finally {
      this.saving.set(false);
    }
  }

  close(): void {
    if (!this.saving()) this.open.set(false);
  }

  isOk(status: LineStatus): boolean {
    return status === LINE_STATUS.OK;
  }

  isNg(status: LineStatus): boolean {
    return status === LINE_STATUS.NG;
  }

  isConcession(judgment: Judgment): boolean {
    return judgment === JUDGMENT.CONCESSION;
  }
}
