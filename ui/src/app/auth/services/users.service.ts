import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  readonly #http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/api';

  getAllUsers(): Observable<User[]> {
    return this.#http.get<User[]>(`${this.apiUrl}/users`);
  }
}
