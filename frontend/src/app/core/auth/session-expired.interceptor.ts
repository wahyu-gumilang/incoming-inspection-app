import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// A 401 on any call except the sign-in itself means the session is gone
// (expired after a shift, or the account was deactivated): back to the login page.
export const sessionExpiredInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: unknown) => {
      const authCall = req.url.endsWith('/auth/login') || req.url.endsWith('/auth/me');
      if (err instanceof HttpErrorResponse && err.status === 401 && !authCall && auth.user()) {
        auth.clear();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url, expired: 1 } });
      }
      return throwError(() => err);
    }),
  );
};
