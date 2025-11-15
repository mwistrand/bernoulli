import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CreateTaskDialogComponent } from '../../tasks/components/create-task-dialog/create-task-dialog.component';

@Component({
  selector: 'bn-project-container',
  standalone: true,
  imports: [CreateTaskDialogComponent, DatePipe],
  templateUrl: './project-container.component.html',
  styleUrl: './project-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectContainerComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

  readonly isDialogOpen = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false); // can be removed, but keep for dialog

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
}
