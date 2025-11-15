import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ProjectContainerComponent } from './project-container.component';
import { TasksService } from '../../tasks/services/tasks.service';
import { TaskDialogComponent } from '../../tasks/components/task-dialog.component';
import { of } from 'rxjs';

// Redefine Project and Task interfaces for test
interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  lastUpdatedAt: Date;
  lastUpdatedBy: string;
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  summary?: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  lastUpdatedAt: Date;
  lastUpdatedBy: string;
}

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

describe(ProjectContainerComponent.name, () => {
  let component: ProjectContainerComponent;
  let fixture: ComponentFixture<ProjectContainerComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockTaskService: jasmine.SpyObj<TasksService>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockTaskService = jasmine.createSpyObj('TaskService', ['fetchTasksByProjectId']);

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('project-1'),
        },
        data: {
          project: createMockProject(),
          tasks: [createMockTask()],
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [ProjectContainerComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TasksService, useValue: mockTaskService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectContainerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load project and tasks from route data on init', () => {
      fixture.detectChanges(); // This triggers ngOnInit

      expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('id');
      expect(component.projectId()).toBe('project-1');

      const project = component.project();
      expect(project.id).toBe('project-1');
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('Test Description');

      const tasks = component.tasks();
      expect(tasks.length).toBe(1);
      expect(tasks[0].id).toBe('1');
      expect(tasks[0].title).toBe('Test Task');
    });

    it('should redirect to dashboard if project not found', () => {
      mockActivatedRoute.snapshot.data = {
        project: null,
        tasks: [],
      };

      fixture.detectChanges();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should handle missing project id in route', () => {
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);

      fixture.detectChanges();

      expect(component.projectId()).toBe('');
    });

    it('should set empty tasks array if tasks not provided in route data', () => {
      mockActivatedRoute.snapshot.data = {
        project: createMockProject(),
        tasks: null,
      };

      fixture.detectChanges();

      expect(component.tasks()).toEqual([]);
    });
  });

  describe('Create task dialog', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open dialog when New Task button is clicked', () => {
      expect(component.isDialogOpen()).toBe(false);

      const newTaskButton = fixture.nativeElement.querySelector('.tasks-header .button-primary');
      newTaskButton.click();
      fixture.detectChanges();

      expect(component.isDialogOpen()).toBe(true);
    });

    it('should close dialog when dialogClosed event is emitted', () => {
      // Open the dialog first
      const newTaskButton = fixture.nativeElement.querySelector('.tasks-header .button-primary');
      newTaskButton.click();
      fixture.detectChanges();
      expect(component.isDialogOpen()).toBe(true);

      // Get the dialog component and emit dialogClosed event
      const dialogDebugElement: DebugElement = fixture.debugElement.query(
        By.directive(TaskDialogComponent),
      );
      const dialogComponent: TaskDialogComponent = dialogDebugElement.componentInstance;
      dialogComponent.dialogClosed.emit();
      fixture.detectChanges();

      expect(component.isDialogOpen()).toBe(false);
    });

    it('should reload tasks when taskSaved event is emitted', () => {
      const mockTasks = [createMockTask({ id: '1' }), createMockTask({ id: '2' })];
      mockTaskService.fetchTasksByProjectId.and.returnValue(of(mockTasks));

      // Open the dialog first
      const newTaskButton = fixture.nativeElement.querySelector('.tasks-header .button-primary');
      newTaskButton.click();
      fixture.detectChanges();

      // Get the dialog component and emit taskSaved event
      const dialogDebugElement: DebugElement = fixture.debugElement.query(
        By.directive(TaskDialogComponent),
      );
      const dialogComponent: TaskDialogComponent = dialogDebugElement.componentInstance;
      dialogComponent.taskSaved.emit(mockTasks[0]);
      fixture.detectChanges();

      // Verify that the task service was called with the correct project ID
      expect(mockTaskService.fetchTasksByProjectId).toHaveBeenCalledWith('project-1');
      expect(component.tasks()).toEqual(mockTasks);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate back to dashboard when Back button is clicked', () => {
      const backButton = fixture.nativeElement.querySelector('.back-button');
      backButton.click();
      fixture.detectChanges();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('Template rendering', () => {
    it('should display project name and description', () => {
      fixture.detectChanges();

      const projectName = fixture.nativeElement.querySelector('.project-info h1');
      const projectDescription = fixture.nativeElement.querySelector('.project-description');

      expect(projectName.textContent).toContain('Test Project');
      expect(projectDescription.textContent).toContain('Test Description');
    });

    it('should not display description when project has no description', () => {
      mockActivatedRoute.snapshot.data = {
        project: createMockProject({ description: undefined }),
        tasks: [],
      };

      fixture.detectChanges();

      const projectDescription = fixture.nativeElement.querySelector('.project-description');
      expect(projectDescription).toBeNull();
    });

    it('should display loading state when set to true', () => {
      fixture.detectChanges();

      // Set loading state and detect changes again
      component.isLoading.set(true);
      fixture.detectChanges();

      const loadingState = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingState).not.toBeNull();
      expect(loadingState.textContent).toContain('Loading tasks...');
    });

    it('should display empty state when no tasks exist', () => {
      mockActivatedRoute.snapshot.data = {
        project: createMockProject(),
        tasks: [],
      };

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
      mockActivatedRoute.snapshot.data = {
        project: createMockProject(),
        tasks: tasks,
      };

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
      mockActivatedRoute.snapshot.data = {
        project: createMockProject(),
        tasks: [task],
      };

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
      mockActivatedRoute.snapshot.data = {
        project: createMockProject(),
        tasks: [task],
      };

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
