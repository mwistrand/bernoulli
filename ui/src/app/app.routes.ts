import { Routes } from '@angular/router';
import { LoginComponent } from './auth/components/login.component';
import { SignupComponent } from './auth/components/signup.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];
