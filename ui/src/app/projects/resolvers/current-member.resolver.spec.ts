import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CurrentMemberResolver } from './current-member.resolver';
import {
  ProjectMembersService,
  ProjectMember,
  ProjectRole,
} from '../services/project-members.service';
import { AuthService, User, UserRole } from '../../auth/services/auth.service';

describe('CurrentMemberResolver', () => {
  let resolver: CurrentMemberResolver;
  let mockProjectMembersService: jasmine.SpyObj<ProjectMembersService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  const mockUser: User = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: UserRole.USER,
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

  beforeEach(() => {
    mockProjectMembersService = jasmine.createSpyObj('ProjectMembersService', [
      'getProjectMembers',
    ]);
    mockAuthService = jasmine.createSpyObj('AuthService', [], { currentUser: jasmine.createSpy() });

    TestBed.configureTestingModule({
      providers: [
        CurrentMemberResolver,
        { provide: ProjectMembersService, useValue: mockProjectMembersService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    resolver = TestBed.inject(CurrentMemberResolver);

    mockRoute = {
      paramMap: {
        get: jasmine.createSpy('get').and.returnValue('project-1'),
      } as any,
    } as ActivatedRouteSnapshot;

    mockState = {} as RouterStateSnapshot;
  });

  it('should resolve current member when user is authenticated and is a member', (done) => {
    Object.defineProperty(mockAuthService, 'currentUser', {
      get: () => () => mockUser,
    });
    mockProjectMembersService.getProjectMembers.and.returnValue(of(mockMembers));

    resolver.resolve(mockRoute, mockState).subscribe((member) => {
      expect(member).toEqual(mockMembers[0]);
      expect(mockProjectMembersService.getProjectMembers).toHaveBeenCalledWith('project-1');
      done();
    });
  });

  it('should return null when not authenticated, not a member, or on error', (done) => {
    Object.defineProperty(mockAuthService, 'currentUser', {
      get: () => () => null,
    });

    resolver.resolve(mockRoute, mockState).subscribe((member) => {
      expect(member).toBeNull();
      done();
    });
  });
});
