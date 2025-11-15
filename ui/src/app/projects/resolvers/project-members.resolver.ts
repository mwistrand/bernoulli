import { inject, Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProjectMembersService, ProjectMember } from '../services/project-members.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectMembersResolver implements Resolve<ProjectMember[]> {
  readonly #projectMembersService = inject(ProjectMembersService);

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ProjectMember[]> {
    const projectId = route.paramMap.get('id');
    if (!projectId) return of([]);
    return this.#projectMembersService.getProjectMembers(projectId).pipe(catchError(() => of([])));
  }
}
