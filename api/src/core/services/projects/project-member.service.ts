import {
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ProjectMember, ProjectRole } from '../../models/projects/project-member.model';
import {
	PROJECT_MEMBER_PORT,
	ProjectMemberPort,
} from '../../ports/out/projects/project-member.port';
import { PROJECT_PORT, ProjectPort } from '../../ports/out/projects/project.port';

@Injectable()
export class ProjectMemberService {
	constructor(
		private readonly i18n: I18nService,
		@Inject(PROJECT_MEMBER_PORT)
		private readonly projectMemberPort: ProjectMemberPort,
		@Inject(PROJECT_PORT)
		private readonly projectPort: ProjectPort,
	) {}

	async addMember(
		projectId: string,
		userId: string,
		targetUserId: string,
		role: ProjectRole,
	): Promise<ProjectMember> {
		// Verify requesting user is project ADMIN
		await this.requireProjectAdmin(projectId, userId);

		// Check if user already a member
		const existing = await this.projectMemberPort.findByProjectAndUser(projectId, targetUserId);
		if (existing) {
			throw new ConflictException(
				this.i18n.t('projects.errors.already_member', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		return this.projectMemberPort.create({
			projectId,
			userId: targetUserId,
			role,
		});
	}

	async removeMember(projectId: string, userId: string, targetUserId: string): Promise<void> {
		// Verify requesting user is project ADMIN
		await this.requireProjectAdmin(projectId, userId);

		// Can't remove the project creator
		const project = await this.projectPort.findById(projectId);
		if (!project) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.not_found_with_id', {
					lang: I18nContext.current()?.lang,
					args: { id: projectId },
				}),
			);
		}
		if (project.createdBy === targetUserId) {
			throw new ForbiddenException(
				this.i18n.t('projects.errors.cannot_remove_creator', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		await this.projectMemberPort.deleteByProjectAndUser(projectId, targetUserId);
	}

	async getProjectMembers(projectId: string, userId: string): Promise<ProjectMember[]> {
		// Verify user is project member
		await this.requireProjectMember(projectId, userId);

		return this.projectMemberPort.findByProjectId(projectId);
	}

	async updateMemberRole(
		projectId: string,
		userId: string,
		targetUserId: string,
		newRole: ProjectRole,
	): Promise<ProjectMember> {
		// Verify requesting user is project ADMIN
		await this.requireProjectAdmin(projectId, userId);

		// Can't change project creator's role
		const project = await this.projectPort.findById(projectId);
		if (!project) {
			throw new NotFoundException(
				this.i18n.t('projects.errors.not_found_with_id', {
					lang: I18nContext.current()?.lang,
					args: { id: projectId },
				}),
			);
		}
		if (project.createdBy === targetUserId) {
			throw new ForbiddenException(
				this.i18n.t('projects.errors.cannot_change_creator_role', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		const member = await this.projectMemberPort.findByProjectAndUser(projectId, targetUserId);
		if (!member) {
			throw new ForbiddenException(
				this.i18n.t('projects.errors.not_a_member', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		// Delete and recreate with new role
		await this.projectMemberPort.delete(member.id);
		return this.projectMemberPort.create({
			projectId,
			userId: targetUserId,
			role: newRole,
		});
	}

	// Helper methods
	async requireProjectMember(projectId: string, userId: string): Promise<ProjectMember> {
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

	async requireProjectAdmin(projectId: string, userId: string): Promise<ProjectMember> {
		const member = await this.requireProjectMember(projectId, userId);
		if (member.role !== ProjectRole.ADMIN) {
			throw new ForbiddenException(
				this.i18n.t('projects.errors.must_be_admin', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
		return member;
	}
}
