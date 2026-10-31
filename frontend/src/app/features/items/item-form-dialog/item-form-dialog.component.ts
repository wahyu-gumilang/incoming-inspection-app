import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ItemService } from '../item.service';
import { ItemRow } from '../item';
import { ApiError } from '../../../core/api/api-error';

@Component({
  selector: 'app-item-form-dialog',
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
  templateUrl: './item-form-dialog.component.html',
  styleUrls: ['./item-form-dialog.component.scss'],
})
export class ItemFormDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<ItemFormDialog>);
  private itemService = inject(ItemService);
  private snackBar = inject(MatSnackBar);
  readonly item: ItemRow | null = inject(MAT_DIALOG_DATA);

  itemid = '';
  name = '';
  saving = false;
  isEdit = false;

  ngOnInit(): void {
    if (this.item) {
      this.isEdit = true;
      this.itemid = this.item.itemid;
      this.name = this.item.name;
    }
  }

  save(): void {
    if (!this.name.trim()) {
      this.snackBar.open('Part name is required', 'Close', { duration: 3000 });
      return;
    }
    if (!this.isEdit && !this.itemid.trim()) {
      this.snackBar.open('Part no. is required', 'Close', { duration: 3000 });
      return;
    }

    this.saving = true;
    const request = this.isEdit
      ? this.itemService.rename(this.item!.itemid, this.name.trim())
      : this.itemService.create({
          itemid: this.itemid.trim(),
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