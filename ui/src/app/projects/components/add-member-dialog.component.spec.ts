import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AddMemberDialogComponent, AddMemberDialogData } from './add-member-dialog.component';
import {
  ProjectMembersService,
  ProjectRole,
  ProjectMember,
} from '../services/project-members.service';
import { UsersService } from '../../auth/services/users.service';
import { User } from '../../auth/services/auth.service';

describe('AddMemberDialogComponent', () => {
  let component: AddMemberDialogComponent;
  let fixture: ComponentFixture<AddMemberDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<DialogRef<ProjectMember | null>>;
  let mockProjectMembersService: jasmine.SpyObj<ProjectMembersService>;
  let mockUsersService: jasmine.SpyObj<UsersService>;

  const mockDialogData: AddMemberDialogData = {
    projectId: 'project-123',
    existingMemberIds: ['user-1', 'user-2'],
  };

  const mockUsers: User[] = [
    { id: 'user-1', name: 'User One', email: 'user1@example.com', role: 'USER' as any },
    { id: 'user-2', name: 'User Two', email: 'user2@example.com', role: 'USER' as any },
    { id: 'user-3', name: 'User Three', email: 'user3@example.com', role: 'USER' as any },
    { id: 'user-4', name: 'User Four', email: 'user4@example.com', role: 'USER' as any },
  ];

  const mockMember: ProjectMember = {
    id: 'member-123',
    projectId: 'project-123',
    userId: 'user-3',
    role: ProjectRole.USER,
    userName: 'User Three',
    userEmail: 'user3@example.com',
    createdAt: new Date(),
    lastUpdatedAt: new Date(),
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('DialogRef', ['close']);
    mockProjectMembersService = jasmine.createSpyObj('ProjectMembersService', ['addMember']);
    mockUsersService = jasmine.createSpyObj('UsersService', ['getAllUsers']);

    mockUsersService.getAllUsers.and.returnValue(of(mockUsers));

    await TestBed.configureTestingModule({
      imports: [AddMemberDialogComponent, ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: mockDialogData },
        { provide: ProjectMembersService, useValue: mockProjectMembersService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compileComponents();
  });

  function createComponent() {
    fixture = TestBed.createComponent(AddMemberDialogComponent);
    component = fixture.componentInstance;
  }

  describe('User loading', () => {
    it('should load and filter out existing members', () => {
      createComponent();
      fixture.detectChanges();

      expect(mockUsersService.getAllUsers).toHaveBeenCalled();
      expect(component['isLoadingUsers']()).toBe(false);
      const availableUsers = component['availableUsers']();
      expect(availableUsers.length).toBe(2);
      expect(availableUsers.map((u) => u.id)).toEqual(['user-3', 'user-4']);
    });

    it('should handle user loading errors', () => {
      mockUsersService.getAllUsers.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to load users' } })),
      );

      createComponent();

      expect(component['errorMessage']()).toBe('Failed to load users');
      expect(component['isLoadingUsers']()).toBe(false);
    });

    it('should handle generic user loading error', () => {
      mockUsersService.getAllUsers.and.returnValue(throwError(() => ({})));
      createComponent();

      expect(component['errorMessage']()).toBe('projects.addMember.errors.loadUsersFailed');
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      createComponent();
      fixture.detectChanges();
    });

    it('should initialize form with empty userId and USER role', () => {
      expect(component['addMemberForm'].value).toEqual({
        userId: '',
        role: ProjectRole.USER,
      });
    });

    it('should require userId and role', () => {
      const userIdControl = component['addMemberForm'].get('userId');
      expect(userIdControl?.hasError('required')).toBe(true);

      userIdControl?.setValue('user-3');
      expect(userIdControl?.hasError('required')).toBe(false);

      const roleControl = component['addMemberForm'].get('role');
      roleControl?.setValue(null);
      expect(roleControl?.hasError('required')).toBe(true);
    });
  });

  describe('Submit', () => {
    beforeEach(() => {
      createComponent();
      fixture.detectChanges();
    });

    it('should not submit when form is invalid', () => {
      component['onSubmit']();
      expect(mockProjectMembersService.addMember).not.toHaveBeenCalled();
    });

    it('should submit valid form data and close dialog with result', () => {
      mockProjectMembersService.addMember.and.returnValue(of(mockMember));
      component['addMemberForm'].patchValue({ userId: 'user-3', role: ProjectRole.ADMIN });

      component['onSubmit']();

      expect(component['isSubmitting']()).toBe(true);
      expect(mockProjectMembersService.addMember).toHaveBeenCalledWith('project-123', {
        userId: 'user-3',
        role: ProjectRole.ADMIN,
      });
      expect(mockDialogRef.close).toHaveBeenCalledWith(mockMember);
    });

    it('should handle submit errors', () => {
      mockProjectMembersService.addMember.and.returnValue(
        throwError(() => ({ error: { message: 'User already a member' } })),
      );
      component['addMemberForm'].patchValue({ userId: 'user-3', role: ProjectRole.USER });

      component['onSubmit']();

      expect(component['submitError']()).toBe('User already a member');
      expect(component['isSubmitting']()).toBe(false);
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should handle generic submit error', () => {
      mockProjectMembersService.addMember.and.returnValue(throwError(() => ({})));
      component['addMemberForm'].patchValue({ userId: 'user-3', role: ProjectRole.USER });

      component['onSubmit']();

      expect(component['submitError']()).toBe('projects.addMember.errors.addFailed');
    });

    it('should clear previous submit errors on new submit', () => {
      mockProjectMembersService.addMember.and.returnValue(
        throwError(() => ({ error: { message: 'Error 1' } })),
      );
      component['addMemberForm'].patchValue({ userId: 'user-3', role: ProjectRole.USER });

      component['onSubmit']();
      expect(component['submitError']()).toBe('Error 1');

      mockProjectMembersService.addMember.and.returnValue(of(mockMember));
      component['onSubmit']();

      expect(component['submitError']()).toBe(null);
    });
  });

  describe('Cancel', () => {
    it('should close dialog with null result', () => {
      createComponent();
      component['onCancel']();

      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });
  });
});
