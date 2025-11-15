import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService, User } from '../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [{ provide: AuthService, useValue: mockAuthService }, provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form validation', () => {
    it('should have invalid form when fields are empty', () => {
      expect(component['loginForm'].valid).toBe(false);
      expect(component['loginForm'].get('email')?.errors?.['required']).toBe(true);
      expect(component['loginForm'].get('password')?.errors?.['required']).toBe(true);
    });

    it('should have invalid form when email is invalid', () => {
      component['loginForm'].patchValue({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(component['loginForm'].get('email')?.errors?.['email']).toBeTruthy();
      expect(component['loginForm'].valid).toBe(false);
    });

    it('should have valid form when all fields are valid', () => {
      component['loginForm'].patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(component['loginForm'].valid).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('should not submit when form is invalid', () => {
      component.onSubmit();

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should login and navigate on successful submission', (done) => {
      mockAuthService.login.and.returnValue(of(mockUser));

      component['loginForm'].patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();

      setTimeout(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(router.navigate).toHaveBeenCalledWith(['/']);
        expect(component['isLoading']()).toBe(true); // Still loading until navigation
        done();
      }, 10);
    });

    it('should set loading state during submission', () => {
      mockAuthService.login.and.returnValue(of(mockUser));

      component['loginForm'].patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(component['isLoading']()).toBe(false);
      component.onSubmit();
      expect(component['isLoading']()).toBe(true);
    });

    it('should clear error message on new submission', () => {
      mockAuthService.login.and.returnValue(of(mockUser));

      component['errorMessage'].set('Previous error');
      component['loginForm'].patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();

      expect(component['errorMessage']()).toBeNull();
    });

    it('should display error message on failed login', (done) => {
      const error = {
        error: { message: 'Invalid credentials' },
      };
      mockAuthService.login.and.returnValue(throwError(() => error));

      component['loginForm'].patchValue({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      component.onSubmit();

      setTimeout(() => {
        expect(component['errorMessage']()).toBe('Invalid credentials');
        expect(component['isLoading']()).toBe(false);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should display default error message when error has no message', (done) => {
      mockAuthService.login.and.returnValue(throwError(() => ({})));

      component['loginForm'].patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();

      setTimeout(() => {
        expect(component['errorMessage']()).toBe('Invalid email or password');
        expect(component['isLoading']()).toBe(false);
        done();
      }, 10);
    });
  });
});
