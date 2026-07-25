import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Authentication } from '../models/authentication';
import { Credentials, DadosRegistro } from '../models/credentials';
import { User } from '../models/user';
const CHAVE_TOKEN = 'capacita-web-token';
const CHAVE_USUARIO = 'capacita-web-usuario';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';
  private tokenSignal = signal<string | null>(sessionStorage.getItem(CHAVE_TOKEN));
  private usuarioSignal = signal<User | null>(
    JSON.parse(sessionStorage.getItem(CHAVE_USUARIO) ?? 'null'),
  );
  token = this.tokenSignal.asReadonly();
  usuario = this.usuarioSignal.asReadonly();
  estaLogado = computed(() => this.tokenSignal() !== null);
  ehBackoffice = computed(() => this.usuarioSignal()?.role === 'backoffice');
  async login(credenciais: Credentials): Promise<void> {
    const resposta = await firstValueFrom(
      this.http.post<Authentication>(`${this.apiUrl}/login`, credenciais),
    );
    this.salvarSessao(resposta);
  }
  async registrar(dados: DadosRegistro): Promise<void> {
    const resposta = await firstValueFrom(
      this.http.post<Authentication>(`${this.apiUrl}/register`, dados),
    );
    this.salvarSessao(resposta);
  }
  logout(): void {
    sessionStorage.removeItem(CHAVE_TOKEN);
    sessionStorage.removeItem(CHAVE_USUARIO);
    this.tokenSignal.set(null);
    this.usuarioSignal.set(null);
  }
  private salvarSessao(resposta: Authentication): void {
    sessionStorage.setItem(CHAVE_TOKEN, resposta.accessToken);
    sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(resposta.user));
    this.tokenSignal.set(resposta.accessToken);
    this.usuarioSignal.set(resposta.user);
  }
}
