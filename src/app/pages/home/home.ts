import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-home',
  imports: [MatToolbarModule, MatButtonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly title = signal('capacita-web');
  protected auth = inject(AuthService);
  protected readonly isBackoffice = this.auth.ehBackoffice;
  private router = inject(Router);
  protected sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
