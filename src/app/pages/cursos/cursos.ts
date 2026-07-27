import { Component, OnInit, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CursoService } from '../../services/curso.service';
import { AuthService } from '../../services/auth.service';
import { Curso } from '../../models/curso.model';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatChipsModule, MatIconModule],
  templateUrl: './cursos.html',
  styleUrl: './cursos.scss',
})
export class Cursos implements OnInit {
  protected readonly cursoService = inject(CursoService);
  private readonly auth = inject(AuthService);

  protected readonly idsMatriculados = computed(
    () => new Set(this.cursoService.matriculas().map((m) => m.cursoId)),
  );

  protected readonly cursosPorNivel = computed(() => {
    const contagem = new Map<string, number>();
    this.cursoService.cursos().forEach((curso) => {
      contagem.set(curso.nivel, (contagem.get(curso.nivel) ?? 0) + 1);
    });
    return contagem;
  });

  protected cursosPorNivelText(nivel: string): string {
    const quantidade = this.cursosPorNivel().get(nivel) ?? 0;
    return `${quantidade} ${quantidade === 1 ? 'curso' : 'cursos'}`;
  }

  ngOnInit(): void {
    this.cursoService.carregarCursos().subscribe();
    const usuario = this.auth.usuario();
    if (usuario) {
      this.cursoService.carregarMinhasMatriculas(usuario.id);
    }
  }

  protected estaMatriculado(cursoId: number): boolean {
    return this.idsMatriculados().has(cursoId);
  }

  protected imagemDoCurso(curso: Curso): string {
    const nome = curso.nome.toLowerCase();

    if (nome.includes('html') || nome.includes('css')) {
      return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg';
    }

    if (nome.includes('javascript')) {
      return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg';
    }

    if (nome.includes('angular')) {
      return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg';
    }

    return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/codeigniter/codeigniter-plain.svg';
  }

  protected nivelLabel(nivel: string): string {
    const clean = nivel.toLowerCase();
    if (clean === 'intermediário' || clean === 'intermediario') {
      return 'Interm.';
    }
    return nivel;
  }
}
