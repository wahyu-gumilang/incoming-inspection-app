import { HttpInterceptorFn } from '@angular/common/http';

// Ensures cookies are sent with every request (the JWT session cookie).
// The proxy in development already handles same-origin, but in production
// the API may be on a different origin, so withCredentials is always set.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authReq = req.clone({
    withCredentials: true,
  });
  return next(authReq);
};
