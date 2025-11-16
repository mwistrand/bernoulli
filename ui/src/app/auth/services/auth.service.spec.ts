import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService, CreateUserDto, LoginDto, User, UserRole } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api';

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.USER,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Handle the initial getCurrentUser request from constructor
    const req = httpMock.expectOne(`${apiUrl}/auth/me`);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('signup', () => {
    it('should create a new user and update currentUser signal', (done) => {
      const userData: CreateUserDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      service.signup(userData).subscribe((user) => {
        expect(user).toEqual(mockUser);
        expect(service.currentUser()).toEqual(mockUser);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/users`);
      expect(req.request.method).toBe('POST');
      req.flush(mockUser);
    });

    it('should handle signup errors', (done) => {
      service.signup({} as CreateUserDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/users`);
      req.flush({ message: 'User already exists' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('login', () => {
    it('should login and update currentUser signal', (done) => {
      const credentials: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.login(credentials).subscribe((user) => {
        expect(user).toEqual(mockUser);
        expect(service.currentUser()).toEqual(mockUser);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush(mockUser);
    });

    it('should handle login errors', (done) => {
      service.login({} as LoginDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should logout and clear currentUser signal', (done) => {
      service.logout().subscribe(() => {
        expect(service.currentUser()).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/logout`);
      req.flush(null);
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user and update signal', (done) => {
      service.getCurrentUser().subscribe((user) => {
        expect(user).toEqual(mockUser);
        expect(service.currentUser()).toEqual(mockUser);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/me`);
      req.flush(mockUser);
    });

    it('should handle errors', (done) => {
      service.getCurrentUser().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/me`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });
  });
});
