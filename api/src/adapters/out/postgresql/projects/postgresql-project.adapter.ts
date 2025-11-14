import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectEntity } from './entity/project.entity';
import { ProjectPort } from '../../../../core/ports/out/auth/project.port';
import { CreateProjectCommand } from '../../../../core/commands/project.command';
import { Project } from '../../../../core/models/projects/project.model';

@Injectable()
export class PostgreSQLProjectAdapter implements ProjectPort {
	constructor(
		@InjectRepository(ProjectEntity)
		private readonly projectRepository: Repository<ProjectEntity>,
	) {}

	async createProject(id: string, command: CreateProjectCommand): Promise<Project> {
		const { name, description } = command;

		try {
			const createdAt = new Date();
			const entity = this.projectRepository.create({
				id,
				name,
				description,
				createdAt,
				lastUpdatedAt: createdAt,
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
}
