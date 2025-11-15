import { inject, Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of, combineLatest } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ProjectMembersService, ProjectMember } from '../services/project-members.service';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class CurrentMemberResolver implements Resolve<ProjectMember | null> {
  readonly #projectMembersService = inject(ProjectMembersService);
  readonly #authService = inject(AuthService);

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<ProjectMember | null> {
    const projectId = route.paramMap.get('id');
    if (!projectId) return of(null);

    const currentUser = this.#authService.currentUser();
    if (!currentUser) return of(null);

    return this.#projectMembersService.getProjectMembers(projectId).pipe(
      map((members) => members.find((m) => m.userId === currentUser.id) || null),
      catchError(() => of(null)),
    );
  }
}
