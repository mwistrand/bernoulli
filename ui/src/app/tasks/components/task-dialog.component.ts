import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { Task, TasksService } from '../services/tasks.service';

@Component({
  selector: 'bn-task-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, A11yModule],
  templateUrl: './task-dialog.component.html',
  styleUrl: './task-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDialogComponent {
  readonly #tasksService = inject(TasksService);

  isOpen = input<boolean>(false);
  projectId = input.required<string>();
  task = input<Task | null>(null);
  dialogClosed = output<void>();
  taskSaved = output<Task>();

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly taskForm = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.maxLength(300)]),
    summary: new FormControl('', [Validators.maxLength(500)]),
    description: new FormControl('', [Validators.required, Validators.maxLength(5000)]),
  });

  constructor() {
    // Update form when task input changes (for edit mode)
    effect(() => {
      const taskData = this.task();
      if (taskData) {
        this.taskForm.patchValue({
          title: taskData.title,
          summary: taskData.summary || '',
          description: taskData.description,
        });
      } else {
        this.taskForm.reset();
      }
    });
  }

  get isEditMode(): boolean {
    return this.task() !== null;
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Edit Task' : 'Create New Task';
  }

  get submitButtonText(): string {
    if (this.isLoading()) {
      return this.isEditMode ? 'Saving...' : 'Creating...';
    }
    return this.isEditMode ? 'Save Changes' : 'Create Task';
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { title, summary, description } = this.taskForm.value;

    const operation = this.isEditMode
      ? this.#tasksService.updateTask(this.projectId(), this.task()!.id, {
          title: title!,
          summary: summary || null,
          description: description!,
        })
      : this.#tasksService.createTask(this.projectId(), {
          title: title!,
          summary: summary || undefined,
          description: description!,
        });

    operation.subscribe({
      next: (savedTask) => {
        this.isLoading.set(false);
        this.taskForm.reset();
        this.taskSaved.emit(savedTask);
        this.closeDialog();
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      },
    });
  }

  closeDialog(): void {
    this.taskForm.reset();
    this.errorMessage.set(null);
    this.dialogClosed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Close dialog when clicking on the backdrop (not the dialog content)
    if (event.target === event.currentTarget) {
      this.closeDialog();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Close dialog on Escape key
    if (event.key === 'Escape') {
      this.closeDialog();
    }
  }
}
