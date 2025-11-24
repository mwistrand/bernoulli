import { Routes } from '@angular/router';
import { ProjectResolver } from '../projects/resolvers/project.resolver';
import { ProjectsResolver } from '../projects/resolvers/projects.resolver';
import { TasksResolver } from '../projects/resolvers/tasks.resolver';
import { CurrentMemberResolver } from '../projects/resolvers/current-member.resolver';
import { ProjectMembersResolver } from '../projects/resolvers/project-members.resolver';
import { DashboardContainerComponent } from './containers/dashboard-container.component';
import { authGuard } from '../auth/guards/auth.guard';
import { ProjectContainerComponent } from './containers/project-container.component';
import { ProjectMemberContainer } from './containers/project-member-container';
import { TaskDetailsComponent } from '../tasks/components/task-details.component';
import { TaskFormComponent } from '../tasks/components/task-form.component';

export const dashboardRoutes: Routes = [
  {
    canActivate: [authGuard],
    path: '',
    component: DashboardContainerComponent,
    resolve: { projects: ProjectsResolver },
  },
  {
    canActivate: [authGuard],
    path: 'projects/:id',
    component: ProjectContainerComponent,
    resolve: {
      project: ProjectResolver,
      tasks: TasksResolver,
      currentMember: CurrentMemberResolver,
    },
  },
  {
    canActivate: [authGuard],
    path: 'projects/:projectId/tasks/new',
    component: TaskFormComponent,
  },
  {
    canActivate: [authGuard],
    path: 'projects/:projectId/tasks/:taskId/edit',
    component: TaskFormComponent,
  },
  {
    canActivate: [authGuard],
    path: 'projects/:projectId/tasks/:taskId',
    component: TaskDetailsComponent,
  },
  {
    canActivate: [authGuard],
    path: 'projects/:id/members',
    component: ProjectMemberContainer,
    resolve: {
      project: ProjectResolver,
      members: ProjectMembersResolver,
      currentMember: CurrentMemberResolver,
    },
  },
];
