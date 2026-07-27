import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // 👈 MatDialog e MatDialogModule

import { CursoService } from '../../services/curso.service';
import { AuthService } from '../../services/auth.service';
import { Curso } from '../../models/curso.model';
import { Video } from '../../models/video.model';
import { VideoDialog } from '../../components/video-dialog/video-dialog';
@Component({
  selector: 'app-curso-detalhe',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatDialogModule,
  ],
  templateUrl: './curso-detalhe.html',
  styleUrl: './curso-detalhe.scss',
})
export class CursoDetalhe implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog); // 👈 Corrigido: inject(MatDialog) em vez de CursoService
  protected cursoService = inject(CursoService);

  protected curso = signal<Curso | undefined>(undefined);
  protected videos = signal<Video[]>([]);
  protected matriculando = signal(false);

  protected jaMatriculado = computed(() => {
    const c = this.curso();
    if (!c) return false;
    return this.cursoService.matriculas().some((m) => m.cursoId === c.id);
  });

  ngOnInit(): void {
    const cursoId = Number(this.route.snapshot.paramMap.get('id'));
    const cursos$ =
      this.cursoService.cursos().length === 0
        ? this.cursoService.carregarCursos()
        : of(this.cursoService.cursos());

    cursos$.subscribe(() => {
      this.curso.set(this.cursoService.buscarCursoPorId(cursoId));
      const usuario = this.auth.usuario();
      if (usuario) {
        this.cursoService.carregarMinhasMatriculas(usuario.id).subscribe();
      }
      this.cursoService.carregarVideosPorCurso(cursoId).subscribe((aulas) => {
        this.videos.set(aulas);
      });
    });
  }

  protected inscrever(): void {
    const c = this.curso();
    const usuario = this.auth.usuario();
    if (!c || !usuario) return;

    this.matriculando.set(true);
    this.cursoService
      .matricular({
        nome: usuario.name,
        email: usuario.email,
        cursoId: c.id,
        userId: usuario.id,
        horasAssistidas: 0,
      })
      .subscribe(() => this.matriculando.set(false));
  }

  protected assistirAula(aula: Video): void {
    const entrou = this.jaMatriculado();

    this.dialog.open(VideoDialog, {
      data: {
        titulo: aula.titulo,
        youtubeId: aula.youtubeId,
        preview: !entrou,
      },
      width: '800px',
      maxWidth: '95vw',
    });
  }
}
