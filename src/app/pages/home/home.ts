import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { map } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly title = signal('capacita-web');
  protected auth = inject(AuthService);
  protected readonly isBackoffice = this.auth.ehBackoffice;
  private router = inject(Router);
  private breakpoints = inject(BreakpointObserver);

  // true em telas com menos de 600 px
  protected readonly isMobile = toSignal(
    this.breakpoints.observe(Breakpoints.XSmall).pipe(map((estado) => estado.matches)),
    { initialValue: false },
  );

  protected sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}