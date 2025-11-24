import {
	CreateTaskCommand,
	UpdateTaskCommand,
	DeleteTaskCommand,
	AddTaskCommentCommand,
	UpdateTaskCommentCommand,
} from '../../../../core/commands/task.command';
import { Task, TaskComment } from '../../../../core/models/projects/task.model';

export const TASK_PORT = 'TASK_PORT';

export interface TaskPort {
	createTask(id: string, command: CreateTaskCommand): Promise<Task>;
	findAllTasksByProjectId(projectId: string): Promise<Task[]>;
	findTaskById(taskId: string, projectId: string): Promise<Task | null>;
	updateTask(command: UpdateTaskCommand): Promise<Task>;
	deleteTask(command: DeleteTaskCommand): Promise<void>;

	addTaskComment(id: string, command: AddTaskCommentCommand): Promise<TaskComment>;
	updateTaskComment(command: UpdateTaskCommentCommand): Promise<TaskComment>;
	findAllCommentsByTaskId(taskId: string): Promise<TaskComment[]>;
	deleteAllCommentsByTaskId(taskId: string): Promise<void>;
	deleteTaskComment(id: string): Promise<void>;
}
