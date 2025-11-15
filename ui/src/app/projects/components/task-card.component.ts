import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Task } from '../../tasks/services/tasks.service';

@Component({
  selector: 'bn-task-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
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
