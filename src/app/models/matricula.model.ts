import { Curso } from './curso.model';
import { User } from './user';
export interface Matricula {
  id?: number;
  nome: string;
  email: string;
  cursoId: Curso['id'];
  userId: User['id'];
  horasAssistidas: number;
  dataMatricula?: string;
}
