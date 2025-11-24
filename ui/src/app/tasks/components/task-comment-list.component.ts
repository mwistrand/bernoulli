import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, EditIcon, TrashIcon } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TaskComment, TasksService } from '../services/tasks.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'bn-task-comment-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, LucideAngularModule, TranslateModule],
  templateUrl: './task-comment-list.component.html',
  styleUrl: './task-comment-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCommentListComponent {
  protected readonly EditIcon = EditIcon;
  protected readonly TrashIcon = TrashIcon;

  readonly #tasksService = inject(TasksService);
  readonly #authService = inject(AuthService);
  readonly #translate = inject(TranslateService);
  readonly #sanitizer = inject(DomSanitizer);

  readonly projectId = input.required<string>();
  readonly taskId = input.required<string>();

  readonly comments = computed(() => this.#tasksService.findCommentsByTaskId(this.taskId()));
  readonly currentUser = this.#authService.currentUser;

  readonly editingCommentId = signal<string | null>(null);
  readonly editingCommentText = signal<string>('');
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitting = signal<boolean>(false);

  constructor() {
    // Load comments when component initializes or taskId changes
    effect(() => {
      const taskId = this.taskId();
      const projectId = this.projectId();
      if (taskId && projectId) {
        this.#tasksService.fetchCommentsByTaskId(projectId, taskId).subscribe({
          error: (error: Error) => {
            this.errorMessage.set(
              this.#translate.instant('tasks.comments.errors.loadFailed') + ': ' + error.message,
            );
          },
        });
      }
    });
  }

  isEdited(comment: TaskComment): boolean {
    return new Date(comment.lastUpdatedAt).getTime() > new Date(comment.createdAt).getTime();
  }

  canEditOrDelete(comment: TaskComment): boolean {
    const user = this.currentUser();
    return user !== null && user.id === comment.createdBy;
  }

  renderMarkdown(markdown: string): SafeHtml {
    const html = marked.parse(markdown, { async: false }) as string;
    return this.#sanitizer.sanitize(1, html) || '';
  }

  startEdit(comment: TaskComment): void {
    this.editingCommentId.set(comment.id);
    this.editingCommentText.set(comment.comment);
    this.errorMessage.set(null);
  }

  cancelEdit(): void {
    this.editingCommentId.set(null);
    this.editingCommentText.set('');
    this.errorMessage.set(null);
  }

  submitEdit(commentId: string): void {
    const text = this.editingCommentText().trim();

    if (!text) {
      this.errorMessage.set(this.#translate.instant('tasks.comments.errors.commentRequired'));
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.#tasksService
      .updateTaskComment(this.projectId(), this.taskId(), commentId, { comment: text })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.editingCommentId.set(null);
          this.editingCommentText.set('');
        },
        error: (error: Error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            this.#translate.instant('tasks.comments.errors.updateFailed') + ': ' + error.message,
          );
        },
      });
  }

  deleteComment(comment: TaskComment): void {
    const confirmed = window.confirm(this.#translate.instant('tasks.comments.confirmDelete'));

    if (!confirmed) {
      return;
    }

    this.#tasksService.deleteTaskComment(this.projectId(), this.taskId(), comment.id).subscribe({
      error: (error: Error) => {
        this.errorMessage.set(
          this.#translate.instant('tasks.comments.errors.deleteFailed') + ': ' + error.message,
        );
      },
    });
  }
}
