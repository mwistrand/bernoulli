import {
	Inject,
	Injectable,
	NotFoundException,
	UnauthorizedException,
	BadRequestException,
} from '@nestjs/common';
import {
	CreateTaskCommand,
	UpdateTaskCommand,
	DeleteTaskCommand,
	AddTaskCommentCommand,
	UpdateTaskCommentCommand,
} from '../../commands/task.command';
import { TASK_PORT, TaskPort } from '../../ports/out/projects/task.port';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { TaskComment } from '../../models/projects/task.model';

@Injectable()
export class TaskService {
	constructor(
		@Inject(TASK_PORT) private readonly taskPort: TaskPort,
		private readonly i18n: I18nService,
	) {}

	async createTask(command: CreateTaskCommand) {
		if (!command.userId?.trim()) {
			throw new UnauthorizedException(
				this.i18n.t('auth.errors.user_not_authenticated', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
		if (!command.projectId?.trim()) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.not_found', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		return this.taskPort.createTask(crypto.randomUUID(), command);
	}

	async findAllTasksByProjectId(projectId: string, userId: string) {
		if (!projectId?.trim()) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.not_found', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		return this.taskPort.findAllTasksByProjectId(projectId);
	}

	async findTaskById(projectId?: string, taskId?: string, userId?: string) {
		if (!userId?.trim()) {
			throw new UnauthorizedException(
				this.i18n.t('auth.errors.user_not_authenticated', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
		if (!projectId?.trim()) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.not_found', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
		if (!taskId?.trim()) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.task_not_found', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		// Verify task exists and belongs to the project
		const existingTask = await this.taskPort.findTaskById(taskId, projectId);
		if (!existingTask) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.task_not_found', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		return existingTask;
	}

	async updateTask(command: UpdateTaskCommand) {
		// Verify task exists and belongs to the project
		await this.findTaskById(command.taskId, command.projectId, command.userId);
		return this.taskPort.updateTask(command);
	}

	async deleteTask(command: DeleteTaskCommand) {
		if (!command.userId?.trim()) {
			throw new UnauthorizedException(
				this.i18n.t('auth.errors.user_not_authenticated', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
		if (!command.projectId?.trim()) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.not_found', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
		if (!command.taskId?.trim()) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.task_not_found', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		// Verify task exists and belongs to the project
		const existingTask = await this.taskPort.findTaskById(command.taskId, command.projectId);
		if (!existingTask) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.task_not_found', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		return this.taskPort.deleteTask(command);
	}

	async addTaskComment(command: AddTaskCommentCommand): Promise<TaskComment> {
		if (command.userId.trim() === '') {
			throw new UnauthorizedException(
				this.i18n.t('auth.errors.user_not_authenticated', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
		if (command.comment.trim() === '') {
			throw new BadRequestException(
				this.i18n.t('projects.errors.comment_blank', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		return this.taskPort.addTaskComment(crypto.randomUUID(), command);
	}

	async updateTaskComment(command: UpdateTaskCommentCommand): Promise<TaskComment> {
		if (!command.userId?.trim()) {
			throw new UnauthorizedException(
				this.i18n.t('auth.errors.user_not_authenticated', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
		if (!command.commentId?.trim()) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.comment_not_found', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
		if (!command.comment?.trim()) {
			throw new BadRequestException(
				this.i18n.t('projects.errors.comment_blank', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		return this.taskPort.updateTaskComment(command);
	}

	async findAllCommentsByTaskId(taskId: string, userId: string): Promise<TaskComment[]> {
		if (!userId?.trim()) {
			throw new UnauthorizedException(
				this.i18n.t('auth.errors.user_not_authenticated', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
		if (!taskId?.trim()) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.task_not_found', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		return this.taskPort.findAllCommentsByTaskId(taskId);
	}

	async deleteTaskComment(commentId: string, userId: string): Promise<void> {
		if (!userId?.trim()) {
			throw new UnauthorizedException(
				this.i18n.t('auth.errors.user_not_authenticated', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
		if (!commentId?.trim()) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.comment_not_found', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		return this.taskPort.deleteTaskComment(commentId);
	}
}
