import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AdminComponent } from './admin.component';
import { UsersService } from '../auth/services/users.service';
import { User, UserRole } from '../auth/services/auth.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let usersService: jasmine.SpyObj<UsersService>;

  const mockUsers: User[] = [
    { id: '1', email: 'admin@test.com', name: 'Admin User', role: UserRole.ADMIN },
    { id: '2', email: 'user@test.com', name: 'Regular User', role: UserRole.USER },
  ];

  beforeEach(async () => {
    const usersServiceSpy = jasmine.createSpyObj('UsersService', [
      'getAllUsers',
      'createUser',
      'deleteUser',
    ]);

    await TestBed.configureTestingModule({
      imports: [
        AdminComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [{ provide: UsersService, useValue: usersServiceSpy }],
    }).compileComponents();

    usersService = TestBed.inject(UsersService) as jasmine.SpyObj<UsersService>;
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    usersService.getAllUsers.and.returnValue(of(mockUsers));

    fixture.detectChanges();

    expect(usersService.getAllUsers).toHaveBeenCalled();
    expect(component['users']()).toEqual(mockUsers);
    expect(component['loading']()).toBe(false);
  });

  it('should handle error when loading users', () => {
    usersService.getAllUsers.and.returnValue(throwError(() => new Error('Failed to load')));

    fixture.detectChanges();

    expect(component['error']()).toBeTruthy();
    expect(component['loading']()).toBe(false);
  });

  it('should open create dialog', () => {
    component['openCreateDialog']();

    expect(component['showCreateDialog']()).toBe(true);
  });

  it('should close create dialog and reset form', () => {
    component['showCreateDialog'].set(true);
    component['createUserForm'].patchValue({ name: 'Test', email: 'test@test.com' });

    component['closeCreateDialog']();

    expect(component['showCreateDialog']()).toBe(false);
    expect(component['createUserForm'].value.name).toBe(null);
  });

  it('should create user successfully', () => {
    const newUser: User = { id: '3', email: 'new@test.com', name: 'New User', role: UserRole.USER };
    usersService.createUser.and.returnValue(of(newUser));
    usersService.getAllUsers.and.returnValue(of([...mockUsers, newUser]));

    component['createUserForm'].patchValue({
      name: 'New User',
      email: 'new@test.com',
      password: 'password123',
      role: 'USER',
    });

    component['onCreateUser']();

    expect(usersService.createUser).toHaveBeenCalled();
  });

  it('should not create user with invalid form', () => {
    component['createUserForm'].patchValue({
      name: '',
      email: 'invalid-email',
      password: '',
    });

    component['onCreateUser']();

    expect(usersService.createUser).not.toHaveBeenCalled();
  });

  it('should delete user after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    usersService.deleteUser.and.returnValue(of(undefined));
    usersService.getAllUsers.and.returnValue(of(mockUsers));

    const userToDelete = mockUsers[1];
    component['onDeleteUser'](userToDelete);

    expect(usersService.deleteUser).toHaveBeenCalledWith(userToDelete.id);
  });

  it('should not delete user if confirmation is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    const userToDelete = mockUsers[1];
    component['onDeleteUser'](userToDelete);

    expect(usersService.deleteUser).not.toHaveBeenCalled();
  });

  it('should handle error when deleting user', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    usersService.deleteUser.and.returnValue(throwError(() => new Error('Failed to delete')));

    const userToDelete = mockUsers[1];
    component['onDeleteUser'](userToDelete);

    expect(component['error']()).toBeTruthy();
  });
});
