import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';
import { catchError, map, of, take } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.getCurrentUser().pipe(
    take(1),
    map((user) => {
      if (user == null) {
        router.navigate(['/login']);
        return false;
      }
      if (user.role !== UserRole.ADMIN) {
        router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    }),
  );
};
