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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('projects signal', () => {
    it('should initialize with empty array', () => {
      expect(service.projects()).toEqual([]);
    });
  });

  describe('createProject', () => {
    it('should create a new project and add to beginning of list', (done) => {
      const request: CreateProjectRequest = {
        name: 'New Project',
        description: 'New Description',
      };

      service.createProject(request).subscribe((project) => {
        expect(project).toEqual(mockProject);
        const projects = service.projects();
        expect(projects[0]).toEqual(mockProject);
        expect(projects.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockProject);
    });

    it('should add new project to beginning of existing projects list', (done) => {
      const existingProject: Project = { ...mockProject, id: '2', name: 'Existing Project' };
      const newProject: Project = { ...mockProject, id: '3', name: 'New Project' };

      // First fetch existing projects
      service.fetchAllProjects().subscribe(() => {
        // Then create a new project
        service.createProject({ name: 'New Project' }).subscribe(() => {
          const projects = service.projects();
          expect(projects[0].id).toBe('3');
          expect(projects[1].id).toBe('2');
          expect(projects.length).toBe(2);
          done();
        });

        const createReq = httpMock.expectOne(`${apiUrl}/projects`);
        createReq.flush(newProject);
      });

      const fetchReq = httpMock.expectOne(`${apiUrl}/projects`);
      fetchReq.flush([existingProject]);
    });

    it('should handle duplicate project name error', (done) => {
      const request: CreateProjectRequest = {
        name: 'Duplicate Project',
      };

      service.createProject(request).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('A project with this name already exists');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects`);
      req.flush({ message: 'Project already exists' }, { status: 409, statusText: 'Conflict' });
    });

    it('should handle validation errors', (done) => {
      const request: CreateProjectRequest = {
        name: '',
      };

      service.createProject(request).subscribe({
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
      const request: CreateProjectRequest = {
        name: '',
      };

      service.createProject(request).subscribe({
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
      const request: CreateProjectRequest = {
        name: 'Test Project',
      };

      service.createProject(request).subscribe({
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
      const projects: Project[] = [mockProject, { ...mockProject, id: '2', name: 'Project 2' }];

      service.fetchAllProjects().subscribe((fetchedProjects) => {
        expect(fetchedProjects).toEqual(projects);
        expect(service.projects()).toEqual(projects);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects`);
      expect(req.request.method).toBe('GET');
      req.flush(projects);
    });

    it('should replace existing projects when fetching', (done) => {
      const initialProjects: Project[] = [mockProject];
      const newProjects: Project[] = [
        { ...mockProject, id: '3', name: 'Project 3' },
        { ...mockProject, id: '4', name: 'Project 4' },
      ];

      // First fetch
      service.fetchAllProjects().subscribe(() => {
        expect(service.projects()).toEqual(initialProjects);

        // Second fetch
        service.fetchAllProjects().subscribe(() => {
          expect(service.projects()).toEqual(newProjects);
          expect(service.projects().length).toBe(2);
          done();
        });

        const req2 = httpMock.expectOne(`${apiUrl}/projects`);
        req2.flush(newProjects);
      });

      const req1 = httpMock.expectOne(`${apiUrl}/projects`);
      req1.flush(initialProjects);
    });

    it('should handle server errors', (done) => {
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

    it('should handle network errors', (done) => {
      service.fetchAllProjects().subscribe({
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

  describe('getProjectById', () => {
    it('should fetch a project by id', (done) => {
      const projectId = '1';

      service.getProjectById(projectId).subscribe((project) => {
        expect(project).toEqual(mockProject);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProject);
    });

    it('should handle 404 errors', (done) => {
      const projectId = 'nonexistent';

      service.getProjectById(projectId).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Project not found');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}`);
      req.flush({ message: 'Project not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle network errors', (done) => {
      const projectId = '1';

      service.getProjectById(projectId).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Unable to connect to the server');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}`);
      req.error(new ProgressEvent('error'), { status: 0 });
    });
  });
});
