import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UsersService } from './users.service';
import { User, UserRole } from './auth.service';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api';

  const mockUsers: User[] = [
    {
      id: '1',
      email: 'user1@example.com',
      name: 'User One',
      role: UserRole.USER,
    },
    {
      id: '2',
      email: 'admin@example.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), UsersService],
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllUsers', () => {
    it('should fetch all users', (done) => {
      service.getAllUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers);
        expect(users.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/users`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should handle empty user list', (done) => {
      service.getAllUsers().subscribe((users) => {
        expect(users).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/users`);
      req.flush([]);
    });

    it('should handle error response', (done) => {
      service.getAllUsers().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(401);
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/users`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });
  });
});
