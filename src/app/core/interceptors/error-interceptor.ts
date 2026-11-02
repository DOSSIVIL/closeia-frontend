import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../auth/auth';
import { logoutReasonFromErrorCode } from '../auth/logout-reason';


const PUBLIC_AUTH_URLS = ['/auth/login', '/auth/google', '/auth/logout'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !PUBLIC_AUTH_URLS.some((url) => req.url.includes(url))
      ) {
        auth.logout({
          reason: logoutReasonFromErrorCode((err.error as { code?: unknown } | null)?.code),
          notifyServer: false,
        });
      }
      return throwError(() => err);
    }),
  );
};