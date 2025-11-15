import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  standalone: true,
  selector: 'bn-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  readonly #authService = inject(AuthService);
  readonly #router = inject(Router);

  protected readonly currentUser = this.#authService.currentUser;

  onSignOut(): void {
    this.#authService.logout().subscribe({
      next: () => {
        this.#router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Failed to sign out:', error);
        // Even if the server request fails, clear local state and redirect
        this.#router.navigate(['/login']);
      },
    });
  }
}
