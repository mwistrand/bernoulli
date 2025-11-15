import { Routes } from '@angular/router';
import { ProjectResolver } from '../projects/resolvers/project.resolver';
import { TasksResolver } from '../projects/resolvers/tasks.resolver';
import { DashboardContainerComponent } from './containers/dashboard-container.component';
import { authGuard } from '../auth/guards/auth.guard';
import { ProjectContainerComponent } from './containers/project-container.component';

export const dashboardRoutes: Routes = [
  {
    canActivate: [authGuard],
    path: '',
    component: DashboardContainerComponent,
  },
  {
    canActivate: [authGuard],
    path: 'projects/:id',
    component: ProjectContainerComponent,
    resolve: { project: ProjectResolver, tasks: TasksResolver },
  },
];
