import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TasksResolver } from './tasks.resolver';
import { TasksService, Task } from '../../tasks/services/tasks.service';

describe('TasksResolver', () => {
  let resolver: TasksResolver;
  let mockTasksService: jasmine.SpyObj<TasksService>;

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
    mockTasksService = jasmine.createSpyObj('TasksService', ['fetchTasksByProjectId']);

    TestBed.configureTestingModule({
      providers: [TasksResolver, { provide: TasksService, useValue: mockTasksService }],
    });
    resolver = TestBed.inject(TasksResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });

  it('should resolve with tasks when project id is provided', (done) => {
    const mockRoute = {
      paramMap: {
        get: jasmine.createSpy('get').and.returnValue('project-1'),
      },
    } as unknown as ActivatedRouteSnapshot;
    const mockState = {} as RouterStateSnapshot;

    const tasks = [mockTask, { ...mockTask, id: '2' }];
    mockTasksService.fetchTasksByProjectId.and.returnValue(of(tasks));

    resolver.resolve(mockRoute, mockState).subscribe((result) => {
      expect(mockRoute.paramMap.get).toHaveBeenCalledWith('id');
      expect(mockTasksService.fetchTasksByProjectId).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(tasks);
      done();
    });
  });

  it('should resolve with empty array when project id is not provided', (done) => {
    const mockRoute = {
      paramMap: {
        get: jasmine.createSpy('get').and.returnValue(null),
      },
    } as unknown as ActivatedRouteSnapshot;
    const mockState = {} as RouterStateSnapshot;

    resolver.resolve(mockRoute, mockState).subscribe((result) => {
      expect(mockRoute.paramMap.get).toHaveBeenCalledWith('id');
      expect(mockTasksService.fetchTasksByProjectId).not.toHaveBeenCalled();
      expect(result).toEqual([]);
      done();
    });
  });

  it('should resolve with empty array when tasks fetch fails', (done) => {
    const mockRoute = {
      paramMap: {
        get: jasmine.createSpy('get').and.returnValue('project-1'),
      },
    } as unknown as ActivatedRouteSnapshot;
    const mockState = {} as RouterStateSnapshot;

    mockTasksService.fetchTasksByProjectId.and.returnValue(
      throwError(() => new Error('Failed to fetch tasks')),
    );

    resolver.resolve(mockRoute, mockState).subscribe((result) => {
      expect(mockTasksService.fetchTasksByProjectId).toHaveBeenCalledWith('project-1');
      expect(result).toEqual([]);
      done();
    });
  });

  it('should resolve with empty array on any error', (done) => {
    const mockRoute = {
      paramMap: {
        get: jasmine.createSpy('get').and.returnValue('project-1'),
      },
    } as unknown as ActivatedRouteSnapshot;
    const mockState = {} as RouterStateSnapshot;

    mockTasksService.fetchTasksByProjectId.and.returnValue(
      throwError(() => new Error('Server error')),
    );

    resolver.resolve(mockRoute, mockState).subscribe((result) => {
      expect(result).toEqual([]);
      done();
    });
  });
});
