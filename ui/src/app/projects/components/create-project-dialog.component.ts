import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { LucideAngularModule, XIcon } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProjectsService } from '../services/projects.service';

@Component({
  selector: 'bn-create-project-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, A11yModule, LucideAngularModule, TranslateModule],
  templateUrl: './create-project-dialog.component.html',
  styleUrl: './create-project-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectDialogComponent {
  protected readonly XIcon = XIcon;

  readonly #projectsService = inject(ProjectsService);

  isOpen = input<boolean>(false);
  dialogClosed = output<void>();
  projectCreated = output<void>();

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly projectForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    description: new FormControl('', [Validators.maxLength(500)]),
  });

  onSubmit(): void {
    if (this.projectForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { name, description } = this.projectForm.value;

    this.#projectsService
      .createProject({
        name: name!,
        description: description || undefined,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.projectForm.reset();
          this.projectCreated.emit();
          this.closeDialog();
        },
        error: (error: Error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.message);
        },
      });
  }

  closeDialog(): void {
    this.projectForm.reset();
    this.errorMessage.set(null);
    this.dialogClosed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Close dialog when clicking on the backdrop (not the dialog content)
    if (event.target === event.currentTarget) {
      this.closeDialog();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Close dialog on Escape key
    if (event.key === 'Escape') {
      this.closeDialog();
    }
  }
}
