import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  ProjectMembersService,
  ProjectMember,
  ProjectRole,
  AddMemberDto,
  UpdateRoleDto,
} from './project-members.service';

describe('ProjectMembersService', () => {
  let service: ProjectMembersService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api';

  const mockMember: ProjectMember = {
    id: 'member-123',
    projectId: 'project-123',
    userId: 'user-123',
    role: ProjectRole.ADMIN,
    userName: 'Test User',
    userEmail: 'test@example.com',
    createdAt: new Date('2024-01-01'),
    lastUpdatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ProjectMembersService],
    });
    service = TestBed.inject(ProjectMembersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProjectMembers', () => {
    it('should fetch project members', (done) => {
      const projectId = 'project-123';
      const members = [mockMember];

      service.getProjectMembers(projectId).subscribe((result) => {
        expect(result).toEqual(members);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/members`);
      expect(req.request.method).toBe('GET');
      req.flush(members);
    });

    it('should handle empty member list', (done) => {
      const projectId = 'project-123';

      service.getProjectMembers(projectId).subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/members`);
      req.flush([]);
    });

    it('should handle error response', (done) => {
      const projectId = 'project-123';

      service.getProjectMembers(projectId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/members`);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('addMember', () => {
    it('should add a new member', (done) => {
      const projectId = 'project-123';
      const dto: AddMemberDto = {
        userId: 'new-user-123',
        role: ProjectRole.USER,
      };

      service.addMember(projectId, dto).subscribe((result) => {
        expect(result).toEqual(mockMember);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/members`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockMember);
    });

    it('should handle conflict error when user already a member', (done) => {
      const projectId = 'project-123';
      const dto: AddMemberDto = {
        userId: 'existing-user-123',
        role: ProjectRole.USER,
      };

      service.addMember(projectId, dto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/members`);
      req.flush(
        { message: 'User is already a project member' },
        { status: 409, statusText: 'Conflict' },
      );
    });

    it('should add member with ADMIN role', (done) => {
      const projectId = 'project-123';
      const dto: AddMemberDto = {
        userId: 'admin-user-123',
        role: ProjectRole.ADMIN,
      };

      service.addMember(projectId, dto).subscribe((result) => {
        expect(result.role).toBe(ProjectRole.ADMIN);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/members`);
      expect(req.request.body.role).toBe(ProjectRole.ADMIN);
      req.flush({ ...mockMember, role: ProjectRole.ADMIN });
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', (done) => {
      const projectId = 'project-123';
      const userId = 'user-123';
      const dto: UpdateRoleDto = {
        role: ProjectRole.ADMIN,
      };

      service.updateMemberRole(projectId, userId, dto).subscribe((result) => {
        expect(result).toEqual(mockMember);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/members/${userId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush(mockMember);
    });

    it('should handle forbidden error when not project admin', (done) => {
      const projectId = 'project-123';
      const userId = 'user-123';
      const dto: UpdateRoleDto = {
        role: ProjectRole.ADMIN,
      };

      service.updateMemberRole(projectId, userId, dto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/members/${userId}`);
      req.flush(
        { message: 'User must be project admin' },
        { status: 403, statusText: 'Forbidden' },
      );
    });

    it('should handle not found error when user not a member', (done) => {
      const projectId = 'project-123';
      const userId = 'non-member-123';
      const dto: UpdateRoleDto = {
        role: ProjectRole.ADMIN,
      };

      service.updateMemberRole(projectId, userId, dto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/members/${userId}`);
      req.flush(
        { message: 'User is not a project member' },
        { status: 404, statusText: 'Not Found' },
      );
    });
  });

  describe('removeMember', () => {
    it('should remove a member', (done) => {
      const projectId = 'project-123';
      const userId = 'user-123';

      service.removeMember(projectId, userId).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/members/${userId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle forbidden error when not project admin', (done) => {
      const projectId = 'project-123';
      const userId = 'user-123';

      service.removeMember(projectId, userId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/members/${userId}`);
      req.flush(
        { message: 'User must be project admin' },
        { status: 403, statusText: 'Forbidden' },
      );
    });

    it('should handle error when trying to remove project creator', (done) => {
      const projectId = 'project-123';
      const userId = 'creator-123';

      service.removeMember(projectId, userId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/members/${userId}`);
      req.flush(
        { message: 'Cannot remove project creator' },
        { status: 403, statusText: 'Forbidden' },
      );
    });
  });
});
