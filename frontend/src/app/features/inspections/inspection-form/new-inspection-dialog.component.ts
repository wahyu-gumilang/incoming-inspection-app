import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';
import {
  LookupAutocomplete,
  LookupOption,
} from '../../../shared/ui/lookup-autocomplete/lookup-autocomplete';
import { ItemService } from '../../items/item.service';
import { VendorService } from '../../vendors/vendor.service';
import { InspectionService } from '../inspection.service';
export interface NewInspectionResult {
  inspectnum: string;
}

// The "New inspection" dialog (§3.3 Header). Creating the draft copies the item's
// standards server-side; this form only picks item, supplier, date, instrument and
// QF no. — the fields the paper header asks for.
@Component({
  selector: 'app-new-inspection-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    LookupAutocomplete,
  ],
  templateUrl: './new-inspection-dialog.component.html',
  styleUrl: './new-inspection-dialog.component.scss',
})
export class NewInspectionDialog {
  private readonly dialogRef = inject(MatDialogRef<NewInspectionResult>);
  private readonly itemService = inject(ItemService);
  private readonly vendorService = inject(VendorService);
  private readonly inspectionService = inject(InspectionService);

  readonly date: Date = localMidnight();
  instrument = '';
  qfnum = '';
  item: { id: string; label: string } | null = null;
  vendor: { id: string; label: string } | null = null;
  saving = false;

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

  onItemPick(opt: LookupOption | null): void {
    this.item = opt ? { id: opt.value, label: opt.label } : null;
  }

  onVendorPick(opt: LookupOption | null): void {
    this.vendor = opt ? { id: opt.value, label: opt.label } : null;
  }

  save(): void {
    if (!this.item || !this.vendor || !this.date) return;
    this.saving = true;
    this.inspectionService
      .create({
        itemid: this.item.id,
        accountnum: this.vendor.id,
        inspectdate: toLocalIso(this.date),
        instrument: this.instrument.trim() || null,
        qfnum: this.qfnum.trim() || null,
      })
      .subscribe({
        next: (detail) => this.dialogRef.close({ inspectnum: detail.inspectnum }),
        error: () => {
          this.saving = false; // the global interceptor already showed the toast
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}

function localMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalIso(d: Date): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
