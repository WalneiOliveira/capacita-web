import { Curso } from './curso.model';
export interface Video {
  id: number;
  cursoId: Curso['id'];
  titulo: string;
  youtubeId: string;
}
