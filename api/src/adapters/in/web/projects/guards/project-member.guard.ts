import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import {
	PROJECT_MEMBER_PORT,
	ProjectMemberPort,
} from '../../../../../core/ports/out/projects/project-member.port';
import { LoggerService } from '../../../../../common/logging/logger.service';

@Injectable()
export class ProjectMemberGuard implements CanActivate {
	constructor(
		@Inject(PROJECT_MEMBER_PORT)
		private readonly projectMemberPort: ProjectMemberPort,
		private readonly logger: LoggerService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		// Ensure user is authenticated
		if (!request.isAuthenticated()) {
			this.logger.warn('ProjectMemberGuard: User not authenticated');
			return false;
		}

		// Extract project ID from route parameters
		// Support both 'id' (for /projects/:id) and 'projectId' (for /projects/:projectId/tasks)
		// Prioritize 'projectId' as it's more specific
		const projectId = request.params.projectId || request.params.id;

		if (!projectId) {
			this.logger.warn('ProjectMemberGuard: No project ID found in route parameters');
			return false;
		}

		const userId = (request.user as any).id;

		// Check if user is a member of the project
		const member = await this.projectMemberPort.findByProjectAndUser(projectId, userId);

		if (!member) {
			this.logger.security('Unauthorized project access attempt', {
				userId,
				projectId,
				reason: 'User is not a member of the project',
			});
		}

		return !!member;
	}
}
