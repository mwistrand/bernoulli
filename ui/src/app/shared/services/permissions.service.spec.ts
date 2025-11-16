import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PermissionsService } from './permissions.service';
import { AuthService, User, UserRole } from '../../auth/services/auth.service';
import { ProjectRole, ProjectMember } from '../../projects/services/project-members.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockAdminUser: User = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
  };

  const mockRegularUser: User = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Regular User',
    role: UserRole.USER,
  };

  const mockProjectAdmin: ProjectMember = {
    id: 'member-123',
    projectId: 'project-123',
    userId: 'user-123',
    role: ProjectRole.ADMIN,
    userName: 'Test User',
    userEmail: 'test@example.com',
    createdAt: new Date(),
    lastUpdatedAt: new Date(),
  };

  const mockProjectUser: ProjectMember = {
    id: 'member-456',
    projectId: 'project-123',
    userId: 'user-456',
    role: ProjectRole.USER,
    userName: 'Regular Member',
    userEmail: 'member@example.com',
    createdAt: new Date(),
    lastUpdatedAt: new Date(),
  };

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      currentUser: signal<User | null>(null),
    });

    TestBed.configureTestingModule({
      providers: [PermissionsService, { provide: AuthService, useValue: mockAuthService }],
    });

    service = TestBed.inject(PermissionsService);
  });

  describe('isSystemAdmin', () => {
    it('should return true for ADMIN user', () => {
      Object.defineProperty(mockAuthService, 'currentUser', {
        get: () => signal(mockAdminUser).asReadonly(),
      });

      expect(service.isSystemAdmin()).toBe(true);
    });

    it('should return false for regular user or null', () => {
      Object.defineProperty(mockAuthService, 'currentUser', {
        get: () => signal(mockRegularUser).asReadonly(),
      });

      expect(service.isSystemAdmin()).toBe(false);
    });
  });

  describe('isProjectAdmin', () => {
    it('should return true for project ADMIN', () => {
      expect(service.isProjectAdmin(mockProjectAdmin)).toBe(true);
    });

    it('should return false for project USER or null', () => {
      expect(service.isProjectAdmin(mockProjectUser)).toBe(false);
      expect(service.isProjectAdmin(null)).toBe(false);
    });
  });

  describe('canUpdateMemberRole', () => {
    it('should return true when project admin updating regular member', () => {
      expect(service.canUpdateMemberRole(mockProjectAdmin, mockProjectUser, 'creator-123')).toBe(
        true,
      );
    });

    it('should return false when not admin or updating creator', () => {
      expect(service.canUpdateMemberRole(mockProjectUser, mockProjectAdmin, 'creator-123')).toBe(
        false,
      );

      const creatorMember = { ...mockProjectUser, userId: 'creator-123' };
      expect(service.canUpdateMemberRole(mockProjectAdmin, creatorMember, 'creator-123')).toBe(
        false,
      );
    });
  });

  describe('canRemoveMember', () => {
    it('should return true when project admin removing regular member', () => {
      expect(service.canRemoveMember(mockProjectAdmin, mockProjectUser, 'creator-123')).toBe(true);
    });

    it('should return false when not admin or removing creator', () => {
      expect(service.canRemoveMember(mockProjectUser, mockProjectAdmin, 'creator-123')).toBe(false);

      const creatorMember = { ...mockProjectUser, userId: 'creator-123' };
      expect(service.canRemoveMember(mockProjectAdmin, creatorMember, 'creator-123')).toBe(false);
    });
  });

  describe('canManageTasks', () => {
    it('should return true for any project member', () => {
      expect(service.canManageTasks(mockProjectAdmin)).toBe(true);
      expect(service.canManageTasks(mockProjectUser)).toBe(true);
    });

    it('should return false for null member', () => {
      expect(service.canManageTasks(null)).toBe(false);
    });
  });
});
