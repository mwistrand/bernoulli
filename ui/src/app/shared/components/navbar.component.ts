import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, UserIcon, LogOutIcon, ShieldIcon } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService, UserRole } from '../../auth/services/auth.service';

@Component({
  standalone: true,
  selector: 'bn-navbar',
  imports: [LucideAngularModule, TranslateModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  protected readonly UserIcon = UserIcon;
  protected readonly LogOutIcon = LogOutIcon;
  protected readonly ShieldIcon = ShieldIcon;
  protected readonly UserRole = UserRole;

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
