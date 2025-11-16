import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule, CalendarIcon, EditIcon, Trash2Icon } from 'lucide-angular';
import { Task } from '../../tasks/services/tasks.service';

@Component({
  selector: 'bn-task-card',
  standalone: true,
  imports: [DatePipe, LucideAngularModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  protected readonly CalendarIcon = CalendarIcon;
  protected readonly EditIcon = EditIcon;
  protected readonly Trash2Icon = Trash2Icon;

  task = input.required<Task>();

  edit = output<Task>();
  delete = output<Task>();

  protected onEdit(): void {
    this.edit.emit(this.task());
  }

  protected onDelete(): void {
    this.delete.emit(this.task());
  }
}
