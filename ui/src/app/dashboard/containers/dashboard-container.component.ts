import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CreateProjectDialogComponent } from '../../projects/components/create-project-dialog.component';
import { ProjectsService } from '../../projects/services/projects.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'bn-dashboard-container',
  standalone: true,
  imports: [CreateProjectDialogComponent, DatePipe],
  templateUrl: './dashboard-container.component.html',
  styleUrl: './dashboard-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardContainerComponent {
  readonly #projectsService = inject(ProjectsService);
  readonly #router = inject(Router);

  protected readonly projectsService = this.#projectsService;
  protected readonly isDialogOpen = signal<boolean>(false);

  openDialog(): void {
    this.isDialogOpen.set(true);
  }

  closeDialog(): void {
    this.isDialogOpen.set(false);
  }

  onProjectCreated(): void {
    // Dialog will be closed automatically, projects list is already updated via signal
  }

  navigateToProject(projectId: string): void {
    this.#router.navigate(['/dashboard/projects', projectId]);
  }
}
