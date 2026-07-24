import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (req.url !== '/login' && auth.isAuthenticated()) {
    const newReq = req.clone({
      setHeaders: { Authorization: `Bearer ${auth.getToken()}` },
    });
    return next(newReq);
  }

  return next(req);
};
