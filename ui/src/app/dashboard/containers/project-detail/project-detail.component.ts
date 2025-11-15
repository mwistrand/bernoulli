import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ProjectsService } from '../../../projects/services/projects.service';
import { TasksService } from '../../../tasks/services/tasks.service';
import { CreateTaskDialogComponent } from '../../../tasks/components/create-task-dialog/create-task-dialog.component';

@Component({
  selector: 'bn-project-detail',
  standalone: true,
  imports: [CreateTaskDialogComponent, DatePipe],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #projectsService = inject(ProjectsService);
  readonly #tasksService = inject(TasksService);

  readonly projectsService = this.#projectsService;
  readonly tasksService = this.#tasksService;
  readonly isDialogOpen = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly projectId = signal<string>('');
  readonly project = signal<any>(null);
  readonly tasks = signal<any[]>([]);

  ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId.set(id);
      this.loadProject(id);
      this.loadTasks(id);
    }
  }

  openDialog(): void {
    this.isDialogOpen.set(true);
  }

  closeDialog(): void {
    this.isDialogOpen.set(false);
  }

  onTaskCreated(): void {
    // Dialog will be closed automatically, tasks list is already updated via signal
  }

  goBack(): void {
    this.#router.navigate(['/dashboard']);
  }

  private loadProject(id: string): void {
    const projects = this.#projectsService.projects();
    const project = projects.find((p) => p.id === id);
    if (project) {
      this.project.set(project);
    } else {
      // If project not found in cache, redirect to dashboard
      this.#router.navigate(['/dashboard']);
    }
  }

  private loadTasks(projectId: string): void {
    this.isLoading.set(true);
    this.#tasksService.fetchTasksByProjectId(projectId).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load tasks:', error);
        this.isLoading.set(false);
      },
    });
  }
}
