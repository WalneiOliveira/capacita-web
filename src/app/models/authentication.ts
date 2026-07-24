import { User } from './user';

export class Authentication {
  constructor(
    public accessToken: string,
    public user: User,
  ) {}
}
