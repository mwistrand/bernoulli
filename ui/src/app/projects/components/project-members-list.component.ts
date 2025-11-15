import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';
import {
  ProjectMember,
  ProjectMembersService,
  ProjectRole,
} from '../services/project-members.service';
import { PermissionsService } from '../../shared/services/permissions.service';
import { AddMemberDialogComponent, AddMemberDialogData } from './add-member-dialog.component';

@Component({
  standalone: true,
  selector: 'bn-project-members-list',
  imports: [CommonModule, DialogModule, OverlayModule, TranslateModule],
  templateUrl: './project-members-list.component.html',
  styleUrl: './project-members-list.component.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ProjectMembersListComponent implements OnInit {
  readonly #permissionsService = inject(PermissionsService);
  readonly #projectMembersService = inject(ProjectMembersService);
  readonly #dialog = inject(Dialog);

  // Inputs
  readonly projectId = input.required<string>();
  readonly currentMember = input<ProjectMember | null>(null);
  readonly projectCreatorId = input.required<string>();

  // Outputs
  readonly membersChanged = output<void>();

  // State
  protected readonly ProjectRole = ProjectRole;
  protected readonly members = signal<ProjectMember[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly openMenuId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMembers();
  }

  protected loadMembers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.#projectMembersService.getProjectMembers(this.projectId()).subscribe({
      next: (members) => {
        this.members.set(members);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to load members');
        this.isLoading.set(false);
      },
    });
  }

  protected canManageMembers(): boolean {
    return this.#permissionsService.canManageMembers(this.currentMember());
  }

  protected canManageThisMember(member: ProjectMember): boolean {
    return (
      this.canUpdateRole(member) ||
      this.#permissionsService.canRemoveMember(
        this.currentMember(),
        member,
        this.projectCreatorId(),
      )
    );
  }

  protected canUpdateRole(member: ProjectMember): boolean {
    return this.#permissionsService.canUpdateMemberRole(
      this.currentMember(),
      member,
      this.projectCreatorId(),
    );
  }

  protected canRemove(member: ProjectMember): boolean {
    return this.#permissionsService.canRemoveMember(
      this.currentMember(),
      member,
      this.projectCreatorId(),
    );
  }

  protected getRoleLabel(role: ProjectRole): string {
    return role === ProjectRole.ADMIN ? 'projects.roles.admin' : 'projects.roles.user';
  }

  protected toggleMenu(memberId: string): void {
    this.openMenuId.set(this.openMenuId() === memberId ? null : memberId);
  }

  protected closeMenu(): void {
    this.openMenuId.set(null);
  }

  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-container')) {
      this.closeMenu();
    }
  }

  protected onAddMember(): void {
    const dialogData: AddMemberDialogData = {
      projectId: this.projectId(),
      existingMemberIds: this.members().map((m) => m.userId),
    };

    const dialogRef = this.#dialog.open<ProjectMember | null>(AddMemberDialogComponent, {
      data: dialogData,
    });

    dialogRef.closed.subscribe((result) => {
      if (result) {
        this.loadMembers();
        this.membersChanged.emit();
      }
    });
  }

  protected onChangeRole(member: ProjectMember): void {
    this.closeMenu();
    const newRole = member.role === ProjectRole.ADMIN ? ProjectRole.USER : ProjectRole.ADMIN;

    this.#projectMembersService
      .updateMemberRole(this.projectId(), member.userId, { role: newRole })
      .subscribe({
        next: () => {
          this.loadMembers();
          this.membersChanged.emit();
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || 'Failed to update role');
        },
      });
  }

  protected onRemoveMember(member: ProjectMember): void {
    this.closeMenu();

    if (!confirm(`Remove ${member.userName} from this project?`)) {
      return;
    }

    this.#projectMembersService.removeMember(this.projectId(), member.userId).subscribe({
      next: () => {
        this.loadMembers();
        this.membersChanged.emit();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to remove member');
      },
    });
  }
}
