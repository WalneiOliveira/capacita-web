import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const trocaSenhaGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const usuario = auth.usuario(); // Acessa o signal readonly

  // Caso 1: Usuário precisa trocar a senha e está tentando ir para qualquer outra página
  if (usuario?.precisaTrocarSenha) {
    if (state.url !== '/trocar-senha') {
      return router.parseUrl('/trocar-senha');
    }
    return true;
  }

  // Caso 2: Usuário já trocou a senha e tenta acessar /trocar-senha manualmente
  if (!usuario?.precisaTrocarSenha && state.url === '/trocar-senha') {
    return router.parseUrl('/');
  }

  return true;
};