import { Directive, effect, inject, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user';

@Directive({
  selector: '[appRole]',
  standalone: true,
})
export class RoleDirective {
  private readonly auth = inject(AuthService);
  private readonly view = inject(ViewContainerRef);
  private readonly template = inject(TemplateRef<unknown>);
  private hasView = false;
  private roles: Role[] = [];

  @Input()
  set appRole(value: Role | Role[]) {
    this.roles = Array.isArray(value) ? value : [value];
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.updateView();
    });
  }

  private updateView(): void {
    const userRole = this.auth.usuario()?.role;
    const allowed = userRole ? this.roles.includes(userRole) : false;

    if (allowed && !this.hasView) {
      this.view.createEmbeddedView(this.template);
      this.hasView = true;
      return;
    }

    if (!allowed && this.hasView) {
      this.view.clear();
      this.hasView = false;
    }
  }
}
