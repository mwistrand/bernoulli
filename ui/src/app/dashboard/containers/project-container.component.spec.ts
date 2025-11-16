import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ProjectContainerComponent } from './project-container.component';
import { TasksService } from '../../tasks/services/tasks.service';
import { TaskDialogComponent } from '../../tasks/components/task-dialog.component';
import { of } from 'rxjs';

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
      imports: [ProjectContainerComponent, TranslateModule.forRoot()],
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

  describe('Initialization', () => {
    it('should load project and tasks from route data', () => {
      fixture.detectChanges();

      expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('id');
      expect(component.projectId()).toBe('project-1');
      expect(component.project().name).toBe('Test Project');
      expect(component.tasks().length).toBe(1);
    });

    it('should redirect to dashboard if project not found', () => {
      mockActivatedRoute.snapshot.data = { project: null, tasks: [] };
      fixture.detectChanges();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should handle missing or empty route data', () => {
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);
      mockActivatedRoute.snapshot.data = { project: createMockProject(), tasks: null };
      fixture.detectChanges();

      expect(component.projectId()).toBe('');
      expect(component.tasks()).toEqual([]);
    });
  });

  describe('Task dialog management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open and close dialog', () => {
      expect(component.isDialogOpen()).toBe(false);

      const newTaskButton = fixture.nativeElement.querySelector('.tasks-header .button-primary');
      newTaskButton.click();
      fixture.detectChanges();

      expect(component.isDialogOpen()).toBe(true);

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

      const newTaskButton = fixture.nativeElement.querySelector('.tasks-header .button-primary');
      newTaskButton.click();
      fixture.detectChanges();

      const dialogDebugElement: DebugElement = fixture.debugElement.query(
        By.directive(TaskDialogComponent),
      );
      const dialogComponent: TaskDialogComponent = dialogDebugElement.componentInstance;
      dialogComponent.taskSaved.emit(mockTasks[0]);
      fixture.detectChanges();

      expect(mockTaskService.fetchTasksByProjectId).toHaveBeenCalledWith('project-1');
      expect(component.tasks()).toEqual(mockTasks);
    });
  });

  describe('Navigation', () => {
    it('should navigate back to dashboard when Back button is clicked', () => {
      fixture.detectChanges();

      const backButton = fixture.nativeElement.querySelector('.back-button');
      backButton.click();
      fixture.detectChanges();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
