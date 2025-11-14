import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateProjectCommand } from 'src/core/commands/project.command';
import { PROJECT_ADAPTER, ProjectPort } from 'src/core/ports/out/auth/project.port';

@Injectable()
export class ProjectService {
	constructor(@Inject(PROJECT_ADAPTER) private readonly projectPort: ProjectPort) {}

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
