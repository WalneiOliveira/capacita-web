import { Component, OnInit, inject, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { CursoService } from '../../services/curso.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-meus-cursos',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './meus-cursos.html',
  styleUrl: './meus-cursos.scss',
})
export class MeusCursos implements OnInit {
  protected cursoService = inject(CursoService);
  private auth = inject(AuthService);

  // 'acoes' alterado para 'cancelar' ou mantido no final
  protected colunasExibidas: string[] = [
    'curso',
    'nivel',
    'dataMatricula',
    'horasAssistidas',
    'cancelar'
  ];

  protected matriculasComCurso = computed(() => {
    return this.cursoService
      .matriculas()
      .map((m) => {
        const curso = this.cursoService.buscarCursoPorId(m.cursoId);
        return {
          matricula: m,
          curso,
        };
      })
      .reverse();
  });

  ngOnInit(): void {
    this.cursoService.carregarCursos().subscribe(() => {
      const usuario = this.auth.usuario();
      if (usuario) {
        this.cursoService.carregarMinhasMatriculas(usuario.id).subscribe();
      }
    });
  }

  cancelarMatricula(matriculaId: number | string, nomeCurso?: string): void {
    const confirmacao = confirm(
      `Deseja realmente cancelar sua matrícula no curso "${nomeCurso || ''}"?`
    );

    if (confirmacao) {
      this.cursoService.cancelarMatricula(Number(matriculaId)).subscribe({
        next: () => {
          console.log('Matrícula cancelada com sucesso');
        },
        error: (err) => {
          console.error('Erro ao cancelar matrícula:', err);
        }
      });
    }
  }
}