import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { CursoService } from '../../services/curso.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Curso } from '../../models/curso.model';
import { User } from '../../models/user';
import { Video } from '../../models/video.model';
import { Matricula } from '../../models/matricula.model';

export interface UltimaMatriculaInfo {
  alunoNome: string;
  email: string;
  senhaTemporaria: string;
  cursoNome: string;
}

/**
 * Evita que campos vazios apareçam em vermelho apenas porque o form já foi submetido.
 * O campo só fica com estado visual de erro se estiver inválido e o utilizador tiver
 * tocado ou alterado o campo.
 */
class TouchedDirtyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null): boolean {
    return !!control && control.invalid && (control.touched || control.dirty);
  }
}

@Component({
  selector: 'app-backoffice',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
    ReactiveFormsModule,
  ],
  providers: [
    {
      provide: ErrorStateMatcher,
      useClass: TouchedDirtyErrorStateMatcher,
    },
  ],
  templateUrl: './backoffice.html',
  styleUrl: './backoffice.scss',
})
export class Backoffice implements OnInit {
  protected readonly cursoService = inject(CursoService);
  protected readonly userService = inject(UserService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly usuarios = signal<User[]>([]);
  protected readonly editingCursoId = signal<number | null>(null);
  protected readonly editingUsuarioId = signal<string | null>(null);
  protected readonly selectedTabIndex = signal(0);
  protected readonly cursos = computed(() => this.cursoService.cursos());

  protected readonly ultimaMatriculaCriada = signal<UltimaMatriculaInfo | null>(null);

  protected readonly displayedColumnsUsuarios = ['name', 'email', 'role', 'status', 'actions'];
  protected readonly displayedColumnsCursos = ['nome', 'nivel', 'horas', 'actions'];

  protected readonly cursoSelecionadoParaVideos = signal<Curso | null>(null);
  protected readonly videosDoCurso = signal<Video[]>([]);

  protected cursoForm = this.fb.group({
    nome: this.fb.control('', { nonNullable: true, validators: Validators.required }),
    nivel: this.fb.control<Curso['nivel']>('básico', {
      nonNullable: true,
      validators: Validators.required,
    }),
    horas: this.fb.control(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  protected usuarioForm = this.fb.group({
    name: this.fb.control('', { nonNullable: true, validators: Validators.required }),
    email: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    role: this.fb.control<User['role']>('aluno', {
      nonNullable: true,
      validators: Validators.required,
    }),
  });

  protected videoForm = this.fb.group({
    titulo: this.fb.control('', { nonNullable: true, validators: Validators.required }),
    youtubeId: this.fb.control('', { nonNullable: true, validators: Validators.required }),
  });

  protected matriculaForm = this.fb.group({
    nomeAluno: this.fb.control('', { nonNullable: true, validators: Validators.required }),
    emailAluno: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    cursoId: this.fb.control<number | null>(null, {
      validators: Validators.required,
    }),
  });

  ngOnInit(): void {
    this.cursoService.carregarCursos().subscribe((cursos) => {
      if (cursos && cursos.length > 0) {
        this.definirCursoParaVideos(cursos[0]);
      }
    });

    this.carregarUsuarios();
  }

  protected sair(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private resetarEstadoFormulario(form: FormGroup): void {
    form.markAsPristine();
    form.markAsUntouched();

    Object.values(form.controls).forEach((control) => {
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });

    form.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Mostra uma mensagem temporária simples.
   * Usado para feedbacks como sucesso, erro e informação.
   */
  private mostrarMensagem(mensagem: string, duration = 3000): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration,
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  }

  /**
   * Mostra uma confirmação usando MatSnackBar.
   * Deve ser usado apenas para ações destrutivas, como excluir/remover.
   *
   * A ação só acontece quando o utilizador clica no botão do snackbar.
   */
  private confirmarExclusao(mensagem: string, textoAcao = 'Excluir', duration = 6000) {
    return this.snackBar
      .open(mensagem, textoAcao, {
        duration,
        verticalPosition: 'top',
        horizontalPosition: 'center',
        panelClass: 'warning-snackbar',
      })
      .onAction();
  }

  // --- GESTÃO DE CURSOS ---

  protected isEditingCurso(): boolean {
    return this.editingCursoId() !== null;
  }

  protected salvarCurso(): void {
    if (this.cursoForm.invalid) {
      this.cursoForm.markAllAsTouched();
      return;
    }

    const dadosCurso = this.cursoForm.getRawValue();

    if (this.isEditingCurso()) {
      const id = this.editingCursoId();
      if (id === null) return;

      const cursoAtualizado: Curso = { id, ...dadosCurso };

      this.cursoService.updateCurso(cursoAtualizado).subscribe({
        next: () => {
          this.mostrarMensagem('Curso atualizado com sucesso!');
          this.cancelarEdicao();
        },
        error: () => this.mostrarMensagem('Erro ao atualizar curso.'),
      });

      return;
    }

    this.cursoService.createCurso(dadosCurso).subscribe({
      next: () => {
        this.mostrarMensagem('Curso adicionado com sucesso!');
        this.cursoForm.reset({ nome: '', nivel: 'básico', horas: 0 });
        this.resetarEstadoFormulario(this.cursoForm);
      },
      error: () => this.mostrarMensagem('Erro ao cadastrar curso.'),
    });
  }

  protected editarCurso(curso: Curso): void {
    this.editingCursoId.set(curso.id);
    this.cursoForm.patchValue({
      nome: curso.nome,
      nivel: curso.nivel,
      horas: curso.horas,
    });
  }

  protected cancelarEdicao(): void {
    this.editingCursoId.set(null);
    this.cursoForm.reset({ nome: '', nivel: 'básico', horas: 0 });
    this.resetarEstadoFormulario(this.cursoForm);
  }

  protected excluirCurso(curso: Curso): void {
    this.confirmarExclusao(`Excluir o curso "${curso.nome}"?`, 'Excluir').subscribe(() => {
      this.cursoService.deleteCurso(curso.id).subscribe({
        next: () => {
          this.mostrarMensagem('Curso removido com sucesso!');

          if (this.editingCursoId() === curso.id) {
            this.cancelarEdicao();
          }
        },
        error: () => this.mostrarMensagem('Erro ao excluir curso.'),
      });
    });
  }

  // --- GESTÃO DE VÍDEOS ---

  private definirCursoParaVideos(curso: Curso): void {
    this.cursoSelecionadoParaVideos.set(curso);
    this.carregarVideosDoCursoAtual(curso.id);
  }

  protected selecionarCursoParaVideos(curso: Curso): void {
    this.definirCursoParaVideos(curso);
    this.selectedTabIndex.set(1);
  }

  private carregarVideosDoCursoAtual(cursoId: number): void {
    this.cursoService.carregarVideosPorCurso(cursoId).subscribe({
      next: (vids) => this.videosDoCurso.set(vids),
      error: () => this.mostrarMensagem('Erro ao carregar vídeos do curso.'),
    });
  }

  protected salvarVideo(): void {
    const cursoAtual = this.cursoSelecionadoParaVideos();

    if (!cursoAtual) {
      this.mostrarMensagem('Selecione um curso primeiro.');
      return;
    }

    if (this.videoForm.invalid) {
      this.videoForm.markAllAsTouched();
      return;
    }

    const novoVideo = {
      ...this.videoForm.getRawValue(),
      cursoId: cursoAtual.id,
    };

    this.cursoService.adicionarVideo(novoVideo).subscribe({
      next: () => {
        this.mostrarMensagem('Vídeo adicionado com sucesso!');
        this.videoForm.reset({ titulo: '', youtubeId: '' });
        this.resetarEstadoFormulario(this.videoForm);
        this.carregarVideosDoCursoAtual(cursoAtual.id);
      },
      error: () => this.mostrarMensagem('Erro ao adicionar vídeo.'),
    });
  }

  protected removerVideo(videoId: number): void {
    this.confirmarExclusao('Remover este vídeo?', 'Remover').subscribe(() => {
      this.cursoService.excluirVideo(videoId).subscribe({
        next: () => {
          this.mostrarMensagem('Vídeo removido com sucesso!');

          const cursoAtual = this.cursoSelecionadoParaVideos();

          if (cursoAtual) {
            this.carregarVideosDoCursoAtual(cursoAtual.id);
          }
        },
        error: () => this.mostrarMensagem('Erro ao remover vídeo.'),
      });
    });
  }

  // --- GESTÃO DE USUÁRIOS ---

  protected carregarUsuarios(): void {
    this.userService.findAllUsers().subscribe({
      next: (dados) => this.usuarios.set(dados),
      error: () => this.mostrarMensagem('Erro ao carregar usuários.'),
    });
  }

  protected isEditingUsuario(): boolean {
    return this.editingUsuarioId() !== null;
  }

  protected salvarUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const dados = this.usuarioForm.getRawValue();

    if (this.isEditingUsuario()) {
      const id = this.editingUsuarioId();

      if (id === null) return;

      const userAtual = this.usuarios().find((u) => u.id === id);

      if (!userAtual) {
        this.mostrarMensagem('Usuário não encontrado para atualização.');
        return;
      }

      const userAtualizado: User = {
        ...userAtual,
        id,
        name: dados.name,
        email: dados.email,
        role: dados.role,
        isActive: userAtual.isActive ?? true,
      };

      this.userService.updateUser(userAtualizado).subscribe({
        next: () => {
          this.mostrarMensagem('Usuário atualizado com sucesso!');
          this.cancelarEdicaoUsuario();
          this.carregarUsuarios();
        },
        error: () => this.mostrarMensagem('Erro ao atualizar usuário.'),
      });

      return;
    }

    const novoUser: Partial<User> = {
      ...dados,
      isActive: true,
    };

    this.userService.createUser(novoUser).subscribe({
      next: () => {
        this.mostrarMensagem('Usuário cadastrado com sucesso!');
        this.usuarioForm.reset({ name: '', email: '', role: 'aluno' });
        this.resetarEstadoFormulario(this.usuarioForm);
        this.carregarUsuarios();
      },
      error: () => this.mostrarMensagem('Erro ao cadastrar usuário.'),
    });
  }

  protected editarUsuario(user: User): void {
    this.editingUsuarioId.set(user.id);
    this.usuarioForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }

  protected cancelarEdicaoUsuario(): void {
    this.editingUsuarioId.set(null);
    this.usuarioForm.reset({ name: '', email: '', role: 'aluno' });
    this.resetarEstadoFormulario(this.usuarioForm);
  }

  protected toggleAtivo(user: User): void {
    const usuarioAtualizado: User = { ...user, isActive: !user.isActive };

    this.userService.updateUser(usuarioAtualizado).subscribe({
      next: () => {
        this.mostrarMensagem(
          usuarioAtualizado.isActive
            ? 'Usuário ativado com sucesso!'
            : 'Usuário desativado com sucesso!',
        );

        this.carregarUsuarios();
      },
      error: () => this.mostrarMensagem('Erro ao alterar status do usuário.'),
    });
  }

  protected excluirUsuario(user: User): void {
    this.confirmarExclusao(`Excluir o usuário "${user.name}"?`, 'Excluir').subscribe(() => {
      this.userService.deleteUserById(user.id).subscribe({
        next: () => {
          this.mostrarMensagem('Usuário excluído com sucesso!');
          this.carregarUsuarios();
        },
        error: () => this.mostrarMensagem('Erro ao excluir usuário.'),
      });
    });
  }

  // --- MATRÍCULAS ---

  protected realizarMatricula(): void {
    if (this.matriculaForm.invalid) {
      this.matriculaForm.markAllAsTouched();
      return;
    }

    const { nomeAluno, emailAluno, cursoId } = this.matriculaForm.getRawValue();

    if (cursoId === null) {
      this.mostrarMensagem('Selecione um curso para realizar a matrícula.');
      return;
    }

    const cursoEncontrado = this.cursos().find((c) => c.id === cursoId);
    const senhaTemporaria = `Temp#${Math.floor(1000 + Math.random() * 9000)}`;

    const novoUsuario: Partial<User> = {
      name: nomeAluno,
      email: emailAluno,
      password: senhaTemporaria,
      role: 'aluno',
      isActive: true,
    };

    this.userService.createUser(novoUsuario).subscribe({
      next: (usuarioCriado: User) => {
        const payloadMatricula: Matricula = {
          nome: usuarioCriado.name,
          email: usuarioCriado.email,
          cursoId,
          userId: usuarioCriado.id,
          horasAssistidas: 0,
        } as Matricula;

        this.cursoService.matricular(payloadMatricula).subscribe({
          next: () => {
            this.mostrarMensagem('Matrícula efetuada com sucesso!', 4000);

            this.ultimaMatriculaCriada.set({
              alunoNome: usuarioCriado.name,
              email: usuarioCriado.email,
              senhaTemporaria,
              cursoNome: cursoEncontrado?.nome || '',
            });

            this.matriculaForm.reset({
              nomeAluno: '',
              emailAluno: '',
              cursoId: null,
            });
            this.resetarEstadoFormulario(this.matriculaForm);
            this.carregarUsuarios();
          },
          error: () => {
            this.mostrarMensagem('Erro ao vincular matrícula no curso.', 4000);
          },
        });
      },
      error: () => {
        this.mostrarMensagem('Erro ao cadastrar aluno. Verifique o e-mail.', 4000);
      },
    });
  }
}
