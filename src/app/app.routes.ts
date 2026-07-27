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
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  {
    path: '',
    component: Home,
    canActivate: [roleRedirectGuard],
    pathMatch: 'full',
  },
  {
    path: 'backoffice',
    component: Backoffice,
    canActivate: [authGuard, backofficeGuard],
  },
  {
    path: '',
    component: Home,
    canActivate: [authGuard],
    children: [
      { path: 'hero', component: Hero, canActivate: [alunoGuard] },
      { path: 'cursos', component: Cursos, canActivate: [alunoGuard] },
      { path: 'cursos/:id', component: CursoDetalhe, canActivate: [alunoGuard] },
      { path: 'meus-cursos', component: MeusCursos, canActivate: [alunoGuard] },
    ],
  },
  { path: '**', redirectTo: '' },
];
