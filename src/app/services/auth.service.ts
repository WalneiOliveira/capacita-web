import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Authentication } from '../models/authentication';
import { Credentials, DadosRegistro } from '../models/credentials';
import { User } from '../models/user';

const CHAVE_TOKEN = 'capacita-web-token';
const CHAVE_USUARIO = 'capacita-web-usuario';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';

  private readonly tokenSignal = signal<string | null>(sessionStorage.getItem(CHAVE_TOKEN));
  private readonly usuarioSignal = signal<User | null>(
    JSON.parse(sessionStorage.getItem(CHAVE_USUARIO) ?? 'null'),
  );

  readonly token = this.tokenSignal.asReadonly();
  readonly usuario = this.usuarioSignal.asReadonly();

  readonly estaLogado = computed(() => this.tokenSignal() !== null);
  readonly ehBackoffice = computed(() => this.usuarioSignal()?.role === 'backoffice');

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
