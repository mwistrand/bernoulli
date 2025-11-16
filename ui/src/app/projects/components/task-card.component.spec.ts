import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
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
      imports: [TaskCardComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
  });

  describe('Action buttons', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('task', createMockTask({ title: 'Test Task' }));
      fixture.detectChanges();
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

    it('should have appropriate aria-labels and titles on buttons', () => {
      const editButton = fixture.nativeElement.querySelector('.edit-button');
      expect(editButton.getAttribute('aria-label')).toBe('tasks.card.editAriaLabel');
      expect(editButton.getAttribute('title')).toBe('tasks.card.editTitle');

      const deleteButton = fixture.nativeElement.querySelector('.delete-button');
      expect(deleteButton.getAttribute('aria-label')).toBe('tasks.card.deleteAriaLabel');
      expect(deleteButton.getAttribute('title')).toBe('tasks.card.deleteTitle');
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
});
