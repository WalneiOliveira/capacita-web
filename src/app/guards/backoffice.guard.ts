import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
export const backofficeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.estaLogado() && auth.ehBackoffice()) {
    return true;
  }
  router.navigate(['/']);
  return false;
};
