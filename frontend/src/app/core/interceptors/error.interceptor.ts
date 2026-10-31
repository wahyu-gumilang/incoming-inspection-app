import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ApiError } from '../api/api-error';

// Catches HTTP errors and:
// - 401 → redirect to login (session expired)
// - 403 PASSWORD_CHANGE_REQUIRED → redirect to profile/password
// - Other errors → show a snackbar with the error message
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const apiError = ApiError.from(err);

        if (apiError.status === 401) {
          // Session expired or not logged in
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          return throwError(() => apiError);
        }

        if (apiError.status === 403 && apiError.code === 'PASSWORD_CHANGE_REQUIRED') {
          router.navigate(['/profile/password']);
          return throwError(() => apiError);
        }

        // Show toast for other errors
        if (apiError.status >= 400 && apiError.status < 500) {
          toast.error(apiError.message);
        } else {
          toast.error('Terjadi kesalahan server. Silakan coba lagi.');
        }

        return throwError(() => apiError);
      }

      // Non-HTTP error (e.g. network failure)
      toast.error('Gagal terhubung ke server. Periksa koneksi Anda.');
      return throwError(() => err);
    }),
  );
};