import { Routes } from '@angular/router';
import { DashboardContainerComponent } from './containers/dashboard-container.component';
import { ProjectDetailComponent } from './containers/project-detail/project-detail.component';
import { authGuard } from '../auth/guards/auth.guard';

export const dashboardRoutes: Routes = [
  {
    canActivate: [authGuard],
    path: '',
    component: DashboardContainerComponent,
  },
  {
    canActivate: [authGuard],
    path: 'projects/:id',
    component: ProjectDetailComponent,
  },
];
