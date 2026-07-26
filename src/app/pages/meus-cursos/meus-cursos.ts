import { Component, OnInit, inject, computed } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CursoService } from '../../services/curso.service';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-meus-cursos',
  standalone: true,
  imports: [MatTableModule, MatProgressBarModule],
  templateUrl: './meus-cursos.html',
  styleUrl: './meus-cursos.scss',
})
export class MeusCursos implements OnInit {
  protected cursoService = inject(CursoService);
  private auth = inject(AuthService);
  protected colunasExibidas = ['curso', 'nivel', 'progresso'];
  protected matriculasComCurso = computed(() =>
    this.cursoService.matriculas().map((m) => {
      const curso = this.cursoService.buscarCursoPorId(m.cursoId);
      const percentual = curso
        ? Math.min(100, Math.round((m.horasAssistidas / curso.horas) * 100))
        : 0;
      return { matricula: m, curso, percentual };
    }),
  );
  ngOnInit(): void {
    this.cursoService.carregarCursos().subscribe(() => {
      const usuario = this.auth.usuario();
      if (usuario) {
        this.cursoService.carregarMinhasMatriculas(usuario.id).subscribe();
      }
    });
  }
}
