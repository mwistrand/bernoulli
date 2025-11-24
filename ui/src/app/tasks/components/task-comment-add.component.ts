import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronDownIcon, ChevronUpIcon } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TasksService } from '../services/tasks.service';

@Component({
  selector: 'bn-task-comment-add',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslateModule],
  templateUrl: './task-comment-add.component.html',
  styleUrl: './task-comment-add.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCommentAddComponent {
  protected readonly ChevronDownIcon = ChevronDownIcon;
  protected readonly ChevronUpIcon = ChevronUpIcon;

  readonly #tasksService = inject(TasksService);
  readonly #translate = inject(TranslateService);

  readonly projectId = input.required<string>();
  readonly taskId = input.required<string>();

  readonly isExpanded = signal<boolean>(false);
  readonly commentText = signal<string>('');
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitting = signal<boolean>(false);

  toggleExpanded(): void {
    this.isExpanded.update((expanded) => !expanded);
    if (!this.isExpanded()) {
      // Reset form when collapsing
      this.commentText.set('');
      this.errorMessage.set(null);
    }
  }

  submitComment(): void {
    const text = this.commentText().trim();

    if (!text) {
      this.errorMessage.set(this.#translate.instant('tasks.comments.errors.commentRequired'));
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.#tasksService
      .createTaskComment(this.projectId(), this.taskId(), { comment: text })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.commentText.set('');
          // Keep expanded after successful submission
        },
        error: (error: Error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            this.#translate.instant('tasks.comments.errors.createFailed') + ': ' + error.message,
          );
        },
      });
  }
}
