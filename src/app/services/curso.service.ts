import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Curso } from '../models/curso.model';
import { Matricula } from '../models/matricula.model';
import { Video } from '../models/video.model';

@Service()
export class CursoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';
  readonly cursos = signal<Curso[]>([]);
  readonly matriculas = signal<Matricula[]>([]);

  carregarCursos(): Observable<Curso[]> {
    return this.http
      .get<Curso[]>(`${this.apiUrl}/cursos`)
      .pipe(tap((dados) => this.cursos.set(dados)));
  }

  carregarMinhasMatriculas(userId: string): Observable<Matricula[]> {
    return this.http
      .get<Matricula[]>(`${this.apiUrl}/matriculas`, { params: { userId } })
      .pipe(tap((dados) => this.matriculas.set(dados)));
  }

  carregarVideosPorCurso(cursoId: number): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/videos`, {
      params: { cursoId: cursoId.toString() },
    });
  }

  adicionarVideo(video: Omit<Video, 'id'>): Observable<Video> {
    return this.http.post<Video>(`${this.apiUrl}/videos`, video);
  }

  excluirVideo(videoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/videos/${videoId}`);
  }

  buscarCursoPorId(id: number): Curso | undefined {
    return this.cursos().find((c) => c.id === id);
  }

  createCurso(curso: Omit<Curso, 'id'>): Observable<Curso> {
    return this.http
      .post<Curso>(`${this.apiUrl}/cursos`, curso)
      .pipe(tap((novoCurso) => this.cursos.update((atual) => [...atual, novoCurso])));
  }

  updateCurso(curso: Curso): Observable<Curso> {
    return this.http
      .put<Curso>(`${this.apiUrl}/cursos/${curso.id}`, curso)
      .pipe(
        tap((atualizado) =>
          this.cursos.update((lista) =>
            lista.map((item) => (item.id === atualizado.id ? atualizado : item)),
          ),
        ),
      );
  }

  deleteCurso(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/cursos/${id}`)
      .pipe(tap(() => this.cursos.update((lista) => lista.filter((item) => item.id !== id))));
  }

  matricular(matricula: Matricula): Observable<Matricula> {
    const payload = {
      ...matricula,
      dataMatricula: new Date().toISOString().split('T')[0], // salva como "YYYY-MM-DD"
    };

    return this.http
      .post<Matricula>(`${this.apiUrl}/matriculas`, payload)
      .pipe(tap((criada) => this.matriculas.update((atual) => [...atual, criada])));
  }

  atualizarProgresso(matriculaId: number, horasAdicionais: number): Observable<Matricula> {
    const atual = this.matriculas().find((m) => m.id === matriculaId);
    const novoTotal = Math.max(0, (atual?.horasAssistidas ?? 0) + horasAdicionais);

    return this.http
      .patch<Matricula>(`${this.apiUrl}/matriculas/${matriculaId}`, { horasAssistidas: novoTotal })
      .pipe(
        tap((atualizada) => {
          this.matriculas.update((lista) =>
            lista.map((m) => (m.id === matriculaId ? { ...m, ...atualizada } : m)),
          );
        }),
      );
  }

  cancelarMatricula(matriculaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/matriculas/${matriculaId}`).pipe(
      tap(() => {
        this.matriculas.update((lista) => lista.filter((m) => m.id !== matriculaId));
      }),
    );
  }
}
