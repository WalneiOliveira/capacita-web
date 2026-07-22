import { Curso } from './curso.model';
export interface Aluno {
  id?: number;          // propriedade opcional
  nome: string;
  email: string;
  cursoId: Curso['id']; // indexed access type (tipo de acesso indexado)
  horasAssistidas: number;
}
