import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiError } from '../../../core/api/api-error';
import { VendorService } from '../vendor.service';
import { Vendor } from '../vendor';

@Component({
  selector: 'app-vendor-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './vendor-form-dialog.component.html',
  styleUrls: ['./vendor-form-dialog.component.scss'],
})
export class VendorFormDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<VendorFormDialog>);
  private vendorService = inject(VendorService);
  private snackBar = inject(MatSnackBar);
  readonly vendor: Vendor | null = inject(MAT_DIALOG_DATA);

  vendaccount = '';
  name = '';
  saving = false;
  isEdit = false;

  ngOnInit(): void {
    if (this.vendor) {
      this.isEdit = true;
      this.vendaccount = this.vendor.vendaccount;
      this.name = this.vendor.name;
    }
  }

  save(): void {
    if (!this.name.trim()) {
      this.snackBar.open('Vendor name is required', 'Close', { duration: 3000 });
      return;
    }
    if (!this.isEdit && !this.vendaccount.trim()) {
      this.snackBar.open('Vendor code is required', 'Close', { duration: 3000 });
      return;
    }

    this.saving = true;
    const request = this.isEdit
      ? this.vendorService.update(this.vendor!.vendaccount, { name: this.name.trim() })
      : this.vendorService.create({
          vendaccount: this.vendaccount.trim(),
          name: this.name.trim(),
        });

    request.subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(ApiError.from(err).message, 'Close', { duration: 5000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
