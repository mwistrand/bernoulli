import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProjectDetailComponent } from './project-detail.component';
import { ProjectsService, Project } from '../../../projects/services/projects.service';
import { TasksService, Task } from '../../../tasks/services/tasks.service';

const createMockProject = (overrides?: Partial<Project>): Project => ({
  id: 'project-1',
  name: 'Test Project',
  description: 'Test Description',
  createdAt: new Date(),
  createdBy: 'test-user',
  lastUpdatedAt: new Date(),
  lastUpdatedBy: 'test-user',
  ...overrides,
});

const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: '1',
  projectId: 'project-1',
  title: 'Test Task',
  summary: 'Test Summary',
  description: 'Test Description',
  createdAt: new Date(),
  createdBy: 'test-user',
  lastUpdatedAt: new Date(),
  lastUpdatedBy: 'test-user',
  ...overrides,
});

describe('ProjectDetailComponent', () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;
  let mockProjectsService: jasmine.SpyObj<ProjectsService>;
  let mockTasksService: jasmine.SpyObj<TasksService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    const projectsSignal = signal<Project[]>([createMockProject()]);
    mockProjectsService = jasmine.createSpyObj('ProjectsService', ['fetchAllProjects'], {
      projects: projectsSignal.asReadonly(),
    });

    mockTasksService = jasmine.createSpyObj(
      'TasksService',
      ['fetchTasksByProjectId', 'getTasksByProjectId'],
      {
        tasks: signal<Record<string, Task[]>>({}),
      },
    );
    // Default return value for getTasksByProjectId
    mockTasksService.getTasksByProjectId.and.returnValue([]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('project-1'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [ProjectDetailComponent],
      providers: [
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: TasksService, useValue: mockTasksService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load project and tasks on init', () => {
      mockTasksService.fetchTasksByProjectId.and.returnValue(of([createMockTask()]));

      fixture.detectChanges(); // This triggers ngOnInit

      expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('id');
      expect(component.projectId()).toBe('project-1');
      expect(mockTasksService.fetchTasksByProjectId).toHaveBeenCalledWith('project-1');
    });

    it('should set project from projects service', () => {
      mockTasksService.fetchTasksByProjectId.and.returnValue(of([createMockTask()]));

      fixture.detectChanges();

      const project = component.project();
      expect(project).toBeTruthy();
      expect(project.id).toBe('project-1');
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('Test Description');
    });

    it('should redirect to dashboard if project not found', () => {
      // Set projects signal to empty array
      const emptyProjectsSignal = signal<Project[]>([]);
      Object.defineProperty(mockProjectsService, 'projects', {
        get: () => emptyProjectsSignal.asReadonly(),
      });

      mockTasksService.fetchTasksByProjectId.and.returnValue(of([]));

      fixture.detectChanges();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should handle missing project id in route', () => {
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);

      fixture.detectChanges();

      expect(component.projectId()).toBe('');
      expect(mockTasksService.fetchTasksByProjectId).not.toHaveBeenCalled();
    });
  });

  describe('Task loading', () => {
    beforeEach(() => {
      mockTasksService.getTasksByProjectId.and.returnValue([]);
    });

    it('should set loading state while fetching tasks', () => {
      mockTasksService.fetchTasksByProjectId.and.returnValue(of([createMockTask()]));

      expect(component.isLoading()).toBe(false);

      fixture.detectChanges();

      // Loading state is set synchronously, then cleared after observable completes
      expect(mockTasksService.fetchTasksByProjectId).toHaveBeenCalled();
    });

    it('should update tasks signal on successful fetch', (done) => {
      const tasks = [createMockTask(), createMockTask({ id: '2', title: 'Task 2' })];
      mockTasksService.fetchTasksByProjectId.and.returnValue(of(tasks));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.tasks()).toEqual(tasks);
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should handle errors when fetching tasks', (done) => {
      spyOn(console, 'error');
      mockTasksService.fetchTasksByProjectId.and.returnValue(
        throwError(() => new Error('Failed to load tasks')),
      );

      fixture.detectChanges();

      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to load tasks:', jasmine.any(Error));
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Dialog management', () => {
    beforeEach(() => {
      mockTasksService.fetchTasksByProjectId.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should open dialog when openDialog is called', () => {
      expect(component.isDialogOpen()).toBe(false);

      component.openDialog();

      expect(component.isDialogOpen()).toBe(true);
    });

    it('should close dialog when closeDialog is called', () => {
      component.openDialog();
      expect(component.isDialogOpen()).toBe(true);

      component.closeDialog();

      expect(component.isDialogOpen()).toBe(false);
    });

    it('should handle task created event', () => {
      component.onTaskCreated();

      // Should not throw any errors
      expect(component).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockTasksService.fetchTasksByProjectId.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should navigate back to dashboard when goBack is called', () => {
      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('Template rendering', () => {
    beforeEach(() => {
      mockTasksService.fetchTasksByProjectId.and.returnValue(of([]));
      mockTasksService.getTasksByProjectId.and.returnValue([]);
    });

    it('should display project name and description', () => {
      fixture.detectChanges();

      const projectName = fixture.nativeElement.querySelector('.project-info h1');
      const projectDescription = fixture.nativeElement.querySelector('.project-description');

      expect(projectName.textContent).toContain('Test Project');
      expect(projectDescription.textContent).toContain('Test Description');
    });

    it('should not display description when project has no description', () => {
      const projectsSignal = signal<Project[]>([createMockProject({ description: undefined })]);
      Object.defineProperty(mockProjectsService, 'projects', {
        get: () => projectsSignal.asReadonly(),
      });

      fixture.detectChanges();

      const projectDescription = fixture.nativeElement.querySelector('.project-description');
      expect(projectDescription).toBeNull();
    });

    it('should display loading state when fetching tasks', () => {
      // First, detectChanges to initialize the component
      fixture.detectChanges();

      // Then set loading state and detect changes again
      component.isLoading.set(true);
      fixture.detectChanges();

      const loadingState = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingState).not.toBeNull();
      expect(loadingState.textContent).toContain('Loading tasks...');
    });

    it('should display empty state when no tasks exist', () => {
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).not.toBeNull();
      expect(emptyState.textContent).toContain('No tasks yet');
    });

    it('should display tasks list when tasks exist', () => {
      const tasks = [
        createMockTask({ id: '1', title: 'Task 1' }),
        createMockTask({ id: '2', title: 'Task 2' }),
      ];
      mockTasksService.getTasksByProjectId.and.returnValue(tasks);

      fixture.detectChanges();

      const taskCards = fixture.nativeElement.querySelectorAll('.task-card');
      expect(taskCards.length).toBe(2);
    });

    it('should display task details correctly', () => {
      const task = createMockTask({
        title: 'Test Task Title',
        summary: 'Test Summary',
        description: 'Test Description',
      });
      mockTasksService.getTasksByProjectId.and.returnValue([task]);

      fixture.detectChanges();

      const taskCard = fixture.nativeElement.querySelector('.task-card');
      const taskTitle = taskCard.querySelector('.task-header h3');
      const taskSummary = taskCard.querySelector('.task-summary');
      const taskDescription = taskCard.querySelector('.task-description');

      expect(taskTitle.textContent).toContain('Test Task Title');
      expect(taskSummary.textContent).toContain('Test Summary');
      expect(taskDescription.textContent).toContain('Test Description');
    });

    it('should not display summary when task has no summary', () => {
      const task = createMockTask({ summary: undefined });
      mockTasksService.getTasksByProjectId.and.returnValue([task]);

      fixture.detectChanges();

      const taskSummary = fixture.nativeElement.querySelector('.task-summary');
      expect(taskSummary).toBeNull();
    });

    it('should display New Task button', () => {
      fixture.detectChanges();

      const newTaskButton = fixture.nativeElement.querySelector('.tasks-header .button-primary');
      expect(newTaskButton).not.toBeNull();
      expect(newTaskButton.textContent).toContain('New Task');
    });

    it('should open dialog when New Task button is clicked', () => {
      fixture.detectChanges();

      const newTaskButton = fixture.nativeElement.querySelector('.tasks-header .button-primary');
      newTaskButton.click();

      expect(component.isDialogOpen()).toBe(true);
    });

    it('should display Back button', () => {
      fixture.detectChanges();

      const backButton = fixture.nativeElement.querySelector('.back-button');
      expect(backButton).not.toBeNull();
      expect(backButton.textContent).toContain('Back');
    });

    it('should navigate back when Back button is clicked', () => {
      fixture.detectChanges();

      const backButton = fixture.nativeElement.querySelector('.back-button');
      backButton.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
