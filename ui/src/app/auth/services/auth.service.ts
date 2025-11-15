import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly #http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/api';
  public readonly currentUser = signal<User | null>(null);

  constructor() {
    this.loadCurrentUser();
  }

  signup(userData: CreateUserDto): Observable<User> {
    return this.#http.post<User>(`${this.apiUrl}/users`, userData).pipe(
      tap((user) => {
        this.currentUser.set(user);
      }),
    );
  }

  login(credentials: LoginDto): Observable<User> {
    return this.#http.post<User>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((user) => {
        this.currentUser.set(user);
      }),
    );
  }

  logout(): Observable<void> {
    return this.#http.post<void>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.currentUser.set(null);
      }),
    );
  }

  getCurrentUser(): Observable<User | null> {
    return this.#http.get<User | null>(`${this.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
      }),
    );
  }

  private loadCurrentUser(): void {
    this.getCurrentUser().subscribe({
      error: () => {
        // User not logged in, that's fine
        this.currentUser.set(null);
      },
    });
  }
}
