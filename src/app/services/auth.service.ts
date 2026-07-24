import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Authentication } from '../models/authentication';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Credentials } from '../models/credentials';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  login(credentials: Credentials): Observable<Authentication> {
    return this.http.post<Authentication>('http://localhost:3000/login', credentials).pipe(
      tap((response) => {
        if (response && response.accessToken) {
          sessionStorage.setItem('token', response.accessToken);
        }
      }),
      catchError(() => {
        return throwError(() => new Error('Authentication failed.'));
      }),
    );
  }

  isAuthenticated(): boolean {
    const token = sessionStorage.getItem('token');
    if (!token) return false;
    return true;
  }

  getToken(): string {
    const token = sessionStorage.getItem('token');
    if (!token) return '';
    return token;
  }

  logout(): void {
    sessionStorage.removeItem('token');
  }
}
