import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import {
  ProjectMember,
  ProjectMembersService,
  ProjectRole,
} from '../../projects/services/project-members.service';
import { PermissionsService } from '../../shared/services/permissions.service';
import {
  AddMemberDialogComponent,
  AddMemberDialogData,
} from '../../projects/components/add-member-dialog.component';

@Component({
  selector: 'bn-project-member-container',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './project-member-container.html',
  styleUrl: './project-member-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMemberContainer implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #projectMembersService = inject(ProjectMembersService);
  readonly #permissionsService = inject(PermissionsService);
  readonly #dialog = inject(Dialog);

  protected readonly ProjectRole = ProjectRole;
  protected readonly projectId = signal<string>('');
  protected readonly project = signal<any>(null);
  protected readonly members = signal<ProjectMember[]>([]);
  protected readonly currentMember = signal<ProjectMember | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id');
    const resolvedProject = this.#route.snapshot.data['project'];
    const resolvedMembers = this.#route.snapshot.data['members'];
    const resolvedCurrentMember = this.#route.snapshot.data['currentMember'];

    if (id && resolvedProject) {
      this.projectId.set(id);
      this.project.set(resolvedProject);
      this.members.set(resolvedMembers ?? []);
      this.currentMember.set(resolvedCurrentMember ?? null);
    } else {
      this.#router.navigate(['/dashboard']);
    }
  }

  protected canManageMembers(): boolean {
    return this.#permissionsService.canManageMembers(this.currentMember());
  }

  protected canRemove(member: ProjectMember): boolean {
    return this.#permissionsService.canRemoveMember(
      this.currentMember(),
      member,
      this.project()?.createdBy,
    );
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
      }
    });
  }

  protected onRemoveMember(member: ProjectMember): void {
    if (!confirm(`Remove ${member.userName} from this project? This action cannot be undone.`)) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.#projectMembersService.removeMember(this.projectId(), member.userId).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.loadMembers();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to remove member');
      },
    });
  }

  protected getRoleLabel(role: ProjectRole): string {
    return role === ProjectRole.ADMIN ? 'projects.roles.admin' : 'projects.roles.user';
  }

  protected goBack(): void {
    this.#router.navigate(['/dashboard/projects', this.projectId()]);
  }

  private loadMembers(): void {
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
}
