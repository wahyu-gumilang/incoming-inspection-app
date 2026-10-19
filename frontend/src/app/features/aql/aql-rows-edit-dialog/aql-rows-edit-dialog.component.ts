import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AqlPlanDetail, AqlRowInput } from '../aql.service';

export interface AqlRowsEditData {
  plan: AqlPlanDetail;
  category: 1 | 2 | 3;
  rows: AqlRowInput[];
}

interface EditableRow {
  lotmin: string;
  lotmax: string;
  codeletter: string;
  samplesize: string;
  acceptnum: string;
  rejectnum: string;
}

// Result returned to the parent: validated rows, or null when cancelled.
type AqlRowsEditResult = AqlRowInput[] | null;

@Component({
  selector: 'app-aql-rows-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './aql-rows-edit-dialog.component.html',
  styleUrls: ['./aql-rows-edit-dialog.component.scss'],
})
export class AqlRowsEditDialog {
  private dialogRef = inject(MatDialogRef<AqlRowsEditDialog, AqlRowsEditResult>);
  readonly data: AqlRowsEditData = inject(MAT_DIALOG_DATA);

  editingRows: EditableRow[];
  formError = '';
  categoryLabel = '';

  constructor() {
    const labels: Record<number, string> = { 1: 'Normal', 2: 'Reduced', 3: 'Tightened' };
    this.categoryLabel = labels[this.data.category];
    this.editingRows = this.data.rows.map((r) => ({
      lotmin: String(r.lotmin),
      lotmax: r.lotmax === null ? '' : String(r.lotmax),
      codeletter: r.codeletter,
      samplesize: String(r.samplesize),
      acceptnum: String(r.acceptnum),
      rejectnum: String(r.rejectnum),
    }));
    if (this.editingRows.length === 0) this.editingRows.push({
      lotmin: '1',
      lotmax: '',
      codeletter: '',
      samplesize: '',
      acceptnum: '0',
      rejectnum: '1',
    });
  }

  addRow(): void {
    const last = this.editingRows[this.editingRows.length - 1];
    const nextMin = last.lotmax === '' ? Number(last.lotmin || 0) + 1 : Number(last.lotmax) + 1;
    this.editingRows.push({
      lotmin: String(nextMin),
      lotmax: '',
      codeletter: '',
      samplesize: '',
      acceptnum: '0',
      rejectnum: '1',
    });
    this.formError = '';
  }

  removeRow(index: number): void {
    if (this.editingRows.length <= 1) return;
    this.editingRows.splice(index, 1);
    this.formError = '';
  }

  save(): void {
    const rows: AqlRowInput[] = [];
    for (const [i, r] of this.editingRows.entries()) {
      const lotmin = Number(r.lotmin);
      const lotmaxRaw = r.lotmax.trim();
      const lotmax = lotmaxRaw === '' ? null : Number(lotmaxRaw);
      const samplesize = Number(r.samplesize);
      const acceptnum = Number(r.acceptnum);
      const rejectnum = Number(r.rejectnum);
      if (
        !Number.isInteger(lotmin) ||
        lotmin < 1 ||
        (!Number.isInteger(lotmax ?? -1) || lotmax !== null && lotmax < lotmin)
      ) {
        this.formError = `Row ${i + 1}: "Lot from" must be a whole number ≥ 1 and "Lot to" (when set) must be ≥ "Lot from".`;
        return;
      }
      if (!Number.isInteger(samplesize) || samplesize < 1) {
        this.formError = `Row ${i + 1}: sample size must be a whole number ≥ 1.`;
        return;
      }
      if (
        !Number.isInteger(acceptnum) ||
        acceptnum < 0 ||
        !Number.isInteger(rejectnum) ||
        rejectnum < 1 ||
        rejectnum <= acceptnum
      ) {
        this.formError = `Row ${i + 1}: Accept ≥ 0 and Reject ≥ 1, and Reject must be greater than Accept.`;
        return;
      }
      rows.push({
        lotmin,
        lotmax,
        codeletter: r.codeletter.trim(),
        samplesize,
        acceptnum,
        rejectnum,
      });
    }
    this.dialogRef.close(rows);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  get rangeHint(): string {
    return this.data.rows.length === 0
      ? 'No rows yet for this category. Add at least one.'
      : 'Ranges must follow each other without gaps or overlaps. Lots below the first range are inspected 100 %.';
  }
}
