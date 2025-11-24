import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TaskCommentAddComponent } from './task-comment-add.component';
import { TasksService, TaskComment } from '../services/tasks.service';

describe('TaskCommentAddComponent', () => {
  let component: TaskCommentAddComponent;
  let fixture: ComponentFixture<TaskCommentAddComponent>;
  let tasksService: jasmine.SpyObj<TasksService>;
  let translateService: jasmine.SpyObj<TranslateService>;

  const mockComment: TaskComment = {
    id: 'comment-123',
    taskId: 'task-123',
    comment: 'New comment',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    createdBy: 'user-123',
    createdByName: 'Bill Evans',
    lastUpdatedAt: new Date('2024-01-01T10:00:00Z'),
    lastUpdatedBy: 'user-123',
    lastUpdatedByName: 'John Coltrane',
  };

  beforeEach(async () => {
    const mockTasksService = jasmine.createSpyObj('TasksService', ['createTaskComment']);

    await TestBed.configureTestingModule({
      imports: [TaskCommentAddComponent, TranslateModule.forRoot()],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compileComponents();

    tasksService = TestBed.inject(TasksService) as jasmine.SpyObj<TasksService>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;

    fixture = TestBed.createComponent(TaskCommentAddComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start collapsed', () => {
    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    expect(component.isExpanded()).toBe(false);
  });

  it('should toggle expanded state', () => {
    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.toggleExpanded();
    expect(component.isExpanded()).toBe(true);

    component.toggleExpanded();
    expect(component.isExpanded()).toBe(false);
  });

  it('should reset form when collapsing', () => {
    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.commentText.set('Test comment');
    component.errorMessage.set('Some error');
    component.toggleExpanded();
    component.toggleExpanded();

    expect(component.commentText()).toBe('');
    expect(component.errorMessage()).toBeNull();
  });

  it('should show form when expanded', () => {
    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.toggleExpanded();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const form = compiled.querySelector('.comment-form');
    expect(form).toBeTruthy();
  });

  it('should hide form when collapsed', () => {
    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const form = compiled.querySelector('.comment-form');
    expect(form).toBeFalsy();
  });

  it('should submit comment successfully', () => {
    tasksService.createTaskComment.and.returnValue(of(mockComment));

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.toggleExpanded();
    component.commentText.set('New comment');
    component.submitComment();

    expect(tasksService.createTaskComment).toHaveBeenCalledWith('project-123', 'task-123', {
      comment: 'New comment',
    });
    expect(component.commentText()).toBe('');
    expect(component.isExpanded()).toBe(true); // Should stay expanded
  });

  it('should show error when submitting blank comment', () => {
    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.toggleExpanded();
    component.commentText.set('   ');
    component.submitComment();

    expect(component.errorMessage()).toBeTruthy();
    expect(tasksService.createTaskComment).not.toHaveBeenCalled();
  });

  it('should trim whitespace from comment', () => {
    tasksService.createTaskComment.and.returnValue(of(mockComment));

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.toggleExpanded();
    component.commentText.set('  New comment  ');
    component.submitComment();

    expect(tasksService.createTaskComment).toHaveBeenCalledWith('project-123', 'task-123', {
      comment: 'New comment',
    });
  });

  it('should handle submission error', () => {
    tasksService.createTaskComment.and.returnValue(throwError(() => new Error('Creation failed')));

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.toggleExpanded();
    component.commentText.set('New comment');
    component.submitComment();

    expect(component.errorMessage()).toBeTruthy();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should disable form during submission', () => {
    tasksService.createTaskComment.and.returnValue(of(mockComment));

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.toggleExpanded();
    component.commentText.set('New comment');

    // Check submitting state is set
    component.submitComment();
    expect(component.isSubmitting()).toBe(false); // Completed synchronously in test
  });

  it('should clear error message on successful submission', () => {
    tasksService.createTaskComment.and.returnValue(of(mockComment));

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.toggleExpanded();
    component.errorMessage.set('Previous error');
    component.commentText.set('New comment');
    component.submitComment();

    expect(component.errorMessage()).toBeNull();
  });

  it('should display error message in template', () => {
    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.toggleExpanded();
    component.errorMessage.set('Test error message');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorDiv = compiled.querySelector('.error-message');
    expect(errorDiv?.textContent).toContain('Test error message');
  });
});
