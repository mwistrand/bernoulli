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

  describe('createTask', () => {
    it('should create a new task and update signal', (done) => {
      const createRequest: CreateTaskRequest = {
        title: 'New Task',
        description: 'New Description',
      };

      service.createTask('project-1', createRequest).subscribe((task) => {
        expect(task).toEqual(mockTask);
        expect(service.getTasksByProjectId('project-1')).toContain(mockTask);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-1/tasks`);
      req.flush(mockTask);
    });

    it('should handle validation errors as string', (done) => {
      service.createTask('project-1', {} as CreateTaskRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Task title is required');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-1/tasks`);
      req.flush({ message: 'Task title is required' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle validation errors as array', (done) => {
      service.createTask('project-1', {} as CreateTaskRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Title is required, Description is required');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-1/tasks`);
      req.flush(
        { message: ['Title is required', 'Description is required'] },
        { status: 400, statusText: 'Bad Request' },
      );
    });
  });

  describe('fetchTasksByProjectId', () => {
    it('should fetch and store tasks for a project', (done) => {
      const tasks: Task[] = [mockTask];

      service.fetchTasksByProjectId('project-1').subscribe((fetchedTasks) => {
        expect(fetchedTasks).toEqual(tasks);
        expect(service.getTasksByProjectId('project-1')).toEqual(tasks);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-1/tasks`);
      req.flush(tasks);
    });

    it('should handle errors', (done) => {
      service.fetchTasksByProjectId('project-1').subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Project not found');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-1/tasks`);
      req.flush({ message: 'Project not found' }, { status: 404, statusText: 'Not Found' });
    });
  });
});
