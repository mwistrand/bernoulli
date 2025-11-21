import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '../auth/entities/user.entity';
import { TaskPort } from '../../../../core/ports/out/projects/task.port';
import { TaskEntity } from './entities/task.entity';
import {
	CreateTaskCommand,
	UpdateTaskCommand,
	DeleteTaskCommand,
} from '../../../../core/commands/task.command';
import { Task } from '../../../../core/models/projects/task.model';

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

	async findTaskById(taskId: string, projectId: string): Promise<Task | null> {
		const entity = await this.taskRepository.findOne({
			where: { id: taskId, projectId },
			relations: ['createdBy', 'lastUpdatedBy'],
		});
		return entity ? entity.toTask() : null;
	}

	async updateTask(command: UpdateTaskCommand): Promise<Task> {
		const { taskId, projectId, userId, title, description, summary } = command;

		const [user, entity] = await Promise.all([
			this.userRepository.findOne({ where: { id: userId } }),
			this.taskRepository.findOne({
				where: { id: taskId, projectId },
				relations: ['createdBy', 'lastUpdatedBy'],
			}),
		]);

		if (!user) {
			throw new Error('Logic error: user not found');
		}
		if (!entity) {
			throw new Error('Logic error: task not found');
		}

		// Only update fields that are explicitly provided (not undefined)
		if (title !== undefined) {
			entity.title = title;
		}
		if (description !== undefined) {
			entity.description = description;
		}
		if (summary !== undefined) {
			entity.summary = summary ?? null;
		}

		entity.lastUpdatedAt = new Date();
		entity.lastUpdatedBy = user;

		await this.taskRepository.save(entity);
		return entity.toTask();
	}

	async deleteTask(command: DeleteTaskCommand): Promise<void> {
		const { taskId, projectId } = command;
		await this.taskRepository.delete({ id: taskId, projectId });
	}
}
