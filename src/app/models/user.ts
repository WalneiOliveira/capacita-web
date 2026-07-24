export type Role = 'aluno' | 'backoffice';

export class User {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public password: string,
    public isActive: boolean,
    public role: Role,
  ) {}
}
