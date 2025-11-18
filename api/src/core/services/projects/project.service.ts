import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreateProjectCommand } from '../../commands/project.command';
import { PROJECT_PORT, ProjectPort } from '../../ports/out/projects/project.port';
import {
	PROJECT_MEMBER_PORT,
	ProjectMemberPort,
} from '../../ports/out/projects/project-member.port';
import { AUTH_PORT, AuthPort } from '../../ports/out/auth/auth.port';
import { UserRole } from '../../models/auth/user.model';
import { ProjectRole } from '../../models/projects/project-member.model';
import { LoggerService } from '../../../common/logging/logger.service';
import { TracingService } from '../../../common/tracing/tracing.service';
import { MetricsService } from '../../../common/metrics/metrics.service';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class ProjectService {
	constructor(
		@Inject(PROJECT_PORT) private readonly projectPort: ProjectPort,
		@Inject(PROJECT_MEMBER_PORT)
		private readonly projectMemberPort: ProjectMemberPort,
		@Inject(AUTH_PORT) private readonly authPort: AuthPort,
		private readonly logger: LoggerService,
		private readonly tracing: TracingService,
		private readonly metrics: MetricsService,
		private readonly i18n: I18nService,
	) {}

	async createProject(command: CreateProjectCommand) {
		return this.tracing.traceOperation('project.service.createProject', async span => {
			if (!command.userId?.trim()) {
				throw new UnauthorizedException(
					this.i18n.t('auth.errors.user_not_authenticated', {
						lang: I18nContext.current()?.lang,
					}),
				);
			}

			span.setAttribute('user.id', command.userId);
			span.setAttribute('project.name', command.name);

			// Verify user has ADMIN role
			const user = await this.authPort.findById(command.userId);
			if (user.role !== UserRole.ADMIN) {
				this.logger.security('Project creation denied: user not admin', {
					userId: command.userId,
					userRole: user.role,
				});
				this.metrics.trackAuthorizationFailure(
					'project.create',
					command.userId,
					'not_admin',
				);
				throw new ForbiddenException(
					this.i18n.t('projects.errors.create_projects_admin', {
						lang: I18nContext.current()?.lang,
					}),
				);
			}

			try {
				const startTime = Date.now();
				const project = await this.projectPort.createProject(crypto.randomUUID(), command);

				// Automatically add creator as project ADMIN
				await this.projectMemberPort.create({
					projectId: project.id,
					userId: command.userId,
					role: ProjectRole.ADMIN,
				});

				const duration = Date.now() - startTime;

				this.logger.info('Project created successfully', {
					projectId: project.id,
					projectName: project.name,
					userId: command.userId,
				});

				this.metrics.trackBusinessOperation('project.create', true, duration);
				span.setAttribute('project.id', project.id);

				return project;
			} catch (error) {
				this.logger.error('Project creation failed', error as Error, {
					userId: command.userId,
					projectName: command.name,
				});
				this.metrics.trackBusinessOperation('project.create', false);
				throw error;
			}
		});
	}

	async findById(id: string, userId: string) {
		return this.tracing.traceOperation('project.service.findById', async span => {
			span.setAttribute('project.id', id);
			span.setAttribute('user.id', userId);

			const project = await this.projectPort.findById(id);
			if (!project) {
				this.logger.warn('Project not found', { projectId: id, userId });
				throw new NotFoundException(
					this.i18n.t('projects.errors.not_found_with_id', {
						lang: I18nContext.current()?.lang,
						args: { id },
					}),
				);
			}

			// Verify user is a member
			const member = await this.projectMemberPort.findByProjectAndUser(id, userId);
			if (!member) {
				this.logger.security('Project access denied: user not a member', {
					projectId: id,
					userId,
				});
				this.metrics.trackAuthorizationFailure('project.view', userId, 'not_member');
				throw new ForbiddenException(
					this.i18n.t('projects.errors.not_a_member', {
						lang: I18nContext.current()?.lang,
					}),
				);
			}

			this.logger.debug('Project retrieved successfully', { projectId: id, userId });
			return project;
		});
	}

	async findAllProjects(userId: string) {
		return this.tracing.traceOperation('project.service.findAllProjects', async span => {
			if (!userId?.trim()) {
				throw new UnauthorizedException(
					this.i18n.t('auth.errors.user_not_authenticated', {
						lang: I18nContext.current()?.lang,
					}),
				);
			}

			span.setAttribute('user.id', userId);

			const startTime = Date.now();
			const projects = await this.projectPort.findAllProjectsByMembership(userId);
			const duration = Date.now() - startTime;

			this.logger.debug('Projects retrieved successfully', {
				userId,
				projectCount: projects.length,
			});

			this.metrics.trackBusinessOperation('project.findAll', true, duration);
			span.setAttribute('project.count', projects.length);

			return projects;
		});
	}
}
