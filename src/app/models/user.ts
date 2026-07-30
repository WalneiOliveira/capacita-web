export type Role = 'aluno' | 'backoffice';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  isActive: boolean;
}
