import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectEntity } from './entities/project.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { ProjectPort } from '../../../../core/ports/out/projects/project.port';
import { CreateProjectCommand } from '../../../../core/commands/project.command';
import { Project } from '../../../../core/models/projects/project.model';

@Injectable()
export class PostgreSQLProjectAdapter implements ProjectPort {
	constructor(
		@InjectRepository(ProjectEntity)
		private readonly projectRepository: Repository<ProjectEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
	) {}

	async createProject(id: string, command: CreateProjectCommand): Promise<Project> {
		const { name, description } = command;

		try {
			const createdAt = new Date();
			const user = await this.userRepository.findOne({ where: { id: command.userId } });
			if (!user) {
				throw new Error('Logic error: user not found');
			}
			const entity = this.projectRepository.create({
				id,
				name,
				description,
				createdBy: user,
				createdAt,
				lastUpdatedAt: createdAt,
				lastUpdatedBy: user,
			});
			await this.projectRepository.insert(entity);
			return entity.toProject();
		} catch (error: any) {
			// Check for unique constraint violation (Postgres error code '23505')
			if (error.code === '23505') {
				throw new ConflictException('Name already exists');
			}
			throw error;
		}
	}

	async findById(id: string): Promise<Project | undefined> {
		const entity = await this.projectRepository.findOne({
			where: { id },
			relations: ['createdBy', 'lastUpdatedBy'],
		});
		return entity?.toProject();
	}

	async findAllProjects(userId: string): Promise<Project[]> {
		const entities = await this.projectRepository.find({
			where: {
				createdBy: { id: userId },
			},
			relations: ['createdBy', 'lastUpdatedBy'],
			order: {
				createdAt: 'DESC',
			},
		});
		return entities.map(entity => entity.toProject());
	}
}
