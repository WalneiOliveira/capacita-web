import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const alunoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaLogado()) {
    router.navigate(['/login']);
    return false;
  }

  if (auth.ehBackoffice()) {
    router.navigate(['/backoffice']);
    return false;
  }

  return true;
};
