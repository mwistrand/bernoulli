import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  summary?: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  lastUpdatedAt: Date;
  lastUpdatedBy: string;
}

export interface CreateTaskRequest {
  title: string;
  summary?: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  readonly #apiUrl = 'http://localhost:3000/api';
  readonly #tasksSignal = signal<Record<string, Task[]>>({});
  readonly #http = inject(HttpClient);

  get tasks() {
    return this.#tasksSignal.asReadonly();
  }

  getTasksByProjectId(projectId: string): Task[] {
    return this.#tasksSignal()[projectId] || [];
  }

  createTask(projectId: string, request: CreateTaskRequest): Observable<Task> {
    return this.#http.post<Task>(`${this.#apiUrl}/projects/${projectId}/tasks`, request).pipe(
      tap((task) => {
        // Add the new task to the beginning of the project's task list
        this.#tasksSignal.update((tasks) => {
          const projectTasks = tasks[projectId] || [];
          return {
            ...tasks,
            [projectId]: [task, ...projectTasks],
          };
        });
      }),
      catchError(this.handleError),
    );
  }

  fetchTasksByProjectId(projectId: string): Observable<Task[]> {
    return this.#http.get<Task[]>(`${this.#apiUrl}/projects/${projectId}/tasks`).pipe(
      tap((tasks) => {
        this.#tasksSignal.update((currentTasks) => ({
          ...currentTasks,
          [projectId]: tasks,
        }));
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
      if (error.status === 400) {
        // Extract validation error messages
        if (error.error?.message) {
          if (Array.isArray(error.error.message)) {
            errorMessage = error.error.message.join(', ');
          } else {
            errorMessage = error.error.message;
          }
        }
      } else if (error.status === 404) {
        errorMessage = 'Project not found';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server';
      } else {
        errorMessage = error.error?.message || errorMessage;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
