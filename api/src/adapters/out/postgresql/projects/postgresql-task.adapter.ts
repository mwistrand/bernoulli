import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '../auth/entities/user.entity';
import { TaskPort } from '../../../../core/ports/out/projects/task.port';
import { TaskEntity } from './entity/task.entity';
import { CreateTaskCommand } from 'src/core/commands/task.command';
import { Task } from 'src/core/models/projects/task.model';

@Injectable()
export class PostgreSQLTaskAdapter implements TaskPort {
	constructor(
		@InjectRepository(TaskEntity)
		private readonly taskRepository: Repository<TaskEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
	) {}

	async createTask(id: string, command: CreateTaskCommand): Promise<Task> {
		const { title, description, summary, projectId, userId } = command;

		const createdAt = new Date();
		const user = await this.userRepository.findOne({ where: { id: userId } });
		if (!user) {
			throw new Error('Logic error: user not found');
		}
		const entity = this.taskRepository.create({
			id,
			projectId,
			title,
			description,
			summary,
			createdBy: user,
			createdAt,
			lastUpdatedAt: createdAt,
			lastUpdatedBy: user,
		});
		await this.taskRepository.insert(entity);
		return entity.toTask();
	}

	async findAllTasksByProjectId(projectId: string): Promise<Task[]> {
		const entities = await this.taskRepository.find({
			where: { projectId },
			relations: ['createdBy', 'lastUpdatedBy'],
			order: {
				createdAt: 'DESC',
			},
		});
		return entities.map(entity => entity.toTask());
	}
}
