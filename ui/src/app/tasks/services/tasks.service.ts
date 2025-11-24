import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { extractErrorMessage } from '../../shared/utils/error-handling.util';

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

export interface UpdateTaskRequest {
  title?: string;
  summary?: string | null;
  description?: string;
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

  fetchTaskById(projectId: string, taskId: string): Observable<Task> {
    return this.#http
      .get<Task>(`${this.#apiUrl}/projects/${projectId}/tasks/${taskId}`)
      .pipe(catchError(this.handleError));
  }

  updateTask(projectId: string, taskId: string, request: UpdateTaskRequest): Observable<Task> {
    return this.#http
      .patch<Task>(`${this.#apiUrl}/projects/${projectId}/tasks/${taskId}`, request)
      .pipe(
        tap((updatedTask) => {
          // Update the task in the project's task list
          this.#tasksSignal.update((tasks) => {
            const projectTasks = tasks[projectId] || [];
            const updatedTasks = projectTasks.map((task) =>
              task.id === taskId ? updatedTask : task,
            );
            return {
              ...tasks,
              [projectId]: updatedTasks,
            };
          });
        }),
        catchError(this.handleError),
      );
  }

  deleteTask(projectId: string, taskId: string): Observable<void> {
    return this.#http.delete<void>(`${this.#apiUrl}/projects/${projectId}/tasks/${taskId}`).pipe(
      tap(() => {
        // Remove the task from the project's task list
        this.#tasksSignal.update((tasks) => {
          const projectTasks = tasks[projectId] || [];
          const filteredTasks = projectTasks.filter((task) => task.id !== taskId);
          return {
            ...tasks,
            [projectId]: filteredTasks,
          };
        });
      }),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = extractErrorMessage(error);
    return throwError(() => new Error(errorMessage));
  }
}
