import {
	CreateTaskCommand,
	UpdateTaskCommand,
	DeleteTaskCommand,
} from '../../../../core/commands/task.command';
import { Task } from '../../../../core/models/projects/task.model';

export const TASK_PORT = 'TASK_PORT';

export interface TaskPort {
	createTask(id: string, command: CreateTaskCommand): Promise<Task>;
	findAllTasksByProjectId(projectId: string): Promise<Task[]>;
	findTaskById(taskId: string, projectId: string): Promise<Task | null>;
	updateTask(command: UpdateTaskCommand): Promise<Task>;
	deleteTask(command: DeleteTaskCommand): Promise<void>;
}
