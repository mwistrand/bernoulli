import { inject, Injectable } from '@angular/core';
import { UserRole, AuthService } from '../../auth/services/auth.service';
import { ProjectRole, ProjectMember } from '../../projects/services/project-members.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  readonly #authService = inject(AuthService);

  /**
   * Check if the current user is a system admin
   */
  isSystemAdmin(): boolean {
    const user = this.#authService.currentUser();
    return user?.role === UserRole.ADMIN;
  }

  /**
   * Check if the current user can create projects
   */
  canCreateProjects(): boolean {
    return this.isSystemAdmin();
  }

  /**
   * Check if the current user is a project admin
   */
  isProjectAdmin(member: ProjectMember | null | undefined): boolean {
    return member?.role === ProjectRole.ADMIN;
  }

  /**
   * Check if the current user can manage project members
   */
  canManageMembers(member: ProjectMember | null | undefined): boolean {
    return this.isProjectAdmin(member);
  }

  /**
   * Check if the current user can update member roles
   */
  canUpdateMemberRole(
    currentMember: ProjectMember | null | undefined,
    targetMember: ProjectMember,
    projectCreatorId: string | undefined,
  ): boolean {
    // Must be project admin
    if (!this.isProjectAdmin(currentMember)) {
      return false;
    }

    // Cannot change the project creator's role
    if (projectCreatorId && targetMember.userId === projectCreatorId) {
      return false;
    }

    return true;
  }

  /**
   * Check if the current user can remove a member
   */
  canRemoveMember(
    currentMember: ProjectMember | null | undefined,
    targetMember: ProjectMember,
    projectCreatorId: string | undefined,
  ): boolean {
    // Must be project admin
    if (!this.isProjectAdmin(currentMember)) {
      return false;
    }

    // Cannot remove the project creator
    if (projectCreatorId && targetMember.userId === projectCreatorId) {
      return false;
    }

    return true;
  }

  /**
   * Check if the current user can manage tasks in a project
   */
  canManageTasks(member: ProjectMember | null | undefined): boolean {
    // Any project member can manage tasks
    return member !== null && member !== undefined;
  }
}
