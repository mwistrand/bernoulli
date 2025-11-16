import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService, User, UserRole } from '../services/auth.service';

describe('authGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: '1',
    email: 'test@test.com',
    name: 'Test',
    role: UserRole.USER,
  };

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should allow access when user is authenticated', (done) => {
    mockAuthService.getCurrentUser.and.returnValue(of(mockUser));

    TestBed.runInInjectionContext(() => {
      const result = authGuard({} as any, {} as any);
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      });
    });
  });

  it('should redirect to login when user is not authenticated', (done) => {
    mockAuthService.getCurrentUser.and.returnValue(of(null));

    TestBed.runInInjectionContext(() => {
      const result = authGuard({} as any, {} as any);
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      });
    });
  });
});
