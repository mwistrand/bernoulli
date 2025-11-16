import { Component, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ProjectMembersService,
  ProjectRole,
  AddMemberDto,
  ProjectMember,
} from '../services/project-members.service';
import { UsersService } from '../../auth/services/users.service';
import { User } from '../../auth/services/auth.service';

export interface AddMemberDialogData {
  projectId: string;
  existingMemberIds: string[];
}

@Component({
  standalone: true,
  selector: 'bn-add-member-dialog',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './add-member-dialog.component.html',
  styleUrl: './add-member-dialog.component.scss',
})
export class AddMemberDialogComponent {
  readonly #dialogRef = inject(DialogRef<ProjectMember | null>);
  readonly #projectMembersService = inject(ProjectMembersService);
  readonly #usersService = inject(UsersService);
  readonly #data: AddMemberDialogData = inject(DIALOG_DATA);
  readonly #translate = inject(TranslateService);

  protected readonly ProjectRole = ProjectRole;
  protected readonly isLoadingUsers = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly submitError = signal<string | null>(null);
  protected readonly availableUsers = signal<User[]>([]);

  protected readonly addMemberForm = new FormGroup({
    userId: new FormControl('', [Validators.required]),
    role: new FormControl<ProjectRole>(ProjectRole.USER, [Validators.required]),
  });

  constructor() {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoadingUsers.set(true);
    this.errorMessage.set(null);

    this.#usersService.getAllUsers().subscribe({
      next: (users) => {
        const available = users.filter((user) => !this.#data.existingMemberIds.includes(user.id));
        this.availableUsers.set(available);
        this.isLoadingUsers.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          error.error?.message ||
            this.#translate.instant('projects.addMember.errors.loadUsersFailed'),
        );
        this.isLoadingUsers.set(false);
      },
    });
  }

  protected onSubmit(): void {
    if (this.addMemberForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const dto: AddMemberDto = {
      userId: this.addMemberForm.value.userId!,
      role: this.addMemberForm.value.role!,
    };

    this.#projectMembersService.addMember(this.#data.projectId, dto).subscribe({
      next: (member) => {
        this.#dialogRef.close(member);
      },
      error: (error) => {
        this.submitError.set(
          error.error?.message || this.#translate.instant('projects.addMember.errors.addFailed'),
        );
        this.isSubmitting.set(false);
      },
    });
  }

  protected onCancel(): void {
    this.#dialogRef.close(null);
  }
}
