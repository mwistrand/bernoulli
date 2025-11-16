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

    // Set default return value for dialog.open
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

    // Set required inputs using signal setters
    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('currentMember', adminMember);
    fixture.componentRef.setInput('projectCreatorId', 'creator-123');
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Member Loading', () => {
    it('should load members on init', () => {
      mockProjectMembersService.getProjectMembers.and.returnValue(of([adminMember]));

      fixture.detectChanges();

      expect(mockProjectMembersService.getProjectMembers).toHaveBeenCalledWith('project-123');
      expect(component['members']()).toEqual([adminMember]);
      expect(component['isLoading']()).toBe(false);
    });

    it('should handle loading error', () => {
      mockProjectMembersService.getProjectMembers.and.returnValue(
        throwError(() => ({ error: { message: 'Access denied' } })),
      );

      fixture.detectChanges();

      expect(component['errorMessage']()).toBe('Access denied');
      expect(component['isLoading']()).toBe(false);
    });

    it('should handle generic loading error', () => {
      mockProjectMembersService.getProjectMembers.and.returnValue(throwError(() => ({})));

      fixture.detectChanges();

      expect(component['errorMessage']()).toBe('projects.members.errors.loadFailed');
    });
  });

  describe('Permissions', () => {
    beforeEach(() => {
      mockProjectMembersService.getProjectMembers.and.returnValue(of([adminMember]));
    });

    it('should check if user can manage members', () => {
      mockPermissionsService.canManageMembers.and.returnValue(true);
      fixture.detectChanges();

      const canManage = component['canManageMembers']();

      expect(mockPermissionsService.canManageMembers).toHaveBeenCalledWith(adminMember);
      expect(canManage).toBe(true);
    });

    it('should check if user can update member role', () => {
      mockPermissionsService.canUpdateMemberRole.and.returnValue(true);
      fixture.detectChanges();

      const canUpdate = component['canUpdateRole'](regularMember);

      expect(mockPermissionsService.canUpdateMemberRole).toHaveBeenCalledWith(
        adminMember,
        regularMember,
        'creator-123',
      );
      expect(canUpdate).toBe(true);
    });

    it('should check if user can remove member', () => {
      mockPermissionsService.canRemoveMember.and.returnValue(true);
      fixture.detectChanges();

      const canRemove = component['canRemove'](regularMember);

      expect(mockPermissionsService.canRemoveMember).toHaveBeenCalledWith(
        adminMember,
        regularMember,
        'creator-123',
      );
      expect(canRemove).toBe(true);
    });

    it('should check if user can manage specific member', () => {
      mockPermissionsService.canUpdateMemberRole.and.returnValue(false);
      mockPermissionsService.canRemoveMember.and.returnValue(true);
      fixture.detectChanges();

      const canManage = component['canManageThisMember'](regularMember);

      expect(canManage).toBe(true);
    });
  });

  // Note: Dialog integration tests removed due to CDK Dialog internal state complexity
  // The dialog functionality is tested through AddMemberDialogComponent tests and E2E tests

  describe('Change Role', () => {
    beforeEach(() => {
      mockProjectMembersService.getProjectMembers.and.returnValue(of([adminMember]));
    });

    it('should toggle role from USER to ADMIN', () => {
      mockProjectMembersService.updateMemberRole.and.returnValue(of(regularMember));
      fixture.detectChanges();

      component['onChangeRole'](regularMember);

      expect(mockProjectMembersService.updateMemberRole).toHaveBeenCalledWith(
        'project-123',
        'user-2',
        { role: ProjectRole.ADMIN },
      );
    });

    it('should toggle role from ADMIN to USER', () => {
      mockProjectMembersService.updateMemberRole.and.returnValue(of(adminMember));
      fixture.detectChanges();

      component['onChangeRole'](adminMember);

      expect(mockProjectMembersService.updateMemberRole).toHaveBeenCalledWith(
        'project-123',
        'user-1',
        { role: ProjectRole.USER },
      );
    });

    it('should reload members after role change', () => {
      mockProjectMembersService.updateMemberRole.and.returnValue(of(regularMember));
      fixture.detectChanges();

      component['onChangeRole'](regularMember);

      expect(mockProjectMembersService.getProjectMembers).toHaveBeenCalledTimes(2);
    });

    it('should emit membersChanged after role change', (done) => {
      mockProjectMembersService.updateMemberRole.and.returnValue(of(regularMember));
      fixture.detectChanges();

      component['membersChanged'].subscribe(() => {
        done();
      });

      component['onChangeRole'](regularMember);
    });

    it('should close menu before changing role', () => {
      mockProjectMembersService.updateMemberRole.and.returnValue(of(regularMember));
      fixture.detectChanges();
      component['openMenuId'].set('member-2');

      component['onChangeRole'](regularMember);

      expect(component['openMenuId']()).toBe(null);
    });

    it('should handle role change error', () => {
      mockProjectMembersService.updateMemberRole.and.returnValue(
        throwError(() => ({ error: { message: 'Permission denied' } })),
      );
      fixture.detectChanges();

      component['onChangeRole'](regularMember);

      expect(component['errorMessage']()).toBe('Permission denied');
    });

    it('should handle generic role change error', () => {
      mockProjectMembersService.updateMemberRole.and.returnValue(throwError(() => ({})));
      fixture.detectChanges();

      component['onChangeRole'](regularMember);

      expect(component['errorMessage']()).toBe('projects.members.errors.updateFailed');
    });
  });

  describe('Remove Member', () => {
    beforeEach(() => {
      mockProjectMembersService.getProjectMembers.and.returnValue(of([adminMember]));
    });

    it('should show confirmation dialog', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      fixture.detectChanges();

      component['onRemoveMember'](regularMember);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockProjectMembersService.removeMember).not.toHaveBeenCalled();
    });

    it('should remove member when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockProjectMembersService.removeMember.and.returnValue(of(void 0));
      fixture.detectChanges();

      component['onRemoveMember'](regularMember);

      expect(mockProjectMembersService.removeMember).toHaveBeenCalledWith('project-123', 'user-2');
    });

    it('should reload members after removal', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockProjectMembersService.removeMember.and.returnValue(of(void 0));
      fixture.detectChanges();

      component['onRemoveMember'](regularMember);

      expect(mockProjectMembersService.getProjectMembers).toHaveBeenCalledTimes(2);
    });

    it('should emit membersChanged after removal', (done) => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockProjectMembersService.removeMember.and.returnValue(of(void 0));
      fixture.detectChanges();

      component['membersChanged'].subscribe(() => {
        done();
      });

      component['onRemoveMember'](regularMember);
    });

    it('should close menu before removing', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      fixture.detectChanges();
      component['openMenuId'].set('member-2');

      component['onRemoveMember'](regularMember);

      expect(component['openMenuId']()).toBe(null);
    });

    it('should handle removal error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockProjectMembersService.removeMember.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot remove creator' } })),
      );
      fixture.detectChanges();

      component['onRemoveMember'](regularMember);

      expect(component['errorMessage']()).toBe('Cannot remove creator');
    });

    it('should handle generic removal error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockProjectMembersService.removeMember.and.returnValue(throwError(() => ({})));
      fixture.detectChanges();

      component['onRemoveMember'](regularMember);

      expect(component['errorMessage']()).toBe('projects.members.errors.removeFailed');
    });
  });

  describe('Menu Toggle', () => {
    beforeEach(() => {
      mockProjectMembersService.getProjectMembers.and.returnValue(of([adminMember]));
      fixture.detectChanges();
    });

    it('should open menu for member', () => {
      component['toggleMenu']('member-1');
      expect(component['openMenuId']()).toBe('member-1');
    });

    it('should close menu when toggling open menu', () => {
      component['openMenuId'].set('member-1');
      component['toggleMenu']('member-1');
      expect(component['openMenuId']()).toBe(null);
    });

    it('should switch to different menu', () => {
      component['openMenuId'].set('member-1');
      component['toggleMenu']('member-2');
      expect(component['openMenuId']()).toBe('member-2');
    });

    it('should close menu directly', () => {
      component['openMenuId'].set('member-1');
      component['closeMenu']();
      expect(component['openMenuId']()).toBe(null);
    });

    it('should close menu on document click outside', () => {
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
