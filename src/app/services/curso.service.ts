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
  buscarCursoPorId(id: number): Curso | undefined {
    return this.cursos().find((c) => c.id === id);
  }
  matricular(matricula: Matricula): Observable<Matricula> {
    return this.http
      .post<Matricula>(`${this.apiUrl}/matriculas`, matricula)
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
}
