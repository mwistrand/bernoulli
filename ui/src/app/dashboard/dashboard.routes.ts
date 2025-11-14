import { Routes } from '@angular/router';
import { DashboardContainerComponent } from './containers/dashboard-container.component';
import { authGuard } from '../auth/guards/auth.guard';

export const dashboardRoutes: Routes = [
  {
    canActivate: [authGuard],
    path: '',
    component: DashboardContainerComponent,
  },
];
