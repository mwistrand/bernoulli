import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { SignupComponent } from './signup.component';
import { AuthService, User, UserRole } from '../services/auth.service';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.USER,
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['signup']);

    await TestBed.configureTestingModule({
      imports: [SignupComponent, TranslateModule.forRoot()],
      providers: [{ provide: AuthService, useValue: mockAuthService }, provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Form validation', () => {
    it('should validate required fields, email format, and password length', () => {
      expect(component['signupForm'].valid).toBe(false);
      expect(component['signupForm'].get('name')?.errors?.['required']).toBe(true);
      expect(component['signupForm'].get('email')?.errors?.['required']).toBe(true);
      expect(component['signupForm'].get('password')?.errors?.['required']).toBe(true);

      component['signupForm'].patchValue({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      });
      expect(component['signupForm'].get('email')?.errors?.['email']).toBeTruthy();
      expect(component['signupForm'].valid).toBe(false);

      component['signupForm'].patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: '12345',
      });
      expect(component['signupForm'].get('password')?.errors?.['minlength']).toBeTruthy();
      expect(component['signupForm'].valid).toBe(false);

      component['signupForm'].patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(component['signupForm'].valid).toBe(true);
    });
  });

  describe('Form submission', () => {
    it('should not submit when form is invalid', () => {
      component.onSubmit();
      expect(mockAuthService.signup).not.toHaveBeenCalled();
    });

    it('should signup and navigate on successful submission', (done) => {
      mockAuthService.signup.and.returnValue(of(mockUser));

      component['signupForm'].patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      component.onSubmit();

      setTimeout(() => {
        expect(mockAuthService.signup).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
        expect(router.navigate).toHaveBeenCalledWith(['/']);
        done();
      }, 10);
    });

    it('should manage loading state and clear errors on submission', () => {
      mockAuthService.signup.and.returnValue(of(mockUser));

      component['errorMessage'].set('Previous error');
      component['signupForm'].patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(component['isLoading']()).toBe(false);
      component.onSubmit();
      expect(component['isLoading']()).toBe(true);
      expect(component['errorMessage']()).toBeNull();
    });

    it('should display error message on failed signup', (done) => {
      const error = { error: { message: 'Email already exists' } };
      mockAuthService.signup.and.returnValue(throwError(() => error));

      component['signupForm'].patchValue({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      });
      component.onSubmit();

      setTimeout(() => {
        expect(component['errorMessage']()).toBe('Email already exists');
        expect(component['isLoading']()).toBe(false);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should display default error message when error has no message', (done) => {
      mockAuthService.signup.and.returnValue(throwError(() => ({})));

      component['signupForm'].patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      component.onSubmit();

      setTimeout(() => {
        expect(component['errorMessage']()).toBe('auth.signup.errors.defaultError');
        expect(component['isLoading']()).toBe(false);
        done();
      }, 10);
    });
  });
});
