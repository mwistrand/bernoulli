import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProjectMembersResolver } from './project-members.resolver';
import {
  ProjectMembersService,
  ProjectMember,
  ProjectRole,
} from '../services/project-members.service';

describe('ProjectMembersResolver', () => {
  let resolver: ProjectMembersResolver;
  let mockProjectMembersService: jasmine.SpyObj<ProjectMembersService>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

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

  beforeEach(() => {
    mockProjectMembersService = jasmine.createSpyObj('ProjectMembersService', [
      'getProjectMembers',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ProjectMembersResolver,
        { provide: ProjectMembersService, useValue: mockProjectMembersService },
      ],
    });

    resolver = TestBed.inject(ProjectMembersResolver);

    mockRoute = {
      paramMap: {
        get: jasmine.createSpy('get').and.returnValue('project-1'),
      } as any,
    } as ActivatedRouteSnapshot;

    mockState = {} as RouterStateSnapshot;
  });

  it('should resolve project members for a valid project ID', (done) => {
    mockProjectMembersService.getProjectMembers.and.returnValue(of(mockMembers));

    resolver.resolve(mockRoute, mockState).subscribe((members) => {
      expect(members).toEqual(mockMembers);
      expect(mockProjectMembersService.getProjectMembers).toHaveBeenCalledWith('project-1');
      done();
    });
  });

  it('should return empty array when no project ID or on error', (done) => {
    (mockRoute.paramMap.get as jasmine.Spy).and.returnValue(null);

    resolver.resolve(mockRoute, mockState).subscribe((members) => {
      expect(members).toEqual([]);
      done();
    });
  });
});
