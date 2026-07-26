import { CursoDetalhe } from './pages/curso-detalhe/curso-detalhe';
import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Home } from './pages/home/home';
import { Cursos } from './pages/cursos/cursos';
import { authGuard } from './guards/auth.guard';
export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  {
    path: '',
    component: Home,
    canActivate: [authGuard],
    children: [
      { path: 'cursos', component: Cursos },
      { path: 'cursos/:id', component: CursoDetalhe },
    ],
  },
];
