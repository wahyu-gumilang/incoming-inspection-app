import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { VendorService } from '../vendor.service';

@Component({
  selector: 'app-vendor-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './vendor-import-dialog.component.html',
  styleUrls: ['./vendor-import-dialog.component.scss'],
})
export class VendorImportDialog {
  private dialogRef = inject(MatDialogRef<VendorImportDialog>);
  private vendorService = inject(VendorService);
  private snackBar = inject(MatSnackBar);

  selectedFile: File | null = null;
  uploading = false;
  result: { created: number; skipped: number; errors: string[] } | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.result = null;
    }
  }

  upload(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Please select a CSV file first', 'Close', { duration: 3000 });
      return;
    }

    this.uploading = true;
    this.vendorService.importCsv(this.selectedFile).subscribe({
      next: (res) => {
        this.uploading = false;
        this.result = {
          created: res.data.length,
          skipped: 0,
          errors: [],
        };
        this.snackBar.open(`Imported ${res.data.length} vendors`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.uploading = false;
        const details = err.error?.error?.details;
        const errors = details
          ? details.map((d: { message: string }) => d.message)
          : [err.error?.error?.message || 'Import failed'];
        this.result = {
          created: 0,
          skipped: 0,
          errors,
        };
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
