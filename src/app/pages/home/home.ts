import { RouterLinkActive, RouterLinkWithHref, RouterOutlet } from '@angular/router';
import { Component, signal } from '@angular/core';

import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-home',
  imports: [MatToolbarModule, RouterOutlet, RouterLinkWithHref, RouterLinkActive],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly title = signal('capacita-web');
}
