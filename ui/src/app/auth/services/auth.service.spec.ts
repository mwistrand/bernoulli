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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('currentUser signal', () => {
    it('should initialize with null', () => {
      expect(service.currentUser()).toBeNull();
    });
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
      expect(req.request.body).toEqual(userData);
      req.flush(mockUser);
    });

    it('should handle signup errors', (done) => {
      const userData: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      service.signup(userData).subscribe({
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
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockUser);
    });

    it('should handle login errors', (done) => {
      const credentials: LoginDto = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      service.login(credentials).subscribe({
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
      // First set a user using the tap operator in logout
      service.logout().subscribe(() => {
        expect(service.currentUser()).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(null);
    });

    it('should clear currentUser before logout completes', () => {
      service.logout().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/logout`);
      req.flush(null);

      expect(service.currentUser()).toBeNull();
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
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should handle null user response', (done) => {
      service.getCurrentUser().subscribe((user) => {
        expect(user).toBeNull();
        expect(service.currentUser()).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/me`);
      req.flush(null);
    });

    it('should handle unauthorized errors', (done) => {
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
