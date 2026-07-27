import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaLogado()) {
    return router.parseUrl('/login');
  }

  return auth.ehBackoffice() ? router.parseUrl('/backoffice') : router.parseUrl('/hero');
};
