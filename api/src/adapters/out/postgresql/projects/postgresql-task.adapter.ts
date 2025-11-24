import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { UserEntity } from '../auth/entities/user.entity';
import { TaskPort } from '../../../../core/ports/out/projects/task.port';
import { TaskEntity } from './entities/task.entity';
import {
	CreateTaskCommand,
	UpdateTaskCommand,
	DeleteTaskCommand,
	AddTaskCommentCommand,
	UpdateTaskCommentCommand,
} from '../../../../core/commands/task.command';
import { Task, TaskComment } from '../../../../core/models/projects/task.model';
import { TaskCommentEntity } from './entities/task-comment.entity';

@Injectable()
export class PostgreSQLTaskAdapter implements TaskPort {
	constructor(
		@InjectRepository(TaskEntity)
		private readonly taskRepository: Repository<TaskEntity>,
		@InjectRepository(TaskCommentEntity)
		private readonly commentRepository: Repository<TaskCommentEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly dataSource: DataSource,
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

		// Use SERIALIZABLE transaction to ensure consistent deletion of task and all comments
		await this.dataSource.transaction('SERIALIZABLE', async transactionalEntityManager => {
			// First, delete all comments associated with this task
			await transactionalEntityManager.delete(TaskCommentEntity, { taskId });

			// Then, delete the task itself
			await transactionalEntityManager.delete(TaskEntity, { id: taskId, projectId });
		});
	}

	async addTaskComment(commentId: string, command: AddTaskCommentCommand): Promise<TaskComment> {
		const { comment, taskId, userId } = command;

		const createdAt = new Date();
		const user = await this.userRepository.findOne({ where: { id: userId } });
		if (!user) {
			throw new Error('Logic error: user not found');
		}
		const entity = this.commentRepository.create({
			id: commentId,
			taskId,
			comment,
			createdBy: user,
			createdAt,
			lastUpdatedAt: createdAt,
			lastUpdatedBy: user,
		});
		await this.commentRepository.insert(entity);
		return entity.toComment();
	}

	async updateTaskComment(command: UpdateTaskCommentCommand): Promise<TaskComment> {
		const user = await this.userRepository.findOne({ where: { id: command.userId } });
		if (!user) {
			throw new Error('Logic error: user not found');
		}

		const entity = await this.commentRepository.findOne({
			where: { id: command.commentId },
			relations: ['createdBy', 'lastUpdatedBy'],
		});
		if (entity == null) {
			throw new NotFoundException(`No such comment with ID ${command.commentId}`);
		}

		entity.comment = command.comment;
		entity.lastUpdatedBy = user;
		entity.lastUpdatedAt = new Date();
		await this.commentRepository.save(entity);

		return entity.toComment();
	}

	async findAllCommentsByTaskId(taskId: string): Promise<TaskComment[]> {
		const entities = await this.commentRepository.find({
			where: { taskId },
			relations: ['createdBy', 'lastUpdatedBy'],
			order: {
				createdAt: 'DESC',
			},
		});
		return entities.map(entity => entity.toComment());
	}

	async deleteAllCommentsByTaskId(taskId: string): Promise<void> {
		await this.commentRepository.delete({ taskId });
	}

	async deleteTaskComment(id: string): Promise<void> {
		await this.commentRepository.delete({ id });
	}
}
