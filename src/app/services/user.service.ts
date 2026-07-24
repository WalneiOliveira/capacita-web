import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

import { User } from '../models/user';
import { Observable } from 'rxjs';

@Service()
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `http://localhost:3000/users`;

  createUser(user: User): Observable<void> {
    return this.http.post<void>(this.baseUrl, user);
  }

  updateUser(user: User): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${user.id}`, user);
  }

  deleteUserById(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  findUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  findAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }
}
