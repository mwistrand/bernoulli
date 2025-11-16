import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, PlusIcon, TrashIcon } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UsersService, CreateUserDto } from '../auth/services/users.service';
import { User, UserRole } from '../auth/services/auth.service';

@Component({
  standalone: true,
  selector: 'bn-admin',
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslateModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent implements OnInit {
  protected readonly PlusIcon = PlusIcon;
  protected readonly TrashIcon = TrashIcon;
  protected readonly UserRole = UserRole;

  readonly #usersService = inject(UsersService);
  readonly #fb = inject(FormBuilder);
  readonly #translate = inject(TranslateService);

  protected users = signal<User[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected showCreateDialog = signal(false);
  protected creating = signal(false);

  protected createUserForm = this.#fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['USER' as 'ADMIN' | 'USER', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.#usersService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.#translate.instant('admin.errors.loadFailed'));
        this.loading.set(false);
      },
    });
  }

  protected openCreateDialog(): void {
    this.showCreateDialog.set(true);
    this.createUserForm.reset({ role: 'USER' });
  }

  protected closeCreateDialog(): void {
    this.showCreateDialog.set(false);
    this.createUserForm.reset({ role: 'USER' });
  }

  protected onCreateUser(): void {
    if (this.createUserForm.invalid) {
      return;
    }

    this.creating.set(true);
    const userData = this.createUserForm.value as CreateUserDto;

    this.#usersService.createUser(userData).subscribe({
      next: () => {
        this.creating.set(false);
        this.closeCreateDialog();
        this.loadUsers();
      },
      error: () => {
        this.creating.set(false);
        this.error.set(this.#translate.instant('admin.errors.createFailed'));
      },
    });
  }

  protected onDeleteUser(user: User): void {
    const confirmMessage = this.#translate.instant('admin.confirmDelete', { name: user.name });
    if (!confirm(confirmMessage)) {
      return;
    }

    this.#usersService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: () => {
        this.error.set(this.#translate.instant('admin.errors.deleteFailed'));
      },
    });
  }
}
