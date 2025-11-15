import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreateProjectCommand } from '../../commands/project.command';
import { PROJECT_PORT, ProjectPort } from '../../ports/out/projects/project.port';

@Injectable()
export class ProjectService {
	constructor(@Inject(PROJECT_PORT) private readonly projectPort: ProjectPort) {}

	async createProject(command: CreateProjectCommand) {
		if (!command.userId?.trim()) {
			throw new UnauthorizedException('User not authenticated');
		}

		return this.projectPort.createProject(crypto.randomUUID(), command);
	}

	async findById(id: string, userId: string) {
		const project = await this.projectPort.findById(id);
		if (!project) {
			throw new NotFoundException(`No project exists with ID ${id}`);
		}
		if (project.createdBy !== userId) {
			throw new ForbiddenException('User not authorized to perform this action');
		}
		return project;
	}

	async findAllProjects(userId: string) {
		if (!userId?.trim()) {
			throw new UnauthorizedException('User not authenticated');
		}
		return this.projectPort.findAllProjects(userId);
	}
}
