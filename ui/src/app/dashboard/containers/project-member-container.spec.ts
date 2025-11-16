import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
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

  describe('Initialization', () => {
    it('should load data from route snapshot', () => {
      fixture.detectChanges();

      expect(component['projectId']()).toBe('project-1');
      expect(component['project']()).toEqual(mockProject);
      expect(component['members']()).toEqual(mockMembers);
      expect(component['currentMember']()).toEqual(mockCurrentMember);
    });

    it('should navigate to dashboard when required data is missing', () => {
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);
      fixture.detectChanges();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);

      mockActivatedRoute.snapshot.paramMap.get.and.returnValue('project-1');
      mockActivatedRoute.snapshot.data = {
        project: null,
        members: mockMembers,
        currentMember: mockCurrentMember,
      };
      fixture = TestBed.createComponent(ProjectMemberContainer);
      fixture.detectChanges();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should handle missing members or current member data', () => {
      mockActivatedRoute.snapshot.data = {
        project: mockProject,
        members: null,
        currentMember: null,
      };

      fixture = TestBed.createComponent(ProjectMemberContainer);
      fixture.detectChanges();

      expect(component['members']()).toEqual([]);
      expect(component['currentMember']()).toBeNull();
    });
  });

  describe('Permission checks', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should delegate permission checks to PermissionsService', () => {
      mockPermissionsService.canManageMembers.and.returnValue(true);
      mockPermissionsService.canRemoveMember.and.returnValue(false);

      expect(component['canManageMembers']()).toBe(true);
      expect(mockPermissionsService.canManageMembers).toHaveBeenCalledWith(mockCurrentMember);

      const targetMember = mockMembers[1];
      expect(component['canRemove'](targetMember)).toBe(false);
      expect(mockPermissionsService.canRemoveMember).toHaveBeenCalledWith(
        mockCurrentMember,
        targetMember,
        mockProject.createdBy,
      );
    });
  });

  describe('Add member dialog', () => {
    let mockDialogRef: any;

    beforeEach(() => {
      fixture.detectChanges();
      mockDialogRef = jasmine.createSpyObj('DialogRef', [], { closed: of(null) });
      mockDialog.open.and.returnValue(mockDialogRef);
    });

    it('should open dialog with correct data', () => {
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
      component['onAddMember']();
      expect(mockProjectMembersService.getProjectMembers).not.toHaveBeenCalled();
    });
  });

  describe('Remove member', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prompt for confirmation and remove member when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const targetMember = mockMembers[1];
      mockProjectMembersService.removeMember.and.returnValue(of(undefined));
      mockProjectMembersService.getProjectMembers.and.returnValue(of([mockMembers[0]]));

      component['onRemoveMember'](targetMember);

      expect(window.confirm).toHaveBeenCalledWith('projects.members.confirmRemove');
      expect(mockProjectMembersService.removeMember).toHaveBeenCalledWith('project-1', 'user-2');
      expect(mockProjectMembersService.getProjectMembers).toHaveBeenCalledWith('project-1');
    });

    it('should not remove member if confirmation is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component['onRemoveMember'](mockMembers[1]);

      expect(mockProjectMembersService.removeMember).not.toHaveBeenCalled();
    });

    it('should handle removal errors', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const targetMember = mockMembers[1];

      const error = { error: { message: 'Server error message' } };
      mockProjectMembersService.removeMember.and.returnValue(throwError(() => error));
      component['onRemoveMember'](targetMember);
      expect(component['errorMessage']()).toBe('Server error message');

      mockProjectMembersService.removeMember.and.returnValue(
        throwError(() => new Error('Unknown error')),
      );
      component['onRemoveMember'](targetMember);
      expect(component['errorMessage']()).toBe('projects.members.errors.removeFailed');
    });
  });

  describe('Utility methods', () => {
    it('should return correct role labels', () => {
      expect(component['getRoleLabel'](ProjectRole.ADMIN)).toBe('projects.roles.admin');
      expect(component['getRoleLabel'](ProjectRole.USER)).toBe('projects.roles.user');
    });

    it('should navigate back to project detail page', () => {
      fixture.detectChanges();
      component['goBack']();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/projects', 'project-1']);
    });
  });

  describe('Load members', () => {
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

    it('should handle loading errors', () => {
      const error = { error: { message: 'Server error message' } };
      mockProjectMembersService.getProjectMembers.and.returnValue(throwError(() => error));
      component['loadMembers']();
      expect(component['errorMessage']()).toBe('Server error message');

      mockProjectMembersService.getProjectMembers.and.returnValue(
        throwError(() => new Error('Unknown error')),
      );
      component['loadMembers']();
      expect(component['errorMessage']()).toBe('projects.members.errors.loadFailed');
    });
  });
});
