import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskDialogComponent } from './task-dialog.component';
import { Task, TasksService } from '../services/tasks.service';
import { of, throwError, delay } from 'rxjs';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslateModule } from '@ngx-translate/core';

const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: '1',
  projectId: 'project-1',
  title: 'Test Task',
  summary: undefined,
  description: 'Test Description',
  createdAt: new Date(),
  createdBy: 'test-user',
  lastUpdatedAt: new Date(),
  lastUpdatedBy: 'test-user',
  ...overrides,
});

describe('TaskDialogComponent', () => {
  let component: TaskDialogComponent;
  let fixture: ComponentFixture<TaskDialogComponent>;
  let mockTasksService: jasmine.SpyObj<TasksService>;

  beforeEach(async () => {
    mockTasksService = jasmine.createSpyObj('TasksService', ['createTask', 'updateTask']);

    await TestBed.configureTestingModule({
      imports: [TaskDialogComponent, A11yModule, TranslateModule.forRoot()],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projectId', 'project-1');
    fixture.componentRef.setInput('task', null);
  });

  describe('Focus management', () => {
    it('should auto-focus the title input when dialog opens', (done) => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      setTimeout(() => {
        const titleInput = fixture.nativeElement.querySelector('#task-title');
        expect(document.activeElement).toBe(titleInput);
        done();
      }, 100);
    });
  });

  describe('Keyboard interactions', () => {
    it('should close dialog when Escape key is pressed', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      spyOn(component, 'closeDialog');

      const dialogBackdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      dialogBackdrop.dispatchEvent(escapeEvent);

      expect(component.closeDialog).toHaveBeenCalled();
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should validate required fields and max lengths', () => {
      expect(component.taskForm.valid).toBe(false);
      expect(component.taskForm.get('title')?.errors?.['required']).toBe(true);
      expect(component.taskForm.get('description')?.errors?.['required']).toBe(true);

      const longTitle = 'a'.repeat(301);
      component.taskForm.patchValue({ title: longTitle, description: 'Test' });
      expect(component.taskForm.get('title')?.errors?.['maxlength']).toBeTruthy();

      const longSummary = 'a'.repeat(501);
      component.taskForm.patchValue({ title: 'Test', summary: longSummary, description: 'Test' });
      expect(component.taskForm.get('summary')?.errors?.['maxlength']).toBeTruthy();

      const longDescription = 'a'.repeat(5001);
      component.taskForm.patchValue({ title: 'Test', description: longDescription });
      expect(component.taskForm.get('description')?.errors?.['maxlength']).toBeTruthy();
    });

    it('should accept optional summary field', () => {
      component.taskForm.patchValue({ title: 'Test Task', description: 'Test Description' });
      expect(component.taskForm.valid).toBe(true);
      const summaryValue = component.taskForm.get('summary')?.value;
      expect(summaryValue === null || summaryValue === '').toBe(true);
    });
  });

  describe('Form submission', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('projectId', 'project-1');
      fixture.detectChanges();
    });

    it('should not submit when form is invalid', () => {
      component.onSubmit();
      expect(mockTasksService.createTask).not.toHaveBeenCalled();
    });

    it('should submit valid form data with optional summary', () => {
      mockTasksService.createTask.and.returnValue(of(createMockTask()));

      component.taskForm.patchValue({
        title: 'Test Task',
        summary: 'Test Summary',
        description: 'Test Description',
      });
      component.onSubmit();

      expect(mockTasksService.createTask).toHaveBeenCalledWith('project-1', {
        title: 'Test Task',
        summary: 'Test Summary',
        description: 'Test Description',
      });
    });

    it('should manage loading state during submission', (done) => {
      mockTasksService.createTask.and.returnValue(of(createMockTask()).pipe(delay(10)));

      component.taskForm.patchValue({ title: 'Test Task', description: 'Test Description' });
      expect(component.isLoading()).toBe(false);

      component.onSubmit();
      expect(component.isLoading()).toBe(true);

      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        done();
      }, 50);
    });

    it('should reset form and close dialog on successful submission', (done) => {
      mockTasksService.createTask.and.returnValue(of(createMockTask()));

      spyOn(component.taskSaved, 'emit');
      spyOn(component, 'closeDialog');

      component.taskForm.patchValue({ title: 'Test Task', description: 'Test Description' });
      component.onSubmit();

      setTimeout(() => {
        expect(component.taskSaved.emit).toHaveBeenCalled();
        expect(component.closeDialog).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should display error message on submission failure', (done) => {
      const errorMessage = 'Failed to create task';
      mockTasksService.createTask.and.returnValue(throwError(() => new Error(errorMessage)));

      component.taskForm.patchValue({ title: 'Test Task', description: 'Test Description' });
      component.onSubmit();

      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        expect(component.errorMessage()).toBe(errorMessage);
        done();
      }, 100);
    });
  });

  describe('Dialog actions', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should close dialog and reset form state', () => {
      component.taskForm.patchValue({
        title: 'Test Task',
        summary: 'Test Summary',
        description: 'Test Description',
      });
      component.errorMessage.set('Some error');

      spyOn(component.dialogClosed, 'emit');
      component.closeDialog();

      expect(component.taskForm.value).toEqual({ title: null, summary: null, description: null });
      expect(component.errorMessage()).toBeNull();
      expect(component.dialogClosed.emit).toHaveBeenCalled();
    });

    it('should close dialog when clicking on backdrop but not on content', () => {
      spyOn(component, 'closeDialog');

      const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      const dialogContent = fixture.nativeElement.querySelector('.dialog-content');

      const backdropClickEvent = new MouseEvent('click');
      Object.defineProperty(backdropClickEvent, 'target', { value: backdrop, enumerable: true });
      Object.defineProperty(backdropClickEvent, 'currentTarget', {
        value: backdrop,
        enumerable: true,
      });
      component.onBackdropClick(backdropClickEvent);
      expect(component.closeDialog).toHaveBeenCalled();

      (component.closeDialog as jasmine.Spy).calls.reset();

      const contentClickEvent = new MouseEvent('click');
      Object.defineProperty(contentClickEvent, 'target', {
        value: dialogContent,
        enumerable: true,
      });
      Object.defineProperty(contentClickEvent, 'currentTarget', {
        value: backdrop,
        enumerable: true,
      });
      component.onBackdropClick(contentClickEvent);
      expect(component.closeDialog).not.toHaveBeenCalled();
    });
  });

  describe('Edit mode', () => {
    const existingTask = createMockTask({
      id: 'existing-task-id',
      title: 'Existing Task',
      summary: 'Existing Summary',
      description: 'Existing Description',
    });

    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('task', existingTask);
      fixture.detectChanges();
    });

    it('should pre-populate form and show edit mode UI', () => {
      expect(component.isEditMode).toBe(true);
      expect(component.dialogTitle).toBe('tasks.dialog.editTitle');
      expect(component.taskForm.value).toEqual({
        title: 'Existing Task',
        summary: 'Existing Summary',
        description: 'Existing Description',
      });
    });

    it('should call updateTask when submitting in edit mode', () => {
      mockTasksService.updateTask.and.returnValue(of(existingTask));

      component.taskForm.patchValue({ title: 'Updated Title' });
      component.onSubmit();

      expect(mockTasksService.updateTask).toHaveBeenCalledWith('project-1', 'existing-task-id', {
        title: 'Updated Title',
        summary: 'Existing Summary',
        description: 'Existing Description',
      });
    });

    it('should display correct button text based on loading state', () => {
      expect(component.submitButtonText).toBe('tasks.dialog.submitEdit');
      component.isLoading.set(true);
      expect(component.submitButtonText).toBe('tasks.dialog.saving');
    });

    it('should emit taskSaved event with updated task on successful update', (done) => {
      const updatedTask = { ...existingTask, title: 'Updated Title' };
      mockTasksService.updateTask.and.returnValue(of(updatedTask));

      spyOn(component.taskSaved, 'emit');

      component.taskForm.patchValue({ title: 'Updated Title' });
      component.onSubmit();

      setTimeout(() => {
        expect(component.taskSaved.emit).toHaveBeenCalledWith(updatedTask);
        done();
      }, 100);
    });
  });

  describe('Create mode', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('task', null);
      fixture.detectChanges();
    });

    it('should show create mode UI with empty form', () => {
      expect(component.isEditMode).toBe(false);
      expect(component.dialogTitle).toBe('tasks.dialog.createTitle');
      expect(component.taskForm.value).toEqual({ title: null, summary: null, description: null });
    });

    it('should call createTask when submitting in create mode', () => {
      mockTasksService.createTask.and.returnValue(of(createMockTask()));

      component.taskForm.patchValue({ title: 'New Task', description: 'New Description' });
      component.onSubmit();

      expect(mockTasksService.createTask).toHaveBeenCalledWith('project-1', {
        title: 'New Task',
        summary: undefined,
        description: 'New Description',
      });
    });

    it('should display correct button text based on loading state', () => {
      expect(component.submitButtonText).toBe('tasks.dialog.submitCreate');
      component.isLoading.set(true);
      expect(component.submitButtonText).toBe('tasks.dialog.creating');
    });
  });
});
