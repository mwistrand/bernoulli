import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { OverlayModule, OverlayContainer } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { ProjectMembersListComponent } from './project-members-list.component';
import {
  ProjectMembersService,
  ProjectMember,
  ProjectRole,
} from '../services/project-members.service';
import { PermissionsService } from '../../shared/services/permissions.service';

describe('ProjectMembersListComponent', () => {
  let component: ProjectMembersListComponent;
  let fixture: ComponentFixture<ProjectMembersListComponent>;
  let mockProjectMembersService: jasmine.SpyObj<ProjectMembersService>;
  let mockPermissionsService: jasmine.SpyObj<PermissionsService>;
  let mockDialog: jasmine.SpyObj<Dialog>;
  let overlayContainer: OverlayContainer;

  const adminMember: ProjectMember = {
    id: 'member-1',
    projectId: 'project-123',
    userId: 'user-1',
    role: ProjectRole.ADMIN,
    userName: 'Admin User',
    userEmail: 'admin@example.com',
    createdAt: new Date(),
    lastUpdatedAt: new Date(),
  };

  const regularMember: ProjectMember = {
    id: 'member-2',
    projectId: 'project-123',
    userId: 'user-2',
    role: ProjectRole.USER,
    userName: 'Regular User',
    userEmail: 'user@example.com',
    createdAt: new Date(),
    lastUpdatedAt: new Date(),
  };

  beforeEach(async () => {
    mockProjectMembersService = jasmine.createSpyObj('ProjectMembersService', [
      'getProjectMembers',
      'addMember',
      'updateMemberRole',
      'removeMember',
    ]);
    mockPermissionsService = jasmine.createSpyObj('PermissionsService', [
      'canManageMembers',
      'canUpdateMemberRole',
      'canRemoveMember',
    ]);
    mockDialog = jasmine.createSpyObj('Dialog', ['open']);

    mockDialog.open.and.returnValue({
      closed: of(null),
    } as any);

    await TestBed.configureTestingModule({
      imports: [
        ProjectMembersListComponent,
        DialogModule,
        OverlayModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProjectMembersService, useValue: mockProjectMembersService },
        { provide: PermissionsService, useValue: mockPermissionsService },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectMembersListComponent);
    component = fixture.componentInstance;
    overlayContainer = TestBed.inject(OverlayContainer);

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('currentMember', adminMember);
    fixture.componentRef.setInput('projectCreatorId', 'creator-123');
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  describe('Member loading', () => {
    it('should load members on init', () => {
      mockProjectMembersService.getProjectMembers.and.returnValue(of([adminMember]));

      fixture.detectChanges();

      expect(mockProjectMembersService.getProjectMembers).toHaveBeenCalledWith('project-123');
      expect(component['members']()).toEqual([adminMember]);
      expect(component['isLoading']()).toBe(false);
    });

    it('should handle loading errors', () => {
      mockProjectMembersService.getProjectMembers.and.returnValue(
        throwError(() => ({ error: { message: 'Access denied' } })),
      );

      fixture.detectChanges();

      expect(component['errorMessage']()).toBe('Access denied');

      mockProjectMembersService.getProjectMembers.and.returnValue(throwError(() => ({})));
      const newFixture = TestBed.createComponent(ProjectMembersListComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.componentRef.setInput('projectId', 'project-123');
      newFixture.componentRef.setInput('currentMember', adminMember);
      newFixture.componentRef.setInput('projectCreatorId', 'creator-123');
      newFixture.detectChanges();

      expect(newComponent['errorMessage']()).toBe('projects.members.errors.loadFailed');
    });
  });

  describe('Permissions', () => {
    beforeEach(() => {
      mockProjectMembersService.getProjectMembers.and.returnValue(of([adminMember]));
    });

    it('should check permissions using PermissionsService', () => {
      mockPermissionsService.canManageMembers.and.returnValue(true);
      mockPermissionsService.canUpdateMemberRole.and.returnValue(true);
      mockPermissionsService.canRemoveMember.and.returnValue(false);
      fixture.detectChanges();

      expect(component['canManageMembers']()).toBe(true);
      expect(mockPermissionsService.canManageMembers).toHaveBeenCalledWith(adminMember);

      expect(component['canUpdateRole'](regularMember)).toBe(true);
      expect(mockPermissionsService.canUpdateMemberRole).toHaveBeenCalledWith(
        adminMember,
        regularMember,
        'creator-123',
      );

      expect(component['canRemove'](regularMember)).toBe(false);
      expect(mockPermissionsService.canRemoveMember).toHaveBeenCalledWith(
        adminMember,
        regularMember,
        'creator-123',
      );
    });

    it('should check if user can manage specific member', () => {
      mockPermissionsService.canUpdateMemberRole.and.returnValue(false);
      mockPermissionsService.canRemoveMember.and.returnValue(true);
      fixture.detectChanges();

      expect(component['canManageThisMember'](regularMember)).toBe(true);
    });
  });

  describe('Change role', () => {
    beforeEach(() => {
      mockProjectMembersService.getProjectMembers.and.returnValue(of([adminMember]));
    });

    it('should toggle role and reload members', () => {
      mockProjectMembersService.updateMemberRole.and.returnValue(of(regularMember));
      fixture.detectChanges();

      component['onChangeRole'](regularMember);

      expect(mockProjectMembersService.updateMemberRole).toHaveBeenCalledWith(
        'project-123',
        'user-2',
        { role: ProjectRole.ADMIN },
      );
      expect(mockProjectMembersService.getProjectMembers).toHaveBeenCalledTimes(2);
    });

    it('should emit membersChanged and close menu after role change', (done) => {
      mockProjectMembersService.updateMemberRole.and.returnValue(of(regularMember));
      fixture.detectChanges();
      component['openMenuId'].set('member-2');

      component['membersChanged'].subscribe(() => {
        done();
      });

      component['onChangeRole'](regularMember);
      expect(component['openMenuId']()).toBe(null);
    });

    it('should handle role change errors', () => {
      mockProjectMembersService.updateMemberRole.and.returnValue(
        throwError(() => ({ error: { message: 'Permission denied' } })),
      );
      fixture.detectChanges();

      component['onChangeRole'](regularMember);
      expect(component['errorMessage']()).toBe('Permission denied');

      mockProjectMembersService.updateMemberRole.and.returnValue(throwError(() => ({})));
      component['onChangeRole'](regularMember);
      expect(component['errorMessage']()).toBe('projects.members.errors.updateFailed');
    });
  });

  describe('Remove member', () => {
    beforeEach(() => {
      mockProjectMembersService.getProjectMembers.and.returnValue(of([adminMember]));
    });

    it('should show confirmation dialog and remove member when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockProjectMembersService.removeMember.and.returnValue(of(void 0));
      fixture.detectChanges();

      component['onRemoveMember'](regularMember);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockProjectMembersService.removeMember).toHaveBeenCalledWith('project-123', 'user-2');
      expect(mockProjectMembersService.getProjectMembers).toHaveBeenCalledTimes(2);
    });

    it('should not remove member if confirmation is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      fixture.detectChanges();

      component['onRemoveMember'](regularMember);

      expect(mockProjectMembersService.removeMember).not.toHaveBeenCalled();
    });

    it('should emit membersChanged and close menu after removal', (done) => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockProjectMembersService.removeMember.and.returnValue(of(void 0));
      fixture.detectChanges();
      component['openMenuId'].set('member-2');

      component['membersChanged'].subscribe(() => {
        done();
      });

      component['onRemoveMember'](regularMember);
      expect(component['openMenuId']()).toBe(null);
    });

    it('should handle removal errors', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockProjectMembersService.removeMember.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot remove creator' } })),
      );
      fixture.detectChanges();

      component['onRemoveMember'](regularMember);
      expect(component['errorMessage']()).toBe('Cannot remove creator');

      mockProjectMembersService.removeMember.and.returnValue(throwError(() => ({})));
      component['onRemoveMember'](regularMember);
      expect(component['errorMessage']()).toBe('projects.members.errors.removeFailed');
    });
  });

  describe('Menu toggle', () => {
    beforeEach(() => {
      mockProjectMembersService.getProjectMembers.and.returnValue(of([adminMember]));
      fixture.detectChanges();
    });

    it('should toggle menu open and closed', () => {
      component['toggleMenu']('member-1');
      expect(component['openMenuId']()).toBe('member-1');

      component['toggleMenu']('member-1');
      expect(component['openMenuId']()).toBe(null);

      component['toggleMenu']('member-1');
      component['toggleMenu']('member-2');
      expect(component['openMenuId']()).toBe('member-2');
    });

    it('should close menu on document click outside menu-container', () => {
      component['openMenuId'].set('member-1');
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', {
        value: document.createElement('div'),
        writable: false,
      });

      component['onDocumentClick'](event);
      expect(component['openMenuId']()).toBe(null);
    });

    it('should not close menu on click inside menu-container', () => {
      component['openMenuId'].set('member-1');
      const menuContainer = document.createElement('div');
      menuContainer.className = 'menu-container';
      const innerElement = document.createElement('button');
      menuContainer.appendChild(innerElement);

      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', {
        value: innerElement,
        writable: false,
      });

      component['onDocumentClick'](event);
      expect(component['openMenuId']()).toBe('member-1');
    });
  });
});
