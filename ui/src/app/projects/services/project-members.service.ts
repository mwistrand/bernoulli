import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { extractErrorMessage } from '../../shared/utils/error-handling.util';

export enum ProjectRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  userName: string;
  userEmail: string;
  createdAt: Date;
  lastUpdatedAt: Date;
}

export interface AddMemberDto {
  userId: string;
  role: ProjectRole;
}

export interface UpdateRoleDto {
  role: ProjectRole;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectMembersService {
  readonly #http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/api';

  getProjectMembers(projectId: string): Observable<ProjectMember[]> {
    return this.#http
      .get<ProjectMember[]>(`${this.apiUrl}/projects/${projectId}/members`)
      .pipe(catchError(this.handleError));
  }

  addMember(projectId: string, dto: AddMemberDto): Observable<ProjectMember> {
    return this.#http
      .post<ProjectMember>(`${this.apiUrl}/projects/${projectId}/members`, dto)
      .pipe(catchError(this.handleError));
  }

  updateMemberRole(
    projectId: string,
    userId: string,
    dto: UpdateRoleDto,
  ): Observable<ProjectMember> {
    return this.#http
      .patch<ProjectMember>(`${this.apiUrl}/projects/${projectId}/members/${userId}`, dto)
      .pipe(catchError(this.handleError));
  }

  removeMember(projectId: string, userId: string): Observable<void> {
    return this.#http
      .delete<void>(`${this.apiUrl}/projects/${projectId}/members/${userId}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = extractErrorMessage(error);
    return throwError(() => new Error(errorMessage));
  }
}
