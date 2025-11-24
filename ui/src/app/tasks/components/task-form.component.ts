import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeftIcon } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Task, TasksService } from '../services/tasks.service';

@Component({
  selector: 'bn-task-form',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, TranslateModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent implements OnInit {
  protected readonly ArrowLeftIcon = ArrowLeftIcon;

  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #tasksService = inject(TasksService);
  readonly #translate = inject(TranslateService);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly projectId = signal<string>('');
  readonly taskId = signal<string | null>(null);
  readonly task = signal<Task | null>(null);

  readonly taskForm = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.maxLength(300)]),
    summary: new FormControl('', [Validators.maxLength(500)]),
    description: new FormControl('', [Validators.required, Validators.maxLength(5000)]),
  });

  constructor() {
    // Update form when task changes (for edit mode)
    effect(() => {
      const taskData = this.task();
      if (taskData) {
        this.taskForm.patchValue({
          title: taskData.title,
          summary: taskData.summary || '',
          description: taskData.description,
        });
      }
    });
  }

  ngOnInit(): void {
    const projectId = this.#route.snapshot.paramMap.get('projectId');
    const taskId = this.#route.snapshot.paramMap.get('taskId');

    if (!projectId) {
      this.#router.navigate(['/dashboard']);
      return;
    }

    this.projectId.set(projectId);

    if (taskId) {
      // Edit mode
      this.taskId.set(taskId);
      this.isLoading.set(true);

      this.#tasksService.fetchTaskById(projectId, taskId).subscribe({
        next: (task) => {
          this.isLoading.set(false);
          this.task.set(task);
        },
        error: (error: Error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.message);
        },
      });
    }
  }

  get isEditMode(): boolean {
    return this.taskId() !== null;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'tasks.editTask' : 'tasks.newTask';
  }

  get submitButtonText(): string {
    if (this.isLoading()) {
      return this.isEditMode ? 'tasks.dialog.saving' : 'tasks.dialog.creating';
    }
    return this.isEditMode ? 'tasks.dialog.submitEdit' : 'tasks.dialog.submitCreate';
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { title, summary, description } = this.taskForm.value;

    const operation = this.isEditMode
      ? this.#tasksService.updateTask(this.projectId(), this.taskId()!, {
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
      next: () => {
        this.isLoading.set(false);
        this.goBackToProject();
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      },
    });
  }

  goBackToProject(): void {
    this.#router.navigate(['/dashboard/projects', this.projectId()]);
  }
}
