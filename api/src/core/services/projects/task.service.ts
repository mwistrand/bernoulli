import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateTaskCommand } from 'src/core/commands/task.command';
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
}
