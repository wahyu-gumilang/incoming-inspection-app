import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../user.service';
import { AuthService } from '../../../core/auth/auth.service';
import { User, UserRole } from '../../../core/models/user';
import { ApiError } from '../../../core/api/api-error';

// Result returned to the parent: true = reload list; { password } = show the reset snackbar.
type EditResult = boolean | { password: string };

@Component({
  selector: 'app-user-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './user-edit-dialog.component.html',
  styleUrls: ['./user-edit-dialog.component.scss'],
})
export class UserEditDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<UserEditDialog, EditResult>);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private auth = inject(AuthService);
  readonly user: User = inject(MAT_DIALOG_DATA);

  fullname = '';
  email = '';
  role: UserRole = 'INSPECTOR';
  active = true;
  saving = false;
  resetting = false;
  showResetPassword = '';

  isSelf = false;
  readonly roleOptions: { value: UserRole; label: string }[] = [
    { value: 'INSPECTOR', label: 'Inspector' },
    { value: 'CHECKER', label: 'Checker' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  ngOnInit(): void {
    this.fullname = this.user.fullname;
    this.email = this.user.email ?? '';
    this.role = this.user.role;
    this.active = this.user.active;
    this.isSelf = this.auth.user()?.userid === this.user.userid;
  }

  save(): void {
    if (!this.fullname.trim() || !this.role) return;
    this.saving = true;
    this.userService
      .update(this.user.userid, {
        fullname: this.fullname.trim(),
        email: this.email.trim() || '',
        role: this.role,
        active: this.active,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.dialogRef.close(this.showResetPassword ? { password: this.showResetPassword } : true);
        },
        error: (err) => {
          this.saving = false;
          const apiErr = ApiError.from(err);
          this.snackBar.open(apiErr.message, 'Close', { duration: 5000 });
        },
      });
  }

  resetPassword(): void {
    this.resetting = true;
    this.userService.resetPassword(this.user.userid).subscribe({
      next: (res) => {
        this.resetting = false;
        this.showResetPassword = res.temporaryPassword;
        // Keep the dialog open so the admin can copy the password before it disappears.
      },
      error: (err) => {
        this.resetting = false;
        this.snackBar.open(ApiError.from(err).message, 'Close', { duration: 5000 });
      },
    });
  }

  done(): void {
    this.copyPasswordToClipboard();
    this.dialogRef.close(this.showResetPassword ? { password: this.showResetPassword } : true);
  }

  async copyPasswordToClipboard(): Promise<void> {
    if (this.showResetPassword) {
      await navigator.clipboard
        .writeText(this.showResetPassword)
        .catch(() => undefined);
    }
  }

  cancel(): void {
    if (this.saving || this.resetting) return;
    this.dialogRef.close(this.showResetPassword ? { password: this.showResetPassword } : false);
  }
}
