import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { Credentials } from '../../models/credentials';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormField, MatInputModule, MatButtonModule, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {

  showError = false

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  constructor(private router: Router, private auth:AuthService) {}

  onSubmit() {
    const email = this.loginForm.value.email!!;
    const password = this.loginForm.value.password!!;

    const credentials = new Credentials(email, password);
    this.auth.login(credentials).subscribe({
      next: () => {
        this.router.navigate(['/dashboard'])
      },
      error: () => {
        this.showError = true
      }
    })
  }
}
