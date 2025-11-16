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

  it('should resolve projects successfully', (done) => {
    mockProjectsService.fetchAllProjects.and.returnValue(of(mockProjects));

    resolver.resolve(mockRoute, mockState).subscribe((projects) => {
      expect(projects).toEqual(mockProjects);
      done();
    });
  });

  it('should return empty array on error', (done) => {
    mockProjectsService.fetchAllProjects.and.returnValue(
      throwError(() => new Error('Failed to fetch projects')),
    );

    resolver.resolve(mockRoute, mockState).subscribe((projects) => {
      expect(projects).toEqual([]);
      done();
    });
  });
});
