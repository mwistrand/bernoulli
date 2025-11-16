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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Dialog visibility', () => {
    it('should not render dialog when isOpen is false', () => {
      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();

      const dialogBackdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      expect(dialogBackdrop).toBeNull();
    });

    it('should render dialog when isOpen is true', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const dialogBackdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      expect(dialogBackdrop).not.toBeNull();
    });
  });

  describe('Focus management', () => {
    it('should auto-focus the title input when dialog opens', (done) => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      // Wait for focus trap to activate
      setTimeout(() => {
        const titleInput = fixture.nativeElement.querySelector('#task-title');
        expect(document.activeElement).toBe(titleInput);
        done();
      }, 100);
    });

    it('should trap focus within the dialog', (done) => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      setTimeout(() => {
        const dialogContent = fixture.nativeElement.querySelector('.dialog-content');
        const titleInput = fixture.nativeElement.querySelector('#task-title');

        // Focus should start on title input due to cdkFocusInitial
        expect(document.activeElement).toBe(titleInput);

        // Verify all focusable elements are within the dialog content
        const allFocusableElements = dialogContent.querySelectorAll('button, input, textarea');
        expect(allFocusableElements.length).toBeGreaterThan(0);

        allFocusableElements.forEach((element: Element) => {
          expect(dialogContent.contains(element)).toBe(true);
        });

        // Verify cdkTrapFocus directive is applied
        const trapFocusElement = fixture.nativeElement.querySelector('[cdkTrapFocus]');
        expect(trapFocusElement).toBe(dialogContent);

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

    it('should not close dialog when other keys are pressed', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      spyOn(component, 'closeDialog');

      const dialogBackdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      dialogBackdrop.dispatchEvent(enterEvent);

      expect(component.closeDialog).not.toHaveBeenCalled();
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should have invalid form when title and description are empty', () => {
      expect(component.taskForm.valid).toBe(false);
      expect(component.taskForm.get('title')?.errors?.['required']).toBe(true);
      expect(component.taskForm.get('description')?.errors?.['required']).toBe(true);
    });

    it('should have valid form when title and description are provided', () => {
      component.taskForm.patchValue({
        title: 'Test Task',
        description: 'Test Description',
      });
      expect(component.taskForm.valid).toBe(true);
    });

    it('should validate title max length', () => {
      const longTitle = 'a'.repeat(301);
      component.taskForm.patchValue({ title: longTitle, description: 'Test' });
      expect(component.taskForm.get('title')?.errors?.['maxlength']).toBeTruthy();
    });

    it('should validate summary max length', () => {
      const longSummary = 'a'.repeat(501);
      component.taskForm.patchValue({
        title: 'Test',
        summary: longSummary,
        description: 'Test',
      });
      expect(component.taskForm.get('summary')?.errors?.['maxlength']).toBeTruthy();
    });

    it('should validate description max length', () => {
      const longDescription = 'a'.repeat(5001);
      component.taskForm.patchValue({ title: 'Test', description: longDescription });
      expect(component.taskForm.get('description')?.errors?.['maxlength']).toBeTruthy();
    });

    it('should accept optional summary field', () => {
      component.taskForm.patchValue({
        title: 'Test Task',
        description: 'Test Description',
      });
      expect(component.taskForm.valid).toBe(true);
      // Summary can be null or empty string, both are valid
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

    it('should submit when form is valid', () => {
      mockTasksService.createTask.and.returnValue(of(createMockTask()));

      component.taskForm.patchValue({
        title: 'Test Task',
        description: 'Test Description',
      });
      component.onSubmit();

      expect(mockTasksService.createTask).toHaveBeenCalledWith('project-1', {
        title: 'Test Task',
        summary: undefined,
        description: 'Test Description',
      });
    });

    it('should submit with summary when provided', () => {
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

    it('should set loading state during submission', (done) => {
      mockTasksService.createTask.and.returnValue(of(createMockTask()).pipe(delay(10)));

      component.taskForm.patchValue({
        title: 'Test Task',
        description: 'Test Description',
      });
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

      component.taskForm.patchValue({
        title: 'Test Task',
        description: 'Test Description',
      });
      component.onSubmit();

      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        expect(component.taskSaved.emit).toHaveBeenCalled();
        expect(component.closeDialog).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should display error message on submission failure', (done) => {
      const errorMessage = 'Failed to create task';
      mockTasksService.createTask.and.returnValue(throwError(() => new Error(errorMessage)));

      component.taskForm.patchValue({
        title: 'Test Task',
        description: 'Test Description',
      });
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

    it('should close dialog and reset form when closeDialog is called', () => {
      component.taskForm.patchValue({
        title: 'Test Task',
        summary: 'Test Summary',
        description: 'Test Description',
      });
      component.errorMessage.set('Some error');

      spyOn(component.dialogClosed, 'emit');
      component.closeDialog();

      expect(component.taskForm.value).toEqual({
        title: null,
        summary: null,
        description: null,
      });
      expect(component.errorMessage()).toBeNull();
      expect(component.dialogClosed.emit).toHaveBeenCalled();
    });

    it('should close dialog when clicking on backdrop', () => {
      spyOn(component, 'closeDialog');

      const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      const clickEvent = new MouseEvent('click');
      Object.defineProperty(clickEvent, 'target', { value: backdrop, enumerable: true });
      Object.defineProperty(clickEvent, 'currentTarget', {
        value: backdrop,
        enumerable: true,
      });

      component.onBackdropClick(clickEvent);

      expect(component.closeDialog).toHaveBeenCalled();
    });

    it('should not close dialog when clicking on dialog content', () => {
      spyOn(component, 'closeDialog');

      const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      const dialogContent = fixture.nativeElement.querySelector('.dialog-content');
      const clickEvent = new MouseEvent('click');
      Object.defineProperty(clickEvent, 'target', {
        value: dialogContent,
        enumerable: true,
      });
      Object.defineProperty(clickEvent, 'currentTarget', {
        value: backdrop,
        enumerable: true,
      });

      component.onBackdropClick(clickEvent);

      expect(component.closeDialog).not.toHaveBeenCalled();
    });

    it('should close dialog when clicking close button', () => {
      spyOn(component, 'closeDialog');

      const closeButton = fixture.nativeElement.querySelector('.close-button');
      closeButton.click();

      expect(component.closeDialog).toHaveBeenCalled();
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

    it('should display "Edit Task" as dialog title when in edit mode', () => {
      expect(component.isEditMode).toBe(true);
      expect(component.dialogTitle).toBe('tasks.dialog.editTitle');
    });

    it('should pre-populate form with existing task data', () => {
      expect(component.taskForm.value).toEqual({
        title: 'Existing Task',
        summary: 'Existing Summary',
        description: 'Existing Description',
      });
    });

    it('should call updateTask when submitting in edit mode', () => {
      mockTasksService.updateTask.and.returnValue(of(existingTask));

      component.taskForm.patchValue({
        title: 'Updated Title',
      });
      component.onSubmit();

      expect(mockTasksService.updateTask).toHaveBeenCalledWith('project-1', 'existing-task-id', {
        title: 'Updated Title',
        summary: 'Existing Summary',
        description: 'Existing Description',
      });
    });

    it('should display correct button text when editing', () => {
      expect(component.submitButtonText).toBe('tasks.dialog.submitEdit');
    });

    it('should display "Saving..." when loading in edit mode', () => {
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

    it('should display error message on update failure', (done) => {
      const errorMessage = 'Failed to update task';
      mockTasksService.updateTask.and.returnValue(throwError(() => new Error(errorMessage)));

      component.onSubmit();

      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        expect(component.errorMessage()).toBe(errorMessage);
        done();
      }, 100);
    });

    it('should reset form to empty when switching from edit to create mode', () => {
      // First verify form has existing task data
      expect(component.taskForm.value.title).toBe('Existing Task');

      // Switch to create mode
      fixture.componentRef.setInput('task', null);
      fixture.detectChanges();

      // Form should now be empty
      expect(component.taskForm.value).toEqual({
        title: null,
        summary: null,
        description: null,
      });
    });
  });

  describe('Create mode', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('task', null);
      fixture.detectChanges();
    });

    it('should display "Create New Task" as dialog title when in create mode', () => {
      expect(component.isEditMode).toBe(false);
      expect(component.dialogTitle).toBe('tasks.dialog.createTitle');
    });

    it('should have empty form in create mode', () => {
      // Form reset sets values to null, which is acceptable for empty state
      expect(component.taskForm.value).toEqual({
        title: null,
        summary: null,
        description: null,
      });
    });

    it('should call createTask when submitting in create mode', () => {
      mockTasksService.createTask.and.returnValue(of(createMockTask()));

      component.taskForm.patchValue({
        title: 'New Task',
        description: 'New Description',
      });
      component.onSubmit();

      expect(mockTasksService.createTask).toHaveBeenCalledWith('project-1', {
        title: 'New Task',
        summary: undefined,
        description: 'New Description',
      });
    });

    it('should display correct button text when creating', () => {
      expect(component.submitButtonText).toBe('tasks.dialog.submitCreate');
    });

    it('should display "Creating..." when loading in create mode', () => {
      component.isLoading.set(true);
      expect(component.submitButtonText).toBe('tasks.dialog.creating');
    });
  });
});
