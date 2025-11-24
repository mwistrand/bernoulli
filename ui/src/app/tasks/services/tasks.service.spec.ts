import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  TasksService,
  Task,
  CreateTaskRequest,
  TaskComment,
  CreateTaskCommentRequest,
  UpdateTaskCommentRequest,
} from './tasks.service';

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

  const mockComment: TaskComment = {
    id: 'comment-1',
    taskId: 'task-1',
    comment: 'Test Comment',
    createdAt: new Date(),
    createdBy: 'user-1',
    createdByName: 'Miles Davis',
    lastUpdatedAt: new Date(),
    lastUpdatedBy: 'user-1',
    lastUpdatedByName: 'Scott LeFaro',
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
        expect(service.findTasksByProjectId('project-1')).toContain(mockTask);
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
        expect(service.findTasksByProjectId('project-1')).toEqual(tasks);
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

  describe('createTaskComment', () => {
    it('should create a new comment and update signal', (done) => {
      const createRequest: CreateTaskCommentRequest = {
        comment: 'New Comment',
      };

      service.createTaskComment('project-1', 'task-1', createRequest).subscribe((comment) => {
        expect(comment).toEqual(mockComment);
        expect(service.findCommentsByTaskId('task-1')).toContain(mockComment);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-1/tasks/task-1/comments`);
      req.flush(mockComment);
    });

    it('should handle validation errors', (done) => {
      service.createTaskComment('project-1', 'task-1', { comment: '' }).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Comment is required');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-1/tasks/task-1/comments`);
      req.flush({ message: 'Comment is required' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('fetchCommentsByTaskId', () => {
    it('should fetch and store comments for a task', (done) => {
      const comments: TaskComment[] = [mockComment];

      service.fetchCommentsByTaskId('project-1', 'task-1').subscribe((fetchedComments) => {
        expect(fetchedComments).toEqual(comments);
        expect(service.findCommentsByTaskId('task-1')).toEqual(comments);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-1/tasks/task-1/comments`);
      req.flush(comments);
    });

    it('should handle errors', (done) => {
      service.fetchCommentsByTaskId('project-1', 'task-1').subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Task not found');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/project-1/tasks/task-1/comments`);
      req.flush({ message: 'Task not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('updateTaskComment', () => {
    it('should update a comment and update signal', (done) => {
      const updateRequest: UpdateTaskCommentRequest = {
        comment: 'Updated Comment',
      };
      const updatedComment = { ...mockComment, comment: 'Updated Comment' };

      // First, add the comment to the signal
      service.fetchCommentsByTaskId('project-1', 'task-1').subscribe(() => {
        // Then update it
        service
          .updateTaskComment('project-1', 'task-1', 'comment-1', updateRequest)
          .subscribe((comment) => {
            expect(comment.comment).toBe('Updated Comment');
            const comments = service.findCommentsByTaskId('task-1');
            expect(comments.find((c) => c.id === 'comment-1')?.comment).toBe('Updated Comment');
            done();
          });

        const updateReq = httpMock.expectOne(
          `${apiUrl}/projects/project-1/tasks/task-1/comments/comment-1`,
        );
        updateReq.flush(updatedComment);
      });

      const fetchReq = httpMock.expectOne(`${apiUrl}/projects/project-1/tasks/task-1/comments`);
      fetchReq.flush([mockComment]);
    });

    it('should handle errors', (done) => {
      service
        .updateTaskComment('project-1', 'task-1', 'comment-1', { comment: 'Updated' })
        .subscribe({
          next: () => fail('should have failed'),
          error: (error: Error) => {
            expect(error.message).toBe('Comment not found');
            done();
          },
        });

      const req = httpMock.expectOne(
        `${apiUrl}/projects/project-1/tasks/task-1/comments/comment-1`,
      );
      req.flush({ message: 'Comment not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteTaskComment', () => {
    it('should delete a comment and update signal', (done) => {
      // First, add the comment to the signal
      service.fetchCommentsByTaskId('project-1', 'task-1').subscribe(() => {
        // Then delete it
        service.deleteTaskComment('project-1', 'task-1', 'comment-1').subscribe(() => {
          const comments = service.findCommentsByTaskId('task-1');
          expect(comments.find((c) => c.id === 'comment-1')).toBeUndefined();
          done();
        });

        const deleteReq = httpMock.expectOne(
          `${apiUrl}/projects/project-1/tasks/task-1/comments/comment-1`,
        );
        deleteReq.flush(null);
      });

      const fetchReq = httpMock.expectOne(`${apiUrl}/projects/project-1/tasks/task-1/comments`);
      fetchReq.flush([mockComment]);
    });

    it('should handle errors', (done) => {
      service.deleteTaskComment('project-1', 'task-1', 'comment-1').subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Comment not found');
          done();
        },
      });

      const req = httpMock.expectOne(
        `${apiUrl}/projects/project-1/tasks/task-1/comments/comment-1`,
      );
      req.flush({ message: 'Comment not found' }, { status: 404, statusText: 'Not Found' });
    });
  });
});
