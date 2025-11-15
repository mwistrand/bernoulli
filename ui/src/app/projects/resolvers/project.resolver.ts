import { inject, Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProjectsService, Project } from '../services/projects.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectResolver implements Resolve<Project | null> {
  readonly #projectsService = inject(ProjectsService);

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Project | null> {
    const id = route.paramMap.get('id');
    if (!id) return of(null);
    return this.#projectsService.getProjectById(id).pipe(catchError(() => of(null)));
  }
}
