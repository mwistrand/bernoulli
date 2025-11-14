import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateProjectCommand } from '../../commands/project.command';
import { PROJECT_PORT, ProjectPort } from '../../ports/out/projects/project.port';

@Injectable()
export class ProjectService {
	constructor(@Inject(PROJECT_PORT) private readonly projectPort: ProjectPort) {}

	createProject(command: CreateProjectCommand) {
		if (!command.userId?.trim()) {
			throw new UnauthorizedException('User not authenticated');
		}

		return this.projectPort.createProject(crypto.randomUUID(), command);
	}

	findAllProjects(userId: string) {
		if (!userId?.trim()) {
			throw new UnauthorizedException('User not authenticated');
		}
		return this.projectPort.findAllProjects(userId);
	}
}
