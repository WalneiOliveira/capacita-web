import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CursoService } from '../../services/curso.service';
import { AuthService } from '../../services/auth.service';
import { Curso } from '../../models/curso.model';
@Component({
  selector: 'app-curso-detalhe',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatChipsModule, MatIconModule],
  templateUrl: './curso-detalhe.html',
  styleUrl: './curso-detalhe.scss',
})
export class CursoDetalhe implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private auth = inject(AuthService);
  protected cursoService = inject(CursoService);
  protected curso = signal<Curso | undefined>(undefined);
  protected videosSeguro = signal<{ titulo: string; url: SafeResourceUrl }[]>([]);
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
      this.cursoService.carregarVideosPorCurso(cursoId).subscribe((videos) => {
        this.videosSeguro.set(
          videos.map((v) => ({
            titulo: v.titulo,
            url: this.sanitizer.bypassSecurityTrustResourceUrl(
              `https://www.youtube-nocookie.com/embed/${v.youtubeId}`,
            ),
          })),
        );
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
}
