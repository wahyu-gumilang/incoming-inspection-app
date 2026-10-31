import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { ApiError } from '../../../core/api/api-error';
import { AuthService } from '../../../core/auth/auth.service';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../../core/models/user';

function sameAsNew(group: AbstractControl): ValidationErrors | null {
  const { newPassword, confirm } = group.value as { newPassword: string; confirm: string };
  return confirm && newPassword !== confirm ? { mismatch: true } : null;
}

// Shown once after an Admin creates or resets an account: the temporary password
// must be replaced before any other page opens (authGuard sends the user here).
@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly minLength = PASSWORD_MIN_LENGTH;
  protected readonly user = this.auth.user;
  protected readonly firstName = computed(() => this.user()?.fullname.split(' ')[0] ?? '');

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      currentPassword: ['', Validators.required],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(PASSWORD_MIN_LENGTH),
          Validators.maxLength(PASSWORD_MAX_LENGTH),
        ],
      ],
      confirm: ['', Validators.required],
    },
    { validators: sameAsNew },
  );

  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const { currentPassword, newPassword } = this.form.getRawValue();
    try {
      await this.auth.changePassword(currentPassword, newPassword);
      await this.router.navigateByUrl('/dashboard');
    } catch (err) {
      const apiError = ApiError.from(err);
      const field = apiError.fieldMessage('newPassword');
      this.error.set(field ? `New password ${field}` : apiError.message);
    } finally {
      this.busy.set(false);
    }
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
