import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CursoService } from '../../services/curso.service';
import { UserService } from '../../services/user.service';
import { Curso } from '../../models/curso.model';
import { User } from '../../models/user';

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
    ReactiveFormsModule,
  ],
  templateUrl: './backoffice.html',
  styleUrl: './backoffice.scss',
})
export class Backoffice implements OnInit {
  protected readonly cursoService = inject(CursoService);
  protected readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  protected readonly usuarios = signal<User[]>([]);
  protected readonly editingCursoId = signal<number | null>(null);
  protected readonly cursos = computed(() => this.cursoService.cursos());
  protected readonly displayedColumnsUsuarios = ['name', 'email', 'role', 'status', 'actions'];
  protected readonly displayedColumnsCursos = ['nome', 'nivel', 'horas', 'actions'];

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

  ngOnInit(): void {
    this.cursoService.carregarCursos().subscribe();
    this.carregarUsuarios();
  }

  protected carregarUsuarios(): void {
    this.userService.findAllUsers().subscribe({
      next: (dados) => this.usuarios.set(dados),
    });
  }

  protected toggleAtivo(usuario: User): void {
    const atualizado: User = { ...usuario, isActive: !usuario.isActive };
    this.userService.updateUser(atualizado).subscribe(() => {
      this.usuarios.update((lista) =>
        lista.map((item) => (item.id === atualizado.id ? atualizado : item)),
      );
    });
  }

  protected excluirUsuario(usuario: User): void {
    const confirmou = confirm(`Deseja remover o usuário "${usuario.name}"?`);
    if (!confirmou) {
      return;
    }

    this.userService.deleteUserById(usuario.id).subscribe(() => {
      this.usuarios.update((lista) => lista.filter((item) => item.id !== usuario.id));
    });
  }

  protected editarCurso(curso: Curso): void {
    this.editingCursoId.set(curso.id);
    this.cursoForm.setValue({ nome: curso.nome, nivel: curso.nivel, horas: curso.horas });
  }

  protected cancelarEdicao(): void {
    this.editingCursoId.set(null);
    this.cursoForm.reset({ nome: '', nivel: 'básico', horas: 0 });
  }

  protected salvarCurso(): void {
    if (this.cursoForm.invalid) {
      this.cursoForm.markAllAsTouched();
      return;
    }

    const payload = this.cursoForm.getRawValue();

    if (this.editingCursoId()) {
      this.cursoService
        .updateCurso({ id: this.editingCursoId()!, ...payload })
        .subscribe(() => this.cancelarEdicao());
      return;
    }

    this.cursoService.createCurso(payload).subscribe(() => {
      this.cursoForm.reset({ nome: '', nivel: 'básico', horas: 0 });
    });
  }

  protected excluirCurso(curso: Curso): void {
    const confirmou = confirm(`Deseja excluir o curso "${curso.nome}"?`);
    if (!confirmou) {
      return;
    }

    this.cursoService.deleteCurso(curso.id).subscribe();
  }

  protected isEditingCurso(): boolean {
    return this.editingCursoId() !== null;
  }
}
