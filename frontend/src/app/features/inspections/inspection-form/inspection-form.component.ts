import { ChangeDetectorRef, Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, map, Observable } from 'rxjs';
import { InspectionDetail, DeliveryInfo } from '../../../core/models/inspection';
import { OkNgPill } from '../../../shared/ui/ok-ng-pill/ok-ng-pill';
import {
  LookupAutocomplete,
  LookupOption,
} from '../../../shared/ui/lookup-autocomplete/lookup-autocomplete';
import { ItemService } from '../../items/item.service';
import { VendorService } from '../../vendors/vendor.service';
import {
  COLUMNS,
  CATEGORY_LABEL,
  JudgmentLabel,
  JudgmentMark,
  InspectionStatusLabel,
  TYPE_LABEL,
  buildCheckSheet,
  CheckSheetRow,
} from '../inspection.model';
import { InspectionService, UpdateHeaderInput } from '../inspection.service';
import { DeliveryDialogComponent } from '../delivery-dialog/delivery-dialog.component';

// Form 7.4.3-F1 view: header, the characteristic rows, and one Actual / OK-NG
// column per delivery. The header is editable on drafts (supplier, date,
// instrument, QF no.); changing the item on a filled form asks for
// confirmation. Item-swap server-side support lands in a later iteration.
@Component({
  selector: 'app-inspection-form',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    OkNgPill,
    LookupAutocomplete,
    DeliveryDialogComponent,
  ],
  templateUrl: './inspection-form.component.html',
  styleUrl: './inspection-form.scss',
})
export class InspectionFormComponent {
  readonly inspectnum = input.required<string>();
  readonly closed = output<void>();

  readonly statusLabel = InspectionStatusLabel;
  readonly judgmentLabel = JudgmentLabel;
  readonly judgmentMark = JudgmentMark;
  readonly categoryLabel = CATEGORY_LABEL;
  readonly typeLabel = TYPE_LABEL;
  readonly columns = COLUMNS;

  private readonly service = inject(InspectionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly itemService = inject(ItemService);
  private readonly vendorService = inject(VendorService);
  private readonly cdr = inject(ChangeDetectorRef);

  detail: InspectionDetail | null = null;
  rows: CheckSheetRow[] = [];
  loading = true;

  editing = false;
  saving = false;

  // Delivery dialog: null editN adds the next column, otherwise edits that one.
  readonly deliveryOpen = signal(false);
  readonly editingDelivery = signal<number | null>(null);

  // Header edit state; item and supplier selections seed the lookup fields.
  headerForm: UpdateHeaderInput = {};
  itemSelected = signal<LookupOption | null>(null);
  vendorSelected = signal<LookupOption | null>(null);

  // LookupAutocomplete wants (query) => Observable<Option[]>.
  readonly itemSearch = (q: string): Observable<LookupOption[]> =>
    this.itemService
      .list({ q, limit: 20 })
      .pipe(
        map((res) => res.rows.map((i) => ({ value: i.itemid, label: i.itemid, sublabel: i.name }))),
      );

  readonly vendorSearch = (q: string): Observable<LookupOption[]> =>
    this.vendorService
      .lookup(q)
      .pipe(
        map((res) =>
          res.map((v) => ({ value: v.vendaccount, label: v.name, sublabel: v.vendaccount })),
        ),
      );

  get isEditable(): boolean {
    return this.detail?.editable === true;
  }

  get usedCount(): number {
    return this.detail?.deliveries.filter((d) => d.used).length ?? 0;
  }

  get canAddDelivery(): boolean {
    return this.isEditable && this.usedCount < COLUMNS.length;
  }

  delivery(n: number): DeliveryInfo | null {
    return this.detail?.deliveries.find((d) => d.n === n && d.used) ?? null;
  }

  cellActual(row: CheckSheetRow, n: number): string {
    const v = row.actual(n);
    return v === null || v === undefined ? '–' : String(v);
  }

  cellStatus(row: CheckSheetRow, n: number) {
    return row.status(n);
  }

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.detail = await firstValueFrom(this.service.get(this.inspectnum()));
      this.rows = buildCheckSheet(this.detail);
      this.seedHeaderForm();
    } catch {
      this.detail = null;
      this.rows = [];
      this.snackBar.open('Gagal memuat inspeksi', 'OK', { duration: 3000 });
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private seedHeaderForm(): void {
    const d = this.detail;
    if (!d) return;
    this.headerForm = {
      accountnum: d.accountnum,
      inspectdate: d.inspectdate,
      instrument: d.instrument,
      qfnum: d.qfnum,
    };
    this.itemSelected.set({ value: d.itemid, label: d.itemname, sublabel: d.itemid });
    this.vendorSelected.set({ value: d.accountnum, label: d.name, sublabel: d.accountnum });
  }

  toggleEditing(): void {
    if (this.editing) {
      this.cancelEditing();
      return;
    }
    this.editing = true;
    this.seedHeaderForm();
  }

  cancelEditing(): void {
    this.editing = false;
    this.seedHeaderForm();
  }

  onItemPick(opt: LookupOption | null): void {
    if (opt) this.itemSelected.set(opt);
  }

  onVendorPick(opt: LookupOption | null): void {
    if (opt) this.headerForm.accountnum = opt.value;
  }

  async saveHeader(): Promise<void> {
    if (!this.detail) return;
    this.saving = true;
    try {
      const payload: UpdateHeaderInput = {
        accountnum: this.headerForm.accountnum,
        inspectdate: this.headerForm.inspectdate,
        instrument: this.headerForm.instrument,
        qfnum: this.headerForm.qfnum,
      };
      this.detail = await firstValueFrom(
        this.service.updateHeader(this.detail.inspectnum, payload),
      );
      this.rows = buildCheckSheet(this.detail);
      this.cancelEditing();
      this.snackBar.open('Header disimpan', 'OK', { duration: 2000 });
      this.cdr.markForCheck();
    } catch {
      this.snackBar.open('Gagal menyimpan header', 'OK', { duration: 3000 });
    } finally {
      this.saving = false;
    }
  }

  openDelivery(n: number | null): void {
    if (!this.isEditable || !this.detail) return;
    this.editingDelivery.set(n);
    this.deliveryOpen.set(true);
  }

  onDeliverySaved(updated: InspectionDetail): void {
    this.detail = updated;
    this.rows = buildCheckSheet(updated);
    this.deliveryOpen.set(false);
    this.editingDelivery.set(null);
    this.cdr.markForCheck();
  }

  back(): void {
    this.closed.emit();
  }
}
