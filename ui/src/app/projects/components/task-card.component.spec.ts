import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { Task } from '../../tasks/services/tasks.service';

const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: '1',
  projectId: 'project-1',
  title: 'Test Task',
  summary: undefined,
  description: 'Test Description',
  createdAt: new Date('2024-01-15'),
  createdBy: 'test-user',
  lastUpdatedAt: new Date('2024-01-15'),
  lastUpdatedBy: 'test-user',
  ...overrides,
});

describe('TaskCardComponent', () => {
  let component: TaskCardComponent;
  let fixture: ComponentFixture<TaskCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('task', createMockTask());
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Rendering', () => {
    it('should display task title', () => {
      const task = createMockTask({ title: 'My Task Title' });
      fixture.componentRef.setInput('task', task);
      fixture.detectChanges();

      const titleElement = fixture.nativeElement.querySelector('h3');
      expect(titleElement.textContent).toBe('My Task Title');
    });

    it('should display task description', () => {
      const task = createMockTask({ description: 'This is a test description' });
      fixture.componentRef.setInput('task', task);
      fixture.detectChanges();

      const descriptionElement = fixture.nativeElement.querySelector('.task-description');
      expect(descriptionElement.textContent).toBe('This is a test description');
    });

    it('should display task summary when present', () => {
      const task = createMockTask({ summary: 'Task summary' });
      fixture.componentRef.setInput('task', task);
      fixture.detectChanges();

      const summaryElement = fixture.nativeElement.querySelector('.task-summary');
      expect(summaryElement).not.toBeNull();
      expect(summaryElement.textContent).toBe('Task summary');
    });

    it('should not display summary element when summary is not present', () => {
      const task = createMockTask({ summary: undefined });
      fixture.componentRef.setInput('task', task);
      fixture.detectChanges();

      const summaryElement = fixture.nativeElement.querySelector('.task-summary');
      expect(summaryElement).toBeNull();
    });

    it('should display formatted creation date', () => {
      const task = createMockTask({ createdAt: new Date('2024-01-15') });
      fixture.componentRef.setInput('task', task);
      fixture.detectChanges();

      const metaItem = fixture.nativeElement.querySelector('.meta-item');
      // Note: Date formatting can vary based on timezone, so check for either date
      const text = metaItem.textContent;
      expect(text).toMatch(/Created Jan (14|15), 2024/);
    });

    it('should render as an article element for semantic HTML', () => {
      fixture.componentRef.setInput('task', createMockTask());
      fixture.detectChanges();

      const article = fixture.nativeElement.querySelector('article');
      expect(article).not.toBeNull();
      expect(article.classList.contains('task-card')).toBe(true);
    });
  });

  describe('Action buttons', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('task', createMockTask({ title: 'Test Task' }));
      fixture.detectChanges();
    });

    it('should have edit button', () => {
      const editButton = fixture.nativeElement.querySelector('.edit-button');
      expect(editButton).not.toBeNull();
      expect(editButton.textContent.trim()).toBe('Edit');
    });

    it('should have delete button', () => {
      const deleteButton = fixture.nativeElement.querySelector('.delete-button');
      expect(deleteButton).not.toBeNull();
      expect(deleteButton.textContent.trim()).toBe('Delete');
    });

    it('should emit edit event when edit button is clicked', () => {
      const task = createMockTask();
      fixture.componentRef.setInput('task', task);
      fixture.detectChanges();

      spyOn(component.edit, 'emit');

      const editButton = fixture.nativeElement.querySelector('.edit-button');
      editButton.click();

      expect(component.edit.emit).toHaveBeenCalledWith(task);
    });

    it('should emit delete event when delete button is clicked', () => {
      const task = createMockTask();
      fixture.componentRef.setInput('task', task);
      fixture.detectChanges();

      spyOn(component.delete, 'emit');

      const deleteButton = fixture.nativeElement.querySelector('.delete-button');
      deleteButton.click();

      expect(component.delete.emit).toHaveBeenCalledWith(task);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('task', createMockTask({ title: 'My Task' }));
      fixture.detectChanges();
    });

    it('should have appropriate aria-label on edit button', () => {
      const editButton = fixture.nativeElement.querySelector('.edit-button');
      expect(editButton.getAttribute('aria-label')).toBe('Edit My Task');
    });

    it('should have appropriate aria-label on delete button', () => {
      const deleteButton = fixture.nativeElement.querySelector('.delete-button');
      expect(deleteButton.getAttribute('aria-label')).toBe('Delete My Task');
    });

    it('should have title attribute on edit button', () => {
      const editButton = fixture.nativeElement.querySelector('.edit-button');
      expect(editButton.getAttribute('title')).toBe('Edit task');
    });

    it('should have title attribute on delete button', () => {
      const deleteButton = fixture.nativeElement.querySelector('.delete-button');
      expect(deleteButton.getAttribute('title')).toBe('Delete task');
    });

    it('should mark decorative icons as aria-hidden', () => {
      const icons = fixture.nativeElement.querySelectorAll('lucide-icon[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have type="button" on all buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons.forEach((button: HTMLButtonElement) => {
        expect(button.type).toBe('button');
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle very long titles gracefully', () => {
      const longTitle = 'A'.repeat(300);
      const task = createMockTask({ title: longTitle });
      fixture.componentRef.setInput('task', task);
      fixture.detectChanges();

      const titleElement = fixture.nativeElement.querySelector('h3');
      expect(titleElement.textContent).toBe(longTitle);
    });

    it('should handle very long descriptions gracefully', () => {
      const longDescription = 'B'.repeat(5000);
      const task = createMockTask({ description: longDescription });
      fixture.componentRef.setInput('task', task);
      fixture.detectChanges();

      const descriptionElement = fixture.nativeElement.querySelector('.task-description');
      expect(descriptionElement.textContent).toBe(longDescription);
    });

    it('should handle multi-line descriptions with proper whitespace', () => {
      const multiLineDescription = 'Line 1\nLine 2\nLine 3';
      const task = createMockTask({ description: multiLineDescription });
      fixture.componentRef.setInput('task', task);
      fixture.detectChanges();

      const descriptionElement = fixture.nativeElement.querySelector('.task-description');
      expect(descriptionElement.textContent).toBe(multiLineDescription);
    });
  });
});
