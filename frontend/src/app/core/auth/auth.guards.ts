import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// inject() only works before the first await, so every guard takes its services up front.

// App pages: signed in, and not on a temporary password.
export const authGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  const user = await inject(AuthService).ensureSession();
  if (!user) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  if (user.must_change_password) return router.createUrlTree(['/change-password']);
  return true;
};

// The forced password change: needs a session, nothing else.
export const sessionGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const user = await inject(AuthService).ensureSession();
  return user ? true : router.createUrlTree(['/login']);
};

// The login page: someone already signed in goes straight to the app.
export const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const user = await inject(AuthService).ensureSession();
  return user ? router.createUrlTree(['/dashboard']) : true;
};

export const adminGuard: CanActivateFn = () =>
  inject(AuthService).isAdmin() ? true : inject(Router).createUrlTree(['/dashboard']);
