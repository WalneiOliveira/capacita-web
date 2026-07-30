import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-trocar-senha',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './trocar-senha.html',
  styleUrl: './trocar-senha.scss',
})
export class TrocarSenha {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  mensagemErro = signal<string | null>(null);
  carregando = signal<boolean>(false);

  form = this.fb.group({
    senhaAtual: ['', [Validators.required]],
    novaSenha: ['', [Validators.required, Validators.minLength(6)]],
    confirmarSenha: ['', [Validators.required]],
  });

  salvarNovaSenha(): void {
    this.mensagemErro.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { senhaAtual, novaSenha, confirmarSenha } = this.form.value;

    if (novaSenha !== confirmarSenha) {
      this.mensagemErro.set('A nova senha e a confirmação não conferem.');
      return;
    }

    if (senhaAtual === novaSenha) {
      this.mensagemErro.set('A nova senha deve ser diferente da senha atual.');
      return;
    }

    this.carregando.set(true);

    this.authService.alterarSenha(senhaAtual!, novaSenha!).subscribe({
      next: () => {
        this.carregando.set(false);
        // Ao alterar com sucesso, redireciona para a rota padrão (o roleRedirectGuard levará para hero ou backoffice)
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.carregando.set(false);
        this.mensagemErro.set(
          err.error?.error || 'Erro ao alterar a senha. Verifique se a senha atual está correta.'
        );
      },
    });
  }
}