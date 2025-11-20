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

  describe('getProjectMembers', () => {
    it('should fetch project members', (done) => {
      service.getProjectMembers('project-123').subscribe((result) => {
        expect(result).toEqual([mockMember]);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-123/members`);
      req.flush([mockMember]);
    });

    it('should handle error response', (done) => {
      service.getProjectMembers('project-123').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-123/members`);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('addMember', () => {
    it('should add a new member', (done) => {
      const dto: AddMemberDto = {
        userId: 'new-user-123',
        role: ProjectRole.USER,
      };

      service.addMember('project-123', dto).subscribe((result) => {
        expect(result).toEqual(mockMember);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-123/members`);
      req.flush(mockMember);
    });

    it('should handle conflict error', (done) => {
      service.addMember('project-123', {} as AddMemberDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBeTruthy();
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-123/members`);
      req.flush({ message: 'User already member' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', (done) => {
      const dto: UpdateRoleDto = { role: ProjectRole.ADMIN };

      service.updateMemberRole('project-123', 'user-123', dto).subscribe((result) => {
        expect(result).toEqual(mockMember);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-123/members/user-123`);
      req.flush(mockMember);
    });

    it('should handle authorization errors', (done) => {
      service.updateMemberRole('project-123', 'user-123', {} as UpdateRoleDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBeTruthy();
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-123/members/user-123`);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('removeMember', () => {
    it('should remove a member', (done) => {
      service.removeMember('project-123', 'user-123').subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-123/members/user-123`);
      req.flush(null);
    });

    it('should handle authorization errors', (done) => {
      service.removeMember('project-123', 'user-123').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBeTruthy();
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-123/members/user-123`);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });
  });
});
