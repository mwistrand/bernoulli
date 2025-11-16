import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService, User, UserRole } from '../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.USER,
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, TranslateModule.forRoot()],
      providers: [{ provide: AuthService, useValue: mockAuthService }, provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Form validation', () => {
    it('should validate required fields and email format', () => {
      expect(component['loginForm'].valid).toBe(false);
      expect(component['loginForm'].get('email')?.errors?.['required']).toBe(true);
      expect(component['loginForm'].get('password')?.errors?.['required']).toBe(true);

      component['loginForm'].patchValue({ email: 'invalid-email', password: 'password123' });
      expect(component['loginForm'].get('email')?.errors?.['email']).toBeTruthy();
      expect(component['loginForm'].valid).toBe(false);

      component['loginForm'].patchValue({ email: 'test@example.com', password: 'password123' });
      expect(component['loginForm'].valid).toBe(true);
    });
  });

  describe('Form submission', () => {
    it('should not submit when form is invalid', () => {
      component.onSubmit();
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should login and navigate on successful submission', (done) => {
      mockAuthService.login.and.returnValue(of(mockUser));

      component['loginForm'].patchValue({ email: 'test@example.com', password: 'password123' });
      component.onSubmit();

      setTimeout(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(router.navigate).toHaveBeenCalledWith(['/']);
        done();
      }, 10);
    });

    it('should manage loading state and clear errors on submission', () => {
      mockAuthService.login.and.returnValue(of(mockUser));

      component['errorMessage'].set('Previous error');
      component['loginForm'].patchValue({ email: 'test@example.com', password: 'password123' });

      expect(component['isLoading']()).toBe(false);
      component.onSubmit();
      expect(component['isLoading']()).toBe(true);
      expect(component['errorMessage']()).toBeNull();
    });

    it('should display error message on failed login', (done) => {
      const error = { error: { message: 'Invalid credentials' } };
      mockAuthService.login.and.returnValue(throwError(() => error));

      component['loginForm'].patchValue({ email: 'wrong@example.com', password: 'wrongpassword' });
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

      component['loginForm'].patchValue({ email: 'test@example.com', password: 'password123' });
      component.onSubmit();

      setTimeout(() => {
        expect(component['errorMessage']()).toBe('auth.login.errors.invalidCredentials');
        expect(component['isLoading']()).toBe(false);
        done();
      }, 10);
    });
  });
});
