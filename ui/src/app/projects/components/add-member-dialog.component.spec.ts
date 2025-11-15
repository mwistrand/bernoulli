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

    // Default successful response
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

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  describe('User Loading', () => {
    it('should load all users on init', () => {
      createComponent();
      fixture.detectChanges();

      expect(mockUsersService.getAllUsers).toHaveBeenCalled();
      expect(component['isLoadingUsers']()).toBe(false);
    });

    it('should filter out existing members', () => {
      createComponent();
      fixture.detectChanges();

      const availableUsers = component['availableUsers']();
      expect(availableUsers.length).toBe(2);
      expect(availableUsers.map((u) => u.id)).toEqual(['user-3', 'user-4']);
    });

    it('should handle user loading error', () => {
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

      expect(component['errorMessage']()).toBe('Failed to load users');
    });
  });

  describe('Form Validation', () => {
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

    it('should require userId', () => {
      const userIdControl = component['addMemberForm'].get('userId');
      expect(userIdControl?.hasError('required')).toBe(true);

      userIdControl?.setValue('user-3');
      expect(userIdControl?.hasError('required')).toBe(false);
    });

    it('should require role', () => {
      const roleControl = component['addMemberForm'].get('role');
      expect(roleControl?.valid).toBe(true); // Has default value

      roleControl?.setValue(null);
      expect(roleControl?.hasError('required')).toBe(true);
    });

    it('should mark form as invalid when userId is empty', () => {
      expect(component['addMemberForm'].invalid).toBe(true);

      component['addMemberForm'].patchValue({ userId: 'user-3' });
      expect(component['addMemberForm'].invalid).toBe(false);
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
      expect(component['isSubmitting']()).toBe(false);
    });

    it('should submit valid form data', () => {
      mockProjectMembersService.addMember.and.returnValue(of(mockMember));
      component['addMemberForm'].patchValue({
        userId: 'user-3',
        role: ProjectRole.USER,
      });

      component['onSubmit']();

      expect(component['isSubmitting']()).toBe(true);
      expect(mockProjectMembersService.addMember).toHaveBeenCalledWith('project-123', {
        userId: 'user-3',
        role: ProjectRole.USER,
      });
    });

    it('should close dialog with result on success', () => {
      mockProjectMembersService.addMember.and.returnValue(of(mockMember));
      component['addMemberForm'].patchValue({
        userId: 'user-3',
        role: ProjectRole.ADMIN,
      });

      component['onSubmit']();

      expect(mockDialogRef.close).toHaveBeenCalledWith(mockMember);
    });

    it('should handle submit error', () => {
      mockProjectMembersService.addMember.and.returnValue(
        throwError(() => ({ error: { message: 'User already a member' } })),
      );
      component['addMemberForm'].patchValue({
        userId: 'user-3',
        role: ProjectRole.USER,
      });

      component['onSubmit']();

      expect(component['submitError']()).toBe('User already a member');
      expect(component['isSubmitting']()).toBe(false);
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should handle generic submit error', () => {
      mockProjectMembersService.addMember.and.returnValue(throwError(() => ({})));
      component['addMemberForm'].patchValue({
        userId: 'user-3',
        role: ProjectRole.USER,
      });

      component['onSubmit']();

      expect(component['submitError']()).toBe('Failed to add member');
      expect(component['isSubmitting']()).toBe(false);
    });

    it('should clear previous submit errors on new submit', () => {
      mockProjectMembersService.addMember.and.returnValue(
        throwError(() => ({ error: { message: 'Error 1' } })),
      );
      component['addMemberForm'].patchValue({
        userId: 'user-3',
        role: ProjectRole.USER,
      });

      component['onSubmit']();
      expect(component['submitError']()).toBe('Error 1');

      mockProjectMembersService.addMember.and.returnValue(of(mockMember));
      component['onSubmit']();

      expect(component['submitError']()).toBe(null);
    });

    it('should submit with ADMIN role when selected', () => {
      mockProjectMembersService.addMember.and.returnValue(of(mockMember));
      component['addMemberForm'].patchValue({
        userId: 'user-3',
        role: ProjectRole.ADMIN,
      });

      component['onSubmit']();

      expect(mockProjectMembersService.addMember).toHaveBeenCalledWith('project-123', {
        userId: 'user-3',
        role: ProjectRole.ADMIN,
      });
    });
  });

  describe('Cancel', () => {
    it('should close dialog with null result', () => {
      createComponent();
      component['onCancel']();

      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });
  });

  describe('Template Rendering', () => {
    it('should show loading state while loading users', () => {
      createComponent();
      component['isLoadingUsers'].set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.loading-container')).toBeTruthy();
      expect(compiled.querySelector('.spinner')).toBeTruthy();
    });

    it('should show error message when user loading fails', () => {
      mockUsersService.getAllUsers.and.returnValue(
        throwError(() => ({ error: { message: 'Network error' } })),
      );
      createComponent();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.error-message')?.textContent).toContain('Network error');
    });

    it('should show form when users loaded', () => {
      createComponent();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('form')).toBeTruthy();
      expect(compiled.querySelector('#userId')).toBeTruthy();
      expect(compiled.querySelector('#role')).toBeTruthy();
    });

    it('should populate user select with available users', () => {
      createComponent();
      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector('#userId') as HTMLSelectElement;
      const options = Array.from(select.querySelectorAll('option'));

      expect(options.length).toBe(3); // Placeholder + 2 available users
      expect(options[1].value).toBe('user-3');
      expect(options[2].value).toBe('user-4');
    });

    it('should disable submit button when form is invalid', () => {
      createComponent();
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector(
        '.button-primary',
      ) as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', () => {
      createComponent();
      fixture.detectChanges();
      component['addMemberForm'].patchValue({ userId: 'user-3' });
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector(
        '.button-primary',
      ) as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);
    });

    it('should disable buttons while submitting', () => {
      createComponent();
      fixture.detectChanges();
      component['isSubmitting'].set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons.forEach((button: HTMLButtonElement) => {
        expect(button.disabled).toBe(true);
      });
    });

    it('should show submit error when present', () => {
      createComponent();
      fixture.detectChanges();
      component['submitError'].set('Something went wrong');
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector(
        'form .error-message',
      ) as HTMLElement;
      expect(errorMessage.textContent).toContain('Something went wrong');
    });
  });
});
