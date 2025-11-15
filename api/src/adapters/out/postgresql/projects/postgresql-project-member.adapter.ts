import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { ProjectMemberEntity } from './entities/project-member.entity';
import { ProjectMemberPort } from '../../../../core/ports/out/projects/project-member.port';
import {
	ProjectMember,
	ProjectMemberCreate,
} from '../../../../core/models/projects/project-member.model';

@Injectable()
export class PostgreSQLProjectMemberAdapter implements ProjectMemberPort {
	constructor(
		@InjectRepository(ProjectMemberEntity)
		private readonly projectMemberRepository: Repository<ProjectMemberEntity>,
	) {}

	async create(memberData: ProjectMemberCreate): Promise<ProjectMember> {
		try {
			const createdAt = new Date();
			const entity = this.projectMemberRepository.create({
				id: randomUUID(),
				...memberData,
				createdAt,
				lastUpdatedAt: createdAt,
			});
			await this.projectMemberRepository.save(entity);

			// Reload with relations to get user data
			const savedEntity = await this.projectMemberRepository.findOne({
				where: { id: entity.id },
				relations: ['user'],
			});

			if (!savedEntity) {
				throw new Error('Logic error: failed to reload project member');
			}

			return savedEntity.toProjectMember();
		} catch (error: any) {
			// Check for unique constraint violation (Postgres error code '23505')
			if (error.code === '23505') {
				throw new ConflictException('User is already a project member');
			}
			throw error;
		}
	}

	async findByProjectId(projectId: string): Promise<ProjectMember[]> {
		const entities = await this.projectMemberRepository.find({
			where: { projectId },
			relations: ['user'],
			order: { createdAt: 'ASC' },
		});
		return entities.map(e => e.toProjectMember());
	}

	async findByUserId(userId: string): Promise<ProjectMember[]> {
		const entities = await this.projectMemberRepository.find({
			where: { userId },
			relations: ['project', 'user'],
			order: { createdAt: 'DESC' },
		});
		return entities.map(e => e.toProjectMember());
	}

	async findByProjectAndUser(projectId: string, userId: string): Promise<ProjectMember | null> {
		const entity = await this.projectMemberRepository.findOne({
			where: { projectId, userId },
			relations: ['user'],
		});
		return entity ? entity.toProjectMember() : null;
	}

	async delete(id: string): Promise<void> {
		await this.projectMemberRepository.delete(id);
	}

	async deleteByProjectAndUser(projectId: string, userId: string): Promise<void> {
		await this.projectMemberRepository.delete({ projectId, userId });
	}
}
