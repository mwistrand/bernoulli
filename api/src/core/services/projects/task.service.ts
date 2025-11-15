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
} from 'src/core/commands/task.command';
import { TASK_PORT, TaskPort } from 'src/core/ports/out/projects/task.port';

@Injectable()
export class TaskService {
	constructor(@Inject(TASK_PORT) private readonly taskPort: TaskPort) {}

	async createTask(command: CreateTaskCommand) {
		if (!command.userId?.trim()) {
			throw new UnauthorizedException('User not authenticated');
		}
		if (!command.projectId?.trim()) {
			throw new NotFoundException('Project not found');
		}
		return this.taskPort.createTask(crypto.randomUUID(), command);
	}

	async findAllTasksByProjectId(projectId: string) {
		if (!projectId?.trim()) {
			throw new NotFoundException('Project not found');
		}
		return this.taskPort.findAllTasksByProjectId(projectId);
	}

	async updateTask(command: UpdateTaskCommand) {
		if (!command.userId?.trim()) {
			throw new UnauthorizedException('User not authenticated');
		}
		if (!command.projectId?.trim()) {
			throw new NotFoundException('Project not found');
		}
		if (!command.taskId?.trim()) {
			throw new NotFoundException('Task not found');
		}

		// Verify task exists and belongs to the project
		const existingTask = await this.taskPort.findTaskById(command.taskId, command.projectId);
		if (!existingTask) {
			throw new NotFoundException('Task not found');
		}

		return this.taskPort.updateTask(command);
	}

	async deleteTask(command: DeleteTaskCommand) {
		if (!command.userId?.trim()) {
			throw new UnauthorizedException('User not authenticated');
		}
		if (!command.projectId?.trim()) {
			throw new NotFoundException('Project not found');
		}
		if (!command.taskId?.trim()) {
			throw new NotFoundException('Task not found');
		}

		// Verify task exists and belongs to the project
		const existingTask = await this.taskPort.findTaskById(command.taskId, command.projectId);
		if (!existingTask) {
			throw new NotFoundException('Task not found');
		}

		return this.taskPort.deleteTask(command);
	}
}
