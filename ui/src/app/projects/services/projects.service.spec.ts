import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProjectsService, Project, CreateProjectRequest } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api';

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
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ProjectsService],
    });
    service = TestBed.inject(ProjectsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('createProject', () => {
    it('should create a new project and add to beginning of list', (done) => {
      const request: CreateProjectRequest = {
        name: 'New Project',
        description: 'New Description',
      };

      service.createProject(request).subscribe((project) => {
        expect(project).toEqual(mockProject);
        expect(service.projects()[0]).toEqual(mockProject);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects`);
      req.flush(mockProject);
    });

    it('should handle validation errors as string', (done) => {
      service.createProject({ name: '' }).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Name is required');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects`);
      req.flush({ message: 'Name is required' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle validation errors as array', (done) => {
      service.createProject({ name: '' }).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Name is required, Name must be longer');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects`);
      req.flush(
        { message: ['Name is required', 'Name must be longer'] },
        { status: 400, statusText: 'Bad Request' },
      );
    });

    it('should handle network errors', (done) => {
      service.createProject({ name: 'Test' }).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Unable to connect to the server');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects`);
      req.error(new ProgressEvent('error'), { status: 0 });
    });
  });

  describe('fetchAllProjects', () => {
    it('should fetch and store all projects', (done) => {
      const projects: Project[] = [mockProject];

      service.fetchAllProjects().subscribe((fetchedProjects) => {
        expect(fetchedProjects).toEqual(projects);
        expect(service.projects()).toEqual(projects);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects`);
      req.flush(projects);
    });

    it('should handle errors', (done) => {
      service.fetchAllProjects().subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Server error');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects`);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getProjectById', () => {
    it('should fetch a project by id', (done) => {
      service.getProjectById('1').subscribe((project) => {
        expect(project).toEqual(mockProject);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/1`);
      req.flush(mockProject);
    });

    it('should handle errors', (done) => {
      service.getProjectById('1').subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Project not found');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/1`);
      req.flush({ message: 'Project not found' }, { status: 404, statusText: 'Not Found' });
    });
  });
});
