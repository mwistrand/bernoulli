import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { ProjectMemberContainer } from './project-member-container';
import {
  ProjectMembersService,
  ProjectMember,
  ProjectRole,
} from '../../projects/services/project-members.service';
import { PermissionsService } from '../../shared/services/permissions.service';
import { Project } from '../../projects/services/projects.service';

describe('ProjectMemberContainer', () => {
  let component: ProjectMemberContainer;
  let fixture: ComponentFixture<ProjectMemberContainer>;
  let mockProjectMembersService: jasmine.SpyObj<ProjectMembersService>;
  let mockPermissionsService: jasmine.SpyObj<PermissionsService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockDialog: jasmine.SpyObj<Dialog>;

  const mockProject: Project = {
    id: 'project-1',
    name: 'Test Project',
    description: 'Test Description',
    createdAt: new Date(),
    createdBy: 'user-1',
    lastUpdatedAt: new Date(),
    lastUpdatedBy: 'user-1',
  };

  const mockMembers: ProjectMember[] = [
    {
      id: 'member-1',
      projectId: 'project-1',
      userId: 'user-1',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      role: ProjectRole.ADMIN,
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
    },
    {
      id: 'member-2',
      projectId: 'project-1',
      userId: 'user-2',
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      role: ProjectRole.USER,
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
    },
  ];

  const mockCurrentMember: ProjectMember = mockMembers[0];

  beforeEach(async () => {
    mockProjectMembersService = jasmine.createSpyObj('ProjectMembersService', [
      'getProjectMembers',
      'removeMember',
    ]);
    mockPermissionsService = jasmine.createSpyObj('PermissionsService', [
      'canManageMembers',
      'canRemoveMember',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockDialog = jasmine.createSpyObj('Dialog', ['open']);

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('project-1'),
        },
        data: {
          project: mockProject,
          members: mockMembers,
          currentMember: mockCurrentMember,
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [ProjectMemberContainer, TranslateModule.forRoot()],
      providers: [
        { provide: ProjectMembersService, useValue: mockProjectMembersService },
        { provide: PermissionsService, useValue: mockPermissionsService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectMemberContainer);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load data from route snapshot', () => {
      fixture.detectChanges();

      expect(component['projectId']()).toBe('project-1');
      expect(component['project']()).toEqual(mockProject);
      expect(component['members']()).toEqual(mockMembers);
      expect(component['currentMember']()).toEqual(mockCurrentMember);
    });

    it('should navigate to dashboard when project ID is missing', () => {
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);

      fixture.detectChanges();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should navigate to dashboard when project data is missing', () => {
      mockActivatedRoute.snapshot.data = {
        project: null,
        members: mockMembers,
        currentMember: mockCurrentMember,
      };

      fixture.detectChanges();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should handle missing members data', () => {
      mockActivatedRoute.snapshot.data = {
        project: mockProject,
        members: null,
        currentMember: mockCurrentMember,
      };

      fixture.detectChanges();

      expect(component['members']()).toEqual([]);
    });

    it('should handle missing current member data', () => {
      mockActivatedRoute.snapshot.data = {
        project: mockProject,
        members: mockMembers,
        currentMember: null,
      };

      fixture.detectChanges();

      expect(component['currentMember']()).toBeNull();
    });
  });

  describe('canManageMembers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should delegate to permissions service', () => {
      mockPermissionsService.canManageMembers.and.returnValue(true);

      const result = component['canManageMembers']();

      expect(result).toBe(true);
      expect(mockPermissionsService.canManageMembers).toHaveBeenCalledWith(mockCurrentMember);
    });

    it('should return false when user cannot manage members', () => {
      mockPermissionsService.canManageMembers.and.returnValue(false);

      const result = component['canManageMembers']();

      expect(result).toBe(false);
    });
  });

  describe('canRemove', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should delegate to permissions service with correct parameters', () => {
      const targetMember = mockMembers[1];
      mockPermissionsService.canRemoveMember.and.returnValue(true);

      const result = component['canRemove'](targetMember);

      expect(result).toBe(true);
      expect(mockPermissionsService.canRemoveMember).toHaveBeenCalledWith(
        mockCurrentMember,
        targetMember,
        mockProject.createdBy,
      );
    });

    it('should return false when user cannot remove member', () => {
      const targetMember = mockMembers[1];
      mockPermissionsService.canRemoveMember.and.returnValue(false);

      const result = component['canRemove'](targetMember);

      expect(result).toBe(false);
    });
  });

  describe('onAddMember', () => {
    let mockDialogRef: any;

    beforeEach(() => {
      fixture.detectChanges();
      mockDialogRef = jasmine.createSpyObj('DialogRef', [], { closed: of(null) });
      mockDialog.open.and.returnValue(mockDialogRef);
    });

    it('should open add member dialog with correct data', () => {
      component['onAddMember']();

      expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), {
        data: {
          projectId: 'project-1',
          existingMemberIds: ['user-1', 'user-2'],
        },
      });
    });

    it('should reload members when dialog returns a result', () => {
      const newMember: ProjectMember = {
        id: 'member-3',
        projectId: 'project-1',
        userId: 'user-3',
        userName: 'New User',
        userEmail: 'new@example.com',
        role: ProjectRole.USER,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      mockDialogRef = jasmine.createSpyObj('DialogRef', [], { closed: of(newMember) });
      mockDialog.open.and.returnValue(mockDialogRef);
      mockProjectMembersService.getProjectMembers.and.returnValue(of([...mockMembers, newMember]));

      component['onAddMember']();

      expect(mockProjectMembersService.getProjectMembers).toHaveBeenCalledWith('project-1');
    });

    it('should not reload members when dialog is cancelled', () => {
      mockDialogRef = jasmine.createSpyObj('DialogRef', [], { closed: of(null) });
      mockDialog.open.and.returnValue(mockDialogRef);

      component['onAddMember']();

      expect(mockProjectMembersService.getProjectMembers).not.toHaveBeenCalled();
    });
  });

  describe('onRemoveMember', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prompt for confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      const targetMember = mockMembers[1];

      component['onRemoveMember'](targetMember);

      expect(window.confirm).toHaveBeenCalledWith(
        `Remove ${targetMember.userName} from this project? This action cannot be undone.`,
      );
    });

    it('should not remove member if confirmation is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      const targetMember = mockMembers[1];

      component['onRemoveMember'](targetMember);

      expect(mockProjectMembersService.removeMember).not.toHaveBeenCalled();
    });

    it('should remove member when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const targetMember = mockMembers[1];
      mockProjectMembersService.removeMember.and.returnValue(of(undefined));
      mockProjectMembersService.getProjectMembers.and.returnValue(of([mockMembers[0]]));

      component['onRemoveMember'](targetMember);

      expect(component['isLoading']()).toBe(false);
      expect(mockProjectMembersService.removeMember).toHaveBeenCalledWith('project-1', 'user-2');
      expect(mockProjectMembersService.getProjectMembers).toHaveBeenCalledWith('project-1');
    });

    it('should set loading state during removal', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const targetMember = mockMembers[1];
      mockProjectMembersService.removeMember.and.returnValue(of(undefined));
      mockProjectMembersService.getProjectMembers.and.returnValue(of([mockMembers[0]]));

      component['onRemoveMember'](targetMember);

      expect(component['errorMessage']()).toBeNull();
    });

    it('should handle removal errors', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const targetMember = mockMembers[1];
      const error = { error: { message: 'Failed to remove member' } };
      mockProjectMembersService.removeMember.and.returnValue(throwError(() => error));

      component['onRemoveMember'](targetMember);

      expect(component['isLoading']()).toBe(false);
      expect(component['errorMessage']()).toBe('Failed to remove member');
    });

    it('should show generic error message when error details are missing', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const targetMember = mockMembers[1];
      mockProjectMembersService.removeMember.and.returnValue(
        throwError(() => new Error('Unknown error')),
      );

      component['onRemoveMember'](targetMember);

      expect(component['isLoading']()).toBe(false);
      expect(component['errorMessage']()).toBe('Failed to remove member');
    });
  });

  describe('getRoleLabel', () => {
    it('should return admin label for admin role', () => {
      const label = component['getRoleLabel'](ProjectRole.ADMIN);
      expect(label).toBe('projects.roles.admin');
    });

    it('should return user label for user role', () => {
      const label = component['getRoleLabel'](ProjectRole.USER);
      expect(label).toBe('projects.roles.user');
    });
  });

  describe('goBack', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate back to project detail page', () => {
      component['goBack']();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/projects', 'project-1']);
    });
  });

  describe('loadMembers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load members successfully', () => {
      const updatedMembers = [mockMembers[0]];
      mockProjectMembersService.getProjectMembers.and.returnValue(of(updatedMembers));

      component['loadMembers']();

      expect(component['isLoading']()).toBe(false);
      expect(component['members']()).toEqual(updatedMembers);
      expect(component['errorMessage']()).toBeNull();
    });

    it('should handle errors when loading members', () => {
      const error = { error: { message: 'Failed to load members' } };
      mockProjectMembersService.getProjectMembers.and.returnValue(throwError(() => error));

      component['loadMembers']();

      expect(component['isLoading']()).toBe(false);
      expect(component['errorMessage']()).toBe('Failed to load members');
    });

    it('should show generic error message when error details are missing', () => {
      mockProjectMembersService.getProjectMembers.and.returnValue(
        throwError(() => new Error('Unknown error')),
      );

      component['loadMembers']();

      expect(component['isLoading']()).toBe(false);
      expect(component['errorMessage']()).toBe('Failed to load members');
    });
  });
});
