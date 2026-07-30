import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Home } from './pages/home/home';
import { Hero } from './pages/hero/hero';
import { Cursos } from './pages/cursos/cursos';
import { CursoDetalhe } from './pages/curso-detalhe/curso-detalhe';
import { MeusCursos } from './pages/meus-cursos/meus-cursos';
import { Backoffice } from './pages/backoffice/backoffice';

import { authGuard } from './guards/auth.guard';
import { backofficeGuard } from './guards/backoffice.guard';
import { alunoGuard } from './guards/aluno.guard';
import { roleRedirectGuard } from './guards/role-redirect.guard';

export const routes: Routes = [
  // 1. ROTAS PÚBLICAS (Sem autenticação)
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },

  // 2. ROTA DE DIRECIONAMENTO INICIAL
  // Avalia o papel do usuário logado e redireciona (ex: Admin -> /backoffice, Aluno -> /cursos)
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard, roleRedirectGuard],
    children: [],
  },

  // 3. ÁREA EXCLUSIVA DE BACKOFFICE
  // Rota raiz independente para a equipe de gestão
  {
    path: 'backoffice',
    component: Backoffice,
    canActivate: [authGuard, backofficeGuard], // Proteção estrita por Guard
  },

  // 4. ÁREA EXCLUSIVA DO ALUNO (Shell 'Home')
  // A navegação de Aluno fica isolada sob este layout
  {
    path: '',
    component: Home,
    canActivate: [authGuard, alunoGuard], // Apenas alunos navegam nesta estrutura
    children: [
      { path: 'hero', component: Hero },
      { path: 'cursos', component: Cursos },
      { path: 'cursos/:id', component: CursoDetalhe },
      { path: 'meus-cursos', component: MeusCursos },
    ],
  },

  // 5. ROTA CORINGA
  { path: '**', redirectTo: '' },
];
