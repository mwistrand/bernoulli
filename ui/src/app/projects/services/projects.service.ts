import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';

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

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 409) {
        errorMessage = 'A project with this name already exists';
      } else if (error.status === 400) {
        // Extract validation error messages
        if (error.error?.message) {
          if (Array.isArray(error.error.message)) {
            errorMessage = error.error.message.join(', ');
          } else {
            errorMessage = error.error.message;
          }
        }
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server';
      } else {
        errorMessage = error.error?.message || errorMessage;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
