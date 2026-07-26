import { Component, OnInit, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CursoService } from '../../services/curso.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './cursos.html',
  styleUrl: './cursos.scss',
})
export class Cursos implements OnInit {
  protected readonly cursoService = inject(CursoService);
  private readonly auth = inject(AuthService);

  protected readonly idsMatriculados = computed(
    () => new Set(this.cursoService.matriculas().map((m) => m.cursoId))
  );

  ngOnInit(): void {
    this.cursoService.carregarCursos();
    const usuario = this.auth.usuario();
    if (usuario) {
      this.cursoService.carregarMinhasMatriculas(usuario.id);
    }
  }

  protected estaMatriculado(cursoId: number): boolean {
    return this.idsMatriculados().has(cursoId);
  }
}