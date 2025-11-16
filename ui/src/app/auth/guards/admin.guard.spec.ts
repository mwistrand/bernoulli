import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { adminGuard } from './admin.guard';
import { AuthService, UserRole } from '../services/auth.service';

describe('adminGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access for admin users', async () => {
    const adminUser = {
      id: '1',
      email: 'admin@test.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
    };

    authService.getCurrentUser.and.returnValue(of(adminUser));

    const result = await TestBed.runInInjectionContext(() => {
      const guardResult = adminGuard({} as any, {} as any);
      if (typeof guardResult === 'boolean') {
        return guardResult;
      }
      return firstValueFrom(guardResult as any);
    });

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to dashboard for non-admin users', async () => {
    const regularUser = {
      id: '2',
      email: 'user@test.com',
      name: 'Regular User',
      role: UserRole.USER,
    };

    authService.getCurrentUser.and.returnValue(of(regularUser));

    const result = await TestBed.runInInjectionContext(() => {
      const guardResult = adminGuard({} as any, {} as any);
      if (typeof guardResult === 'boolean') {
        return guardResult;
      }
      return firstValueFrom(guardResult as any);
    });

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should redirect to login for unauthenticated users', async () => {
    authService.getCurrentUser.and.returnValue(of(null));

    const result = await TestBed.runInInjectionContext(() => {
      const guardResult = adminGuard({} as any, {} as any);
      if (typeof guardResult === 'boolean') {
        return guardResult;
      }
      return firstValueFrom(guardResult as any);
    });

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login on error', async () => {
    authService.getCurrentUser.and.returnValue(throwError(() => new Error('Auth error')));

    const result = await TestBed.runInInjectionContext(() => {
      const guardResult = adminGuard({} as any, {} as any);
      if (typeof guardResult === 'boolean') {
        return guardResult;
      }
      return firstValueFrom(guardResult as any);
    });

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
