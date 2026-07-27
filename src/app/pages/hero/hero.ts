import { ChangeDetectorRef, Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, finalize, forkJoin, of } from 'rxjs';

import { CursoService } from '../../services/curso.service';
import { AuthService } from '../../services/auth.service';
import { Curso } from '../../models/curso.model';
import { CursoComProgresso } from '../../models/curso-progresso';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnInit {
  protected readonly cursoService = inject(CursoService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  protected carregando = true;

  // Signal computado para os cursos em que o aluno está matriculado
  protected readonly meusCursosComProgresso = computed<CursoComProgresso[]>(() => {
    const cursos = this.cursoService.cursos();
    const matriculas = this.cursoService.matriculas();

    return matriculas
      .map((m) => {
        const curso = cursos.find((c) => c.id === m.cursoId);
        if (!curso) return null;

        const pct =
          curso.horas > 0 ? Math.min(100, Math.round((m.horasAssistidas / curso.horas) * 100)) : 0;

        return {
          curso,
          matricula: m,
          porcentagemConcluida: pct,
        };
      })
      .filter((item): item is CursoComProgresso => item !== null);
  });

  // Signal computado para cursos disponíveis
  protected readonly cursosDisponiveis = computed<Curso[]>(() => {
    const cursos = this.cursoService.cursos();
    const idsMatriculados = this.cursoService.matriculas().map((m) => m.cursoId);

    return cursos.filter((c) => !idsMatriculados.includes(c.id));
  });

  // Totais das métricas
  protected readonly totalCursosMatriculados = computed(
    () => this.cursoService.matriculas().length,
  );
  protected readonly totalHorasAssistidas = computed(() =>
    this.cursoService.matriculas().reduce((acc, m) => acc + (m.horasAssistidas || 0), 0),
  );

  ngOnInit(): void {
    const usuarioLogado = this.auth.usuario() || this.obterUsuarioDaSessao();

    if (usuarioLogado?.id) {
      const timeoutHandle = window.setTimeout(() => {
        if (this.carregando) {
          console.warn('Hero demorou demais; encerrando carregamento.');
          this.pararCarregamento();
        }
      }, 5000);

      forkJoin({
        cursos: this.cursoService.carregarCursos().pipe(
          catchError((err) => {
            console.error('Erro na requisição de cursos do Hero:', err);
            return of([]);
          }),
        ),
        matriculas: this.cursoService.carregarMinhasMatriculas(usuarioLogado.id).pipe(
          catchError((err) => {
            console.error('Erro na requisição de matrículas do Hero:', err);
            return of([]);
          }),
        ),
      })
        .pipe(finalize(() => window.clearTimeout(timeoutHandle)))
        .subscribe({
          next: () => this.pararCarregamento(),
          error: (err) => {
            console.error('Erro inesperado na requisição do Hero:', err);
            this.pararCarregamento();
          },
        });
    } else {
      this.pararCarregamento();
    }
  }

  private pararCarregamento(): void {
    this.carregando = false;
    this.cdr.detectChanges();
  }

  private obterUsuarioDaSessao(): any {
    try {
      const sessao = sessionStorage.getItem('capacita-web-usuario');
      return sessao ? JSON.parse(sessao) : null;
    } catch {
      return null;
    }
  }

  protected irParaCurso(cursoId: number): void {
    this.router.navigate(['/cursos', cursoId]);
  }
}
