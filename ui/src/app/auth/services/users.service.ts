import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { User } from './auth.service';
import { extractErrorMessage } from '../../shared/utils/error-handling.util';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'USER';
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  readonly #http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/api';

  getAllUsers(): Observable<User[]> {
    return this.#http.get<User[]>(`${this.apiUrl}/users`).pipe(catchError(this.handleError));
  }

  createUser(userData: CreateUserDto): Observable<User> {
    return this.#http
      .post<User>(`${this.apiUrl}/users/admin`, userData)
      .pipe(catchError(this.handleError));
  }

  deleteUser(userId: string): Observable<void> {
    return this.#http
      .delete<void>(`${this.apiUrl}/users/${userId}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = extractErrorMessage(error);
    return throwError(() => new Error(errorMessage));
  }
}
