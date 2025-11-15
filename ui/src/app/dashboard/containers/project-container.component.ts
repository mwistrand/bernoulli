import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskDialogComponent } from '../../tasks/components/task-dialog.component';
import { Task, TasksService } from '../../tasks/services/tasks.service';
import { TaskCardComponent } from '../../projects/components/task-card.component';

@Component({
  selector: 'bn-project-container',
  standalone: true,
  imports: [TaskDialogComponent, TaskCardComponent],
  templateUrl: './project-container.component.html',
  styleUrl: './project-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectContainerComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #tasksService = inject(TasksService);

  readonly isDialogOpen = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly editingTask = signal<Task | null>(null);
  readonly deletingTask = signal<Task | null>(null);

  readonly projectId = signal<string>('');
  readonly project = signal<any>(null);
  readonly tasks = signal<any[]>([]);

  ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id');
    const resolvedProject = this.#route.snapshot.data['project'];

    if (id) {
      this.projectId.set(id);
      if (resolvedProject) {
        this.project.set(resolvedProject);
        const resolvedTasks = this.#route.snapshot.data['tasks'];
        this.tasks.set(resolvedTasks ?? []);
      } else {
        // If project not found, redirect to dashboard
        this.#router.navigate(['/dashboard']);
      }
    }
  }

  protected openDialog(): void {
    this.editingTask.set(null);
    this.isDialogOpen.set(true);
  }

  protected closeDialog(): void {
    this.isDialogOpen.set(false);
    this.editingTask.set(null);
  }

  protected onTaskSaved(task: Task): void {
    const id = this.#route.snapshot.paramMap.get('id');
    if (!id?.trim) {
      return;
    }

    // Reload all tasks to ensure consistency
    this.#tasksService.fetchTasksByProjectId(id).subscribe((tasks) => {
      this.tasks.set(tasks);
    });
  }

  protected onEditTask(task: Task): void {
    this.editingTask.set(task);
    this.isDialogOpen.set(true);
  }

  protected onDeleteTask(task: Task): void {
    if (
      !confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)
    ) {
      return;
    }

    this.isLoading.set(true);
    this.#tasksService.deleteTask(this.projectId(), task.id).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Update local task list
        this.tasks.update((tasks) => tasks.filter((t) => t.id !== task.id));
      },
      error: (error) => {
        this.isLoading.set(false);
        alert(`Failed to delete task: ${error.message}`);
      },
    });
  }

  protected goBack(): void {
    this.#router.navigate(['/dashboard']);
  }

  protected navigateToMembers(): void {
    this.#router.navigate(['/dashboard/projects', this.projectId(), 'members']);
  }
}
