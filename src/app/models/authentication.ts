import { User } from './user';
export interface Authentication {
  accessToken: string;
  user: User;
}
