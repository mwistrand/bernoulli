import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { ProjectsResolver } from './projects.resolver';
import { ProjectsService, Project } from '../services/projects.service';

describe('ProjectsResolver', () => {
  let resolver: ProjectsResolver;
  let mockProjectsService: jasmine.SpyObj<ProjectsService>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  const mockProjects: Project[] = [
    {
      id: 'project-1',
      name: 'Project 1',
      description: 'Description 1',
      createdAt: new Date(),
      createdBy: 'user-1',
      lastUpdatedAt: new Date(),
      lastUpdatedBy: 'user-1',
    },
    {
      id: 'project-2',
      name: 'Project 2',
      description: 'Description 2',
      createdAt: new Date(),
      createdBy: 'user-1',
      lastUpdatedAt: new Date(),
      lastUpdatedBy: 'user-1',
    },
  ];

  beforeEach(() => {
    mockProjectsService = jasmine.createSpyObj('ProjectsService', ['fetchAllProjects'], {
      projects: signal(mockProjects),
    });

    TestBed.configureTestingModule({
      providers: [ProjectsResolver, { provide: ProjectsService, useValue: mockProjectsService }],
    });

    resolver = TestBed.inject(ProjectsResolver);
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = {} as RouterStateSnapshot;
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });

  it('should resolve projects successfully', (done) => {
    mockProjectsService.fetchAllProjects.and.returnValue(of(mockProjects));

    resolver.resolve(mockRoute, mockState).subscribe((projects) => {
      expect(projects).toEqual(mockProjects);
      expect(mockProjectsService.fetchAllProjects).toHaveBeenCalled();
      done();
    });
  });

  it('should return empty array on error', (done) => {
    mockProjectsService.fetchAllProjects.and.returnValue(
      throwError(() => new Error('Failed to fetch projects')),
    );

    resolver.resolve(mockRoute, mockState).subscribe((projects) => {
      expect(projects).toEqual([]);
      expect(mockProjectsService.fetchAllProjects).toHaveBeenCalled();
      done();
    });
  });

  it('should fetch projects and return signal value', (done) => {
    const updatedProjects = [
      ...mockProjects,
      {
        id: 'project-3',
        name: 'Project 3',
        description: 'Description 3',
        createdAt: new Date(),
        createdBy: 'user-1',
        lastUpdatedAt: new Date(),
        lastUpdatedBy: 'user-1',
      },
    ];

    Object.defineProperty(mockProjectsService, 'projects', {
      get: () => signal(updatedProjects),
    });
    mockProjectsService.fetchAllProjects.and.returnValue(of(updatedProjects));

    resolver.resolve(mockRoute, mockState).subscribe((projects) => {
      expect(projects).toEqual(updatedProjects);
      done();
    });
  });
});
