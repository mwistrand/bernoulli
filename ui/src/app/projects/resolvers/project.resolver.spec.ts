import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProjectResolver } from './project.resolver';
import { ProjectsService, Project } from '../services/projects.service';

describe('ProjectResolver', () => {
  let resolver: ProjectResolver;
  let mockProjectsService: jasmine.SpyObj<ProjectsService>;

  const mockProject: Project = {
    id: '1',
    name: 'Test Project',
    description: 'Test Description',
    createdAt: new Date(),
    createdBy: 'user-1',
    lastUpdatedAt: new Date(),
    lastUpdatedBy: 'user-1',
  };

  beforeEach(() => {
    mockProjectsService = jasmine.createSpyObj('ProjectsService', ['getProjectById']);

    TestBed.configureTestingModule({
      providers: [ProjectResolver, { provide: ProjectsService, useValue: mockProjectsService }],
    });
    resolver = TestBed.inject(ProjectResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });

  it('should resolve with project when id is provided', (done) => {
    const mockRoute = {
      paramMap: {
        get: jasmine.createSpy('get').and.returnValue('1'),
      },
    } as unknown as ActivatedRouteSnapshot;
    const mockState = {} as RouterStateSnapshot;

    mockProjectsService.getProjectById.and.returnValue(of(mockProject));

    resolver.resolve(mockRoute, mockState).subscribe((project) => {
      expect(mockRoute.paramMap.get).toHaveBeenCalledWith('id');
      expect(mockProjectsService.getProjectById).toHaveBeenCalledWith('1');
      expect(project).toEqual(mockProject);
      done();
    });
  });

  it('should resolve with null when id is not provided', (done) => {
    const mockRoute = {
      paramMap: {
        get: jasmine.createSpy('get').and.returnValue(null),
      },
    } as unknown as ActivatedRouteSnapshot;
    const mockState = {} as RouterStateSnapshot;

    resolver.resolve(mockRoute, mockState).subscribe((project) => {
      expect(mockRoute.paramMap.get).toHaveBeenCalledWith('id');
      expect(mockProjectsService.getProjectById).not.toHaveBeenCalled();
      expect(project).toBeNull();
      done();
    });
  });

  it('should resolve with null when project is not found', (done) => {
    const mockRoute = {
      paramMap: {
        get: jasmine.createSpy('get').and.returnValue('nonexistent'),
      },
    } as unknown as ActivatedRouteSnapshot;
    const mockState = {} as RouterStateSnapshot;

    mockProjectsService.getProjectById.and.returnValue(
      throwError(() => new Error('Project not found')),
    );

    resolver.resolve(mockRoute, mockState).subscribe((project) => {
      expect(mockProjectsService.getProjectById).toHaveBeenCalledWith('nonexistent');
      expect(project).toBeNull();
      done();
    });
  });

  it('should resolve with null on any error', (done) => {
    const mockRoute = {
      paramMap: {
        get: jasmine.createSpy('get').and.returnValue('1'),
      },
    } as unknown as ActivatedRouteSnapshot;
    const mockState = {} as RouterStateSnapshot;

    mockProjectsService.getProjectById.and.returnValue(throwError(() => new Error('Server error')));

    resolver.resolve(mockRoute, mockState).subscribe((project) => {
      expect(project).toBeNull();
      done();
    });
  });
});
