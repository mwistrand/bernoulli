import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TasksService, Task, CreateTaskRequest } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api';

  const mockTask: Task = {
    id: '1',
    projectId: 'project-1',
    title: 'Test Task',
    summary: 'Test Summary',
    description: 'Test Description',
    createdAt: new Date(),
    createdBy: 'user-1',
    lastUpdatedAt: new Date(),
    lastUpdatedBy: 'user-1',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TasksService],
    });
    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('tasks signal', () => {
    it('should return readonly tasks signal', () => {
      const tasks = service.tasks();
      expect(tasks).toEqual({});
    });
  });

  describe('getTasksByProjectId', () => {
    it('should return empty array when no tasks exist for project', () => {
      const tasks = service.getTasksByProjectId('project-1');
      expect(tasks).toEqual([]);
    });

    it('should return tasks for specific project', () => {
      const projectId = 'project-1';
      service.fetchTasksByProjectId(projectId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/tasks`);
      req.flush([mockTask]);

      const tasks = service.getTasksByProjectId(projectId);
      expect(tasks).toEqual([mockTask]);
    });
  });

  describe('createTask', () => {
    it('should create a new task and update signal', (done) => {
      const projectId = 'project-1';
      const createRequest: CreateTaskRequest = {
        title: 'New Task',
        summary: 'New Summary',
        description: 'New Description',
      };

      service.createTask(projectId, createRequest).subscribe((task) => {
        expect(task).toEqual(mockTask);
        expect(service.getTasksByProjectId(projectId)).toContain(mockTask);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/tasks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockTask);
    });

    it('should add new task to beginning of existing tasks list', (done) => {
      const projectId = 'project-1';
      const existingTask: Task = { ...mockTask, id: '2', title: 'Existing Task' };
      const newTask: Task = { ...mockTask, id: '3', title: 'New Task' };

      // First, fetch existing tasks
      service.fetchTasksByProjectId(projectId).subscribe(() => {
        // Then create a new task
        service
          .createTask(projectId, { title: 'New Task', description: 'Description' })
          .subscribe(() => {
            const tasks = service.getTasksByProjectId(projectId);
            expect(tasks[0].id).toBe('3');
            expect(tasks[1].id).toBe('2');
            expect(tasks.length).toBe(2);
            done();
          });

        const createReq = httpMock.expectOne(`${apiUrl}/projects/${projectId}/tasks`);
        createReq.flush(newTask);
      });

      const fetchReq = httpMock.expectOne(`${apiUrl}/projects/${projectId}/tasks`);
      fetchReq.flush([existingTask]);
    });

    it('should handle server errors', (done) => {
      const projectId = 'project-1';
      const createRequest: CreateTaskRequest = {
        title: 'New Task',
        description: 'New Description',
      };

      service.createTask(projectId, createRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Task title is required');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/tasks`);
      req.flush({ message: 'Task title is required' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle validation errors as array', (done) => {
      const projectId = 'project-1';
      const createRequest: CreateTaskRequest = {
        title: '',
        description: '',
      };

      service.createTask(projectId, createRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Title is required, Description is required');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/tasks`);
      req.flush(
        { message: ['Title is required', 'Description is required'] },
        { status: 400, statusText: 'Bad Request' },
      );
    });
  });

  describe('fetchTasksByProjectId', () => {
    it('should fetch and store tasks for a project', (done) => {
      const projectId = 'project-1';
      const tasks: Task[] = [mockTask, { ...mockTask, id: '2' }];

      service.fetchTasksByProjectId(projectId).subscribe((fetchedTasks) => {
        expect(fetchedTasks).toEqual(tasks);
        expect(service.getTasksByProjectId(projectId)).toEqual(tasks);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/tasks`);
      expect(req.request.method).toBe('GET');
      req.flush(tasks);
    });

    it('should handle 404 errors', (done) => {
      const projectId = 'nonexistent';

      service.fetchTasksByProjectId(projectId).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Project not found');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/tasks`);
      req.flush({ message: 'Project not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle network errors', (done) => {
      const projectId = 'project-1';

      service.fetchTasksByProjectId(projectId).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Unable to connect to the server');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/tasks`);
      req.error(new ProgressEvent('error'), { status: 0 });
    });
  });
});
