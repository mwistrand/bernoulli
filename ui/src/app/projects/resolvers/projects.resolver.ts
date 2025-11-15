import { inject, Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProjectsService, Project } from '../services/projects.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectsResolver implements Resolve<Project[]> {
  readonly #projectsService = inject(ProjectsService);

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Project[]> {
    return this.#projectsService.fetchAllProjects().pipe(
      map(() => this.#projectsService.projects()),
      catchError(() => of([])),
    );
  }
}
