import { inject, Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TasksService, Task } from '../../tasks/services/tasks.service';

@Injectable({
  providedIn: 'root',
})
export class TasksResolver implements Resolve<Task[] | null> {
  readonly #tasksService = inject(TasksService);

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Task[] | null> {
    const projectId = route.paramMap.get('id');
    if (!projectId) return of([]);
    return this.#tasksService.fetchTasksByProjectId(projectId).pipe(catchError(() => of([])));
  }
}
