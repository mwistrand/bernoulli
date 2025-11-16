import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './auth.service';

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
    return this.#http.get<User[]>(`${this.apiUrl}/users`);
  }

  createUser(userData: CreateUserDto): Observable<User> {
    return this.#http.post<User>(`${this.apiUrl}/users/admin`, userData);
  }

  deleteUser(userId: string): Observable<void> {
    return this.#http.delete<void>(`${this.apiUrl}/users/${userId}`);
  }
}
