import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateProjectCommand } from 'src/core/commands/project.command';
import { PROJECT_ADAPTER, ProjectPort } from 'src/core/ports/out/auth/project.port';

Injectable();
export class ProjectService {
	constructor(@Inject(PROJECT_ADAPTER) private readonly projectPort: ProjectPort) {}

	createProject(command: CreateProjectCommand) {
		if (!command.name?.trim()) {
			throw new BadRequestException('Project must have a valid name');
		}

		return this.projectPort.createProject(crypto.randomUUID(), command);
	}
}
