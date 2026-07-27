import { Matricula } from './matricula.model';
import { Curso } from './curso.model';


export interface CursoComProgresso {
  curso: Curso;
  matricula: Matricula;
  porcentagemConcluida: number;
}