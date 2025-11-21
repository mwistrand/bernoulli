import {
	Inject,
	Injectable,
	NotFoundException,
	UnauthorizedException,
	ForbiddenException,
} from '@nestjs/common';
import {
	CreateTaskCommand,
	UpdateTaskCommand,
	DeleteTaskCommand,
} from '../../commands/task.command';
import { TASK_PORT, TaskPort } from '../../ports/out/projects/task.port';
import {
	PROJECT_MEMBER_PORT,
	ProjectMemberPort,
} from '../../ports/out/projects/project-member.port';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class TaskService {
	constructor(
		@Inject(TASK_PORT) private readonly taskPort: TaskPort,
		@Inject(PROJECT_MEMBER_PORT)
		private readonly projectMemberPort: ProjectMemberPort,
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

		// Verify user is project member
		await this.requireProjectMember(command.projectId, command.userId);

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

		// Verify user is project member
		await this.requireProjectMember(projectId, userId);

		return this.taskPort.findAllTasksByProjectId(projectId);
	}

	async updateTask(command: UpdateTaskCommand) {
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

		// Verify user is project member
		await this.requireProjectMember(command.projectId, command.userId);

		// Verify task exists and belongs to the project
		const existingTask = await this.taskPort.findTaskById(command.taskId, command.projectId);
		if (!existingTask) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.task_not_found', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

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

		// Verify user is project member
		await this.requireProjectMember(command.projectId, command.userId);

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

	private async requireProjectMember(projectId: string, userId: string) {
		const member = await this.projectMemberPort.findByProjectAndUser(projectId, userId);
		if (!member) {
			throw new ForbiddenException(
				this.i18n.t('projects.errors.not_a_member', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
		return member;
	}
}
