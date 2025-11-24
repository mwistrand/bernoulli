import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { LucideAngularModule, ArrowLeftIcon, CalendarIcon } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Task, TasksService } from '../services/tasks.service';

@Component({
  selector: 'bn-task-details',
  standalone: true,
  imports: [CommonModule, DatePipe, LucideAngularModule, TranslateModule],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsComponent implements OnInit {
  protected readonly ArrowLeftIcon = ArrowLeftIcon;
  protected readonly CalendarIcon = CalendarIcon;
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #tasksService = inject(TasksService);
  readonly #translate = inject(TranslateService);

  readonly task = signal<Task | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly projectId = signal<string>('');

  ngOnInit(): void {
    const projectId = this.#route.snapshot.paramMap.get('projectId');
    const taskId = this.#route.snapshot.paramMap.get('taskId');
    if (!projectId || !taskId) {
      this.#router.navigate(['/dashboard']);
      return;
    }
    this.projectId.set(projectId);
    this.#tasksService.fetchTasksByProjectId(projectId).subscribe((tasks) => {
      const found = tasks.find((t) => t.id === taskId);
      if (found) {
        this.task.set(found);
      } else {
        this.#router.navigate(['/dashboard/projects', projectId]);
      }
      this.isLoading.set(false);
    });
  }

  protected goBack(): void {
    this.#router.navigate(['/dashboard/projects', this.projectId()]);
  }
}
