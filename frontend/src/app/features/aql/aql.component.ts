import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AqlService, AqlPlanDetail, AqlRowInput } from './aql.service';
import { AqlPlanRow, AqlLookup } from '../../core/models/aql';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/api/api-error';
import { LoadingIndicator } from '../../shared/ui/loading-indicator/loading-indicator';
import { AqlRowsEditDialog } from './aql-rows-edit-dialog/aql-rows-edit-dialog.component';

export type InspectCategory = 1 | 2 | 3; // NORMAL=1, REDUCE=2, TIGHTENING=3

const MARKS: { value: InspectCategory; mark: string; name: string }[] = [
  { value: 1, mark: 'N', name: 'Normal' },
  { value: 2, mark: 'R', name: 'Reduced' },
  { value: 3, mark: 'T', name: 'Tightened' },
];

@Component({
  selector: 'app-aql',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    LoadingIndicator,
  ],
  templateUrl: './aql.component.html',
  styleUrls: ['./aql.component.scss'],
})
export class AqlPage implements OnInit {
  private readonly aqlService = inject(AqlService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly auth = inject(AuthService);

  readonly plans = signal<AqlPlanDetail[]>([]);
  readonly selectedPlan = signal<AqlPlanDetail | null>(null);
  readonly category = signal<InspectCategory>(1);
  readonly loading = signal(false);
  readonly loadError = signal('');

  // "Try a lot size" calculator
  calcLotRaw = '';
  readonly calcCategory = signal<InspectCategory>(1);
  readonly calcResult = signal<AqlLookup | null>(null);
  readonly calcNote = signal('');
  readonly calcError = signal('');
  readonly activeLot = signal<number | null>(null);

  readonly marksMap = MARKS;

  // Rows shown for the selected plan + category tab.
  readonly tabRows = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return [];
    return plan.rows.filter((r) => r.inspectcategory === this.category());
  });

  readonly categoryLabel = computed(() =>
    MARKS.find((m) => m.value === this.category())?.name ?? '',
  );

  // Highlight the row the active lot falls into (per the selected category).
  readonly activeRowIdx = computed(() => {
    const lot = this.activeLot();
    if (lot === null) return -1;
    return this.tabRows().findIndex(
      (r) => lot >= r.lotmin && (r.lotmax === null || lot <= r.lotmax),
    );
  });

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.aqlService.listPlans().subscribe({
      next: async (list) => {
        try {
          // The list only carries the categories each plan covers; fetch every
          // plan with its rows so the tabs and calculator work.
          const details = await Promise.all(
          list.map((p) => firstValueFrom(this.aqlService.getPlan(p.planid))),
        );
          this.plans.set(details);
          this.selectedPlan.set(details.find((p) => p.isdefault) ?? details[0] ?? null);
          this.runCalc();
        } catch {
          this.loadError.set('Could not load the AQL plans.');
        } finally {
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.loadError.set(ApiError.from(err).message);
        this.loading.set(false);
      },
    });
  }

  selectPlan(plan: AqlPlanDetail): void {
    this.selectedPlan.set(plan);
    this.runCalc();
  }

  makeDefault(planId: number): void {
    this.aqlService.setDefault(planId).subscribe({
      next: () => {
        this.snackBar.open('Default plan changed.', 'Close');
        this.loadPlans();
      },
      error: (err) => this.snackBar.open(ApiError.from(err).message, 'Close'),
    });
  }

  selectCategory(cat: InspectCategory): void {
    this.category.set(cat);
    this.calcCategory.set(cat);
    this.runCalc();
  }

  setCalcCategory(cat: InspectCategory): void {
    this.calcCategory.set(cat);
    this.runCalc();
  }

  calcLotInput(raw: string): void {
    this.calcLotRaw = raw;
    const n = raw.trim() === '' ? null : Number(raw);
    this.activeLot.set(n !== null && Number.isInteger(n) && n >= 1 ? n : null);
    if (Number.isInteger(n) && (n as number) >= 1) {
      this.aqlService
        .lookup(n as number, this.calcCategory(), this.selectedPlan()?.planid)
        .subscribe({
          next: (res) => {
            this.calcResult.set(res);
            this.calcError.set('');
            this.calcNote.set(
              res.fullInspection
                ? 'The lot is smaller than the sample: inspect every piece (100 %).'
                : `Code letter ${res.codeletter}. Accept up to ${res.acceptnum} defective piece(s), reject from ${res.rejectnum}.`,
            );
          },
          error: (err) => {
            this.calcResult.set(null);
            this.calcNote.set('');
            this.calcError.set(ApiError.from(err).message);
          },
        });
    } else {
      this.calcResult.set(null);
      this.calcNote.set('');
      this.calcError.set('');
    }
  }

  private runCalc(): void {
    // Re-evaluate the calculator with the current lot input against the new plan.
    if (this.calcLotRaw.trim() !== '') this.calcLotInput(this.calcLotRaw);
  }

  openEditRows(): void {
    const plan = this.selectedPlan();
    if (!plan) return;
    const cat = this.category();
    const rows: AqlRowInput[] = plan.rows
      .filter((r) => r.inspectcategory === cat)
      .map((r) => ({
        lotmin: r.lotmin,
        lotmax: r.lotmax,
        codeletter: r.codeletter,
        samplesize: r.samplesize,
        acceptnum: r.acceptnum,
        rejectnum: r.rejectnum,
      }));
    const dialogRef = this.dialog.open(AqlRowsEditDialog, {
      width: '680px',
      data: { plan, category: cat, rows },
    });
    dialogRef.afterClosed().subscribe((saved: AqlRowInput[] | null) => {
      if (!saved) return;
      this.aqlService.replaceRows(plan.planid, cat, saved).subscribe({
        next: () => {
          this.snackBar.open('AQL rows saved. Saved inspections keep their own values.', 'Close');
          this.loadPlans();
        },
        error: (err) => this.snackBar.open(ApiError.from(err).message, 'Close'),
      });
    });
  }

  lotRange(row: AqlPlanRow): string {
    if (row.lotmax === null) return `${row.lotmin.toLocaleString('en')}+`;
    if (row.lotmin === row.lotmax) return String(row.lotmin);
    return `${row.lotmin.toLocaleString('en')} – ${row.lotmax.toLocaleString('en')}`;
  }
}
