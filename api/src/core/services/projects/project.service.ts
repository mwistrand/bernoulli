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

@Injectable()
export class ProjectService {
	constructor(
		@Inject(PROJECT_PORT) private readonly projectPort: ProjectPort,
		@Inject(PROJECT_MEMBER_PORT)
		private readonly projectMemberPort: ProjectMemberPort,
		@Inject(AUTH_PORT) private readonly authPort: AuthPort,
	) {}

	async createProject(command: CreateProjectCommand) {
		if (!command.userId?.trim()) {
			throw new UnauthorizedException('User not authenticated');
		}

		// Verify user has ADMIN role
		const user = await this.authPort.findById(command.userId);
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Only admins can create projects');
		}

		const project = await this.projectPort.createProject(crypto.randomUUID(), command);

		// Automatically add creator as project ADMIN
		await this.projectMemberPort.create({
			projectId: project.id,
			userId: command.userId,
			role: ProjectRole.ADMIN,
		});

		return project;
	}

	async findById(id: string, userId: string) {
		const project = await this.projectPort.findById(id);
		if (!project) {
			throw new NotFoundException(`No project exists with ID ${id}`);
		}

		// Verify user is a member
		const member = await this.projectMemberPort.findByProjectAndUser(id, userId);
		if (!member) {
			throw new ForbiddenException('User is not a project member');
		}

		return project;
	}

	async findAllProjects(userId: string) {
		if (!userId?.trim()) {
			throw new UnauthorizedException('User not authenticated');
		}
		return this.projectPort.findAllProjectsByMembership(userId);
	}
}
