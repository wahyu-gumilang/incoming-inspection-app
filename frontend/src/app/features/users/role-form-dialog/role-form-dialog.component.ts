import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../user.service';
import { UserRole } from '../../../core/models/user';
import { ApiError } from '../../../core/api/api-error';

// "Add user": username, fullname, optional email, role. The server returns a one-time
// temporary password that is shown to the admin here, in this dialog, exactly once.
@Component({
  selector: 'app-role-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './role-form-dialog.component.html',
  styleUrls: ['./role-form-dialog.component.scss'],
})
export class RoleFormDialog {
  private dialogRef = inject(MatDialogRef<RoleFormDialog, { password: string } | null>);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  username = '';
  fullname = '';
  email = '';
  role: UserRole = 'INSPECTOR';
  saving = false;
  showTemporaryPassword = '';

  readonly roleOptions: { value: UserRole; label: string }[] = [
    { value: 'INSPECTOR', label: 'Inspector' },
    { value: 'CHECKER', label: 'Checker' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  save(): void {
    if (!this.fullname.trim() || !this.username.trim() || !this.role) return;
    this.saving = true;
    this.userService
      .create({
        username: this.username.trim(),
        fullname: this.fullname.trim(),
        email: this.email.trim() || undefined,
        role: this.role,
      })
      .subscribe({
        next: (res) => {
          this.showTemporaryPassword = res.temporaryPassword;
        },
        error: (err) => {
          this.saving = false;
          const apiErr = ApiError.from(err);
          const msg = apiErr.fieldMessage('username')
            ? `Username ${apiErr.fieldMessage('username')}`
            : apiErr.message;
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
      });
  }

  confirm(): void {
    if (this.showTemporaryPassword) {
      navigator.clipboard
        .writeText(this.showTemporaryPassword)
        .catch(() => undefined);
    }
    this.dialogRef.close({ password: this.showTemporaryPassword });
  }

  cancel(): void {
    if (this.saving) return;
    this.dialogRef.close(null);
  }
}
