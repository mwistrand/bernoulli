import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { TasksService } from '../../services/tasks.service';

@Component({
  selector: 'bn-create-task-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, A11yModule],
  templateUrl: './create-task-dialog.component.html',
  styleUrl: './create-task-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTaskDialogComponent {
  readonly #tasksService = inject(TasksService);

  isOpen = input<boolean>(false);
  projectId = input.required<string>();
  dialogClosed = output<void>();
  taskCreated = output<void>();

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly taskForm = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.maxLength(300)]),
    summary: new FormControl('', [Validators.maxLength(500)]),
    description: new FormControl('', [Validators.required, Validators.maxLength(5000)]),
  });

  onSubmit(): void {
    if (this.taskForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { title, summary, description } = this.taskForm.value;

    this.#tasksService
      .createTask(this.projectId(), {
        title: title!,
        summary: summary || undefined,
        description: description!,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.taskForm.reset();
          this.taskCreated.emit();
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
