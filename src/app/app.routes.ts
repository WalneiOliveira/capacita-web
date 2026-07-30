import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { Hero } from './pages/hero/hero';
import { Cursos } from './pages/cursos/cursos';
import { CursoDetalhe } from './pages/curso-detalhe/curso-detalhe';
import { MeusCursos } from './pages/meus-cursos/meus-cursos';
import { Backoffice } from './pages/backoffice/backoffice';
import { TrocarSenha } from './pages/trocar-senha/trocar-senha'; // <-- 1. Importe seu componente de troca de senha

import { authGuard } from './guards/auth.guard';
import { backofficeGuard } from './guards/backoffice.guard';
import { alunoGuard } from './guards/aluno.guard';
import { roleRedirectGuard } from './guards/role-redirect.guard';
import { trocaSenhaGuard } from './guards/trocar-senha.guard'; // <-- 2. Importe o novo Guard

export const routes: Routes = [
  // 1. ROTAS PÚBLICAS
  { path: 'login', component: Login },

  // 2. ROTA DE TROCA OBRIGATÓRIA DE SENHA
  // Acessível apenas se estiver logado (passa pelo trocaSenhaGuard que valida a flag precisaTrocarSenha)
  {
    path: 'trocar-senha',
    component: TrocarSenha,
    canActivate: [authGuard, trocaSenhaGuard],
  },

  // 3. ROTA DE DIRECIONAMENTO INICIAL
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard, roleRedirectGuard],
    children: [],
  },

  // 4. ÁREA EXCLUSIVA DE BACKOFFICE
  {
    path: 'backoffice',
    component: Backoffice,
    canActivate: [authGuard, trocaSenhaGuard, backofficeGuard], // <-- 3. Adicionado trocaSenhaGuard
  },

  // 5. ÁREA EXCLUSIVA DO ALUNO
  {
    path: '',
    component: Home,
    canActivate: [authGuard, trocaSenhaGuard, alunoGuard], // <-- 4. Adicionado trocaSenhaGuard
    children: [
      { path: 'hero', component: Hero },
      { path: 'cursos', component: Cursos },
      { path: 'cursos/:id', component: CursoDetalhe },
      { path: 'meus-cursos', component: MeusCursos },
    ],
  },

  // 6. ROTA CORINGA
  { path: '**', redirectTo: '' },
];