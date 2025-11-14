import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'bn-dashboard-container',
  standalone: true,
  templateUrl: './dashboard-container.component.html',
  styleUrl: './dashboard-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardContainerComponent {}
