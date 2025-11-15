import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { NavbarComponent } from './navbar.component';
import { AuthService, User, UserRole } from '../../auth/services/auth.service';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.USER,
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser: signal<User | null>(null),
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('currentUser', () => {
    it('should expose currentUser signal from AuthService', () => {
      const userSignal = signal<User | null>(mockUser);
      Object.defineProperty(mockAuthService, 'currentUser', {
        get: () => userSignal.asReadonly(),
      });

      const newComponent = TestBed.createComponent(NavbarComponent).componentInstance;
      expect(newComponent['currentUser']()).toEqual(mockUser);
    });

    it('should show null when no user is logged in', () => {
      expect(component['currentUser']()).toBeNull();
    });
  });

  describe('onSignOut', () => {
    it('should call logout and navigate to login on success', (done) => {
      mockAuthService.logout.and.returnValue(of(void 0));

      component.onSignOut();

      setTimeout(() => {
        expect(mockAuthService.logout).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }, 10);
    });

    it('should navigate to login even on logout error', (done) => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('Logout failed');
      mockAuthService.logout.and.returnValue(throwError(() => error));

      component.onSignOut();

      setTimeout(() => {
        expect(mockAuthService.logout).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sign out:', error);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }, 10);
    });
  });
});
