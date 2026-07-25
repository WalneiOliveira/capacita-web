export type Role = 'aluno' | 'backoffice';
export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: Role;
}
