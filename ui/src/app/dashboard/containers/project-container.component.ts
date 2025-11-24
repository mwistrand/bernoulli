import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  LucideAngularModule,
  ArrowLeftIcon,
  UsersIcon,
  PlusIcon,
  CheckSquareIcon,
} from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Task, TasksService } from '../../tasks/services/tasks.service';
import { TaskCardComponent } from '../../projects/components/task-card.component';

@Component({
  selector: 'bn-project-container',
  standalone: true,
  imports: [TaskCardComponent, LucideAngularModule, TranslateModule],
  templateUrl: './project-container.component.html',
  styleUrl: './project-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectContainerComponent implements OnInit {
  protected readonly ArrowLeftIcon = ArrowLeftIcon;
  protected readonly UsersIcon = UsersIcon;
  protected readonly PlusIcon = PlusIcon;
  protected readonly CheckSquareIcon = CheckSquareIcon;

  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #tasksService = inject(TasksService);
  readonly #translate = inject(TranslateService);

  readonly isLoading = signal<boolean>(false);

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

  protected navigateToNewTask(): void {
    this.#router.navigate(['/dashboard/projects', this.projectId(), 'tasks', 'new']);
  }

  protected navigateToEditTask(task: Task): void {
    this.#router.navigate(['/dashboard/projects', this.projectId(), 'tasks', task.id, 'edit']);
  }

  protected onDeleteTask(task: Task): void {
    const confirmMessage = this.#translate.instant('tasks.confirmDelete', { title: task.title });
    if (!confirm(confirmMessage)) {
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
        const errorMessage = this.#translate.instant('tasks.errors.deleteFailed', {
          message: error.message,
        });
        alert(errorMessage);
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
