import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Curso } from '../models/curso.model';
import { Matricula } from '../models/matricula.model';
import { Video } from '../models/video.model';

@Service()
export class CursoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';

  readonly cursos = signal<Curso[]>([]);
  readonly matriculas = signal<Matricula[]>([]);
  readonly videos = signal<Video[]>([]);

  async carregarCursos(): Promise<void> {
    const dados = await firstValueFrom(this.http.get<Curso[]>(`${this.apiUrl}/cursos`));
    this.cursos.set(dados);
  }

  async carregarMinhasMatriculas(userId: string): Promise<void> {
    const dados = await firstValueFrom(
      this.http.get<Matricula[]>(`${this.apiUrl}/matriculas`, {
        params: { userId },
      }),
    );
    this.matriculas.set(dados);
  }

  async carregarVideosPorCurso(cursoId: number): Promise<Video[]> {
    return firstValueFrom(
      this.http.get<Video[]>(`${this.apiUrl}/videos`, {
        params: { cursoId: cursoId.toString() },
      }),
    );
  }

  buscarCursoPorId(id: number): Curso | undefined {
    return this.cursos().find((c) => c.id === id);
  }

  async matricular(matricula: Matricula): Promise<Matricula> {
    const criada = await firstValueFrom(
      this.http.post<Matricula>(`${this.apiUrl}/matriculas`, matricula),
    );
    this.matriculas.update((atual) => [...atual, criada]);
    return criada;
  }
}
