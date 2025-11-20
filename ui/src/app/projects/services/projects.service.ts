import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { extractErrorMessage } from '../../shared/utils/error-handling.util';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  lastUpdatedAt: Date;
  lastUpdatedBy: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  readonly #apiUrl = 'http://localhost:3000/api';
  readonly #projectsSignal = signal<Project[]>([]);
  readonly #http = inject(HttpClient);

  get projects() {
    return this.#projectsSignal.asReadonly();
  }

  createProject(request: CreateProjectRequest): Observable<Project> {
    return this.#http.post<Project>(`${this.#apiUrl}/projects`, request).pipe(
      tap((project) => {
        // Add the new project to the beginning of the list
        this.#projectsSignal.update((projects) => [project, ...projects]);
      }),
      catchError(this.handleError),
    );
  }

  fetchAllProjects(): Observable<Project[]> {
    return this.#http.get<Project[]>(`${this.#apiUrl}/projects`).pipe(
      tap((projects) => {
        this.#projectsSignal.set(projects);
      }),
      catchError(this.handleError),
    );
  }

  getProjectById(id: string): Observable<Project> {
    return this.#http
      .get<Project>(`${this.#apiUrl}/projects/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = extractErrorMessage(error);
    return throwError(() => new Error(errorMessage));
  }
}
