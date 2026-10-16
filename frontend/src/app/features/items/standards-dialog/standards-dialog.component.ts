import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { InspectItem, InspectType } from '../../../core/models/item';
import { ItemService } from '../item.service';
import { StandardInput } from '../item';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { ApiError } from '../../../core/api/api-error';

export interface StandardsDialogData {
  itemid: string;
  name: string;
}

// The type dropdown in the "Add standard" form, in form order.
const TYPE_OPTIONS: { value: InspectType; label: string }[] = [
  { value: 'STD', label: 'STD (dimension)' },
  { value: 'CERTIFIKAT', label: 'Certificate (COA)' },
  { value: 'VISUAL', label: 'Visual' },
  { value: 'FITTING', label: 'Fitting' },
];

@Component({
  selector: 'app-standards-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './standards-dialog.component.html',
  styleUrls: ['./standards-dialog.component.scss'],
})
export class StandardsDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<StandardsDialog>);
  private itemService = inject(ItemService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  readonly auth = inject(AuthService);
  readonly data = inject<StandardsDialogData>(MAT_DIALOG_DATA);

  inspectItems = signal<InspectItem[]>([]);
  loading = signal(true);
  saving = signal(false);

  // Add / edit standard form fields.
  formOpen = signal(false);
  editing: InspectItem | null = null;
  type = 'STD' as InspectType;
  inspectitem = '';
  standardTxt = '';
  standardValue: number | null = null;
  toleranceTxt = '';
  tolerancePlus: number | null = null;
  toleranceMinus: number | null = null;

  readonly typeOptions = TYPE_OPTIONS;

  ngOnInit(): void {
    this.loadDetail();
  }

  loadDetail(): void {
    this.loading.set(true);
    this.itemService.get(this.data.itemid).subscribe({
      next: (detail) => {
        this.inspectItems.set(detail.inspectItems);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  close(): void {
    this.dialogRef.close(true);
  }

  openAddForm(): void {
    this.editing = null;
    this.type = 'STD';
    this.inspectitem = '';
    this.standardTxt = '';
    this.standardValue = null;
    this.toleranceTxt = '';
    this.tolerancePlus = null;
    this.toleranceMinus = null;
    this.formOpen.set(true);
  }

  openEditForm(row: InspectItem): void {
    this.editing = row;
    this.type = row.inspecttype;
    this.inspectitem = row.inspectitem;
    this.standardTxt = row.standard_txt ?? '';
    this.standardValue = row.standard;
    this.toleranceTxt = row.tolerance ?? '';
    this.tolerancePlus = row.tolerance_plus ?? null;
    this.toleranceMinus = row.tolerance_minus ?? null;
    this.formOpen.set(true);
  }

  cancelForm(): void {
    this.formOpen.set(false);
    this.editing = null;
  }

  saveStandard(): void {
    if (!this.inspectitem.trim()) {
      this.snackBar.open('Item name is required', 'Close', { duration: 3000 });
      return;
    }
    if (this.type === 'STD' && this.standardValue === null) {
      this.snackBar.open('Standard value is required for a dimension (STD)', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.saving.set(true);
    const standard: StandardInput = {
      inspecttype: this.type,
      inspectitem: this.inspectitem.trim(),
      standard_txt: this.standardTxt.trim(),
      standard: this.standardValue,
      tolerance: this.toleranceTxt.trim(),
      tolerance_plus: this.tolerancePlus ?? 0,
      tolerance_minus: this.toleranceMinus ?? 0,
    };
    const request = this.editing
      ? this.itemService.updateStandard(this.data.itemid, standard)
      : this.itemService.addStandard(this.data.itemid, standard);

    request.subscribe({
      next: (detail) => {
        this.inspectItems.set(detail.inspectItems);
        this.saving.set(false);
        this.cancelForm();
        this.snackBar.open('Standard saved', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(ApiError.from(err).message, 'Close', { duration: 5000 });
      },
    });
  }

  confirmDeleteStandard(row: InspectItem): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'Delete standard',
        message: `Delete "${row.inspecttype} ${row.inspectitem}" from ${this.data.itemid}?`,
        confirmLabel: 'Delete',
        confirmColor: 'warn',
      },
    });
    ref.afterClosed().subscribe((confirmed: boolean | undefined) => {
      if (confirmed) {
        this.itemService
          .deleteStandard(this.data.itemid, row.inspecttype, row.inspectitem)
          .subscribe({
            next: () => {
              this.snackBar.open('Standard deleted', 'Close', { duration: 3000 });
              this.loadDetail();
            },
            error: (err) => {
              this.snackBar.open(ApiError.from(err).message, 'Close', { duration: 5000 });
            },
          });
      }
    });
  }

  // Format helpers for the display cells.
  formatNumber(v: number | null | undefined): string {
    if (v === null || v === undefined) return '';
    return String(v);
  }

  toleranceDisplay(row: InspectItem): string {
    if (!row.tolerance) return '—';
    return row.tolerance;
  }

  plusMinusDisplay(row: InspectItem): string {
    if (row.tolerance_plus === null && row.tolerance_minus === null) return '—';
    const plus = row.tolerance_plus ?? 0;
    const minus = row.tolerance_minus ?? 0;
    return `+${plus} / −${minus}`;
  }
}