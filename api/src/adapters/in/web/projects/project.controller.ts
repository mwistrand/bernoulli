import { Body, Controller, HttpCode, Inject, Post, Req } from '@nestjs/common';
import { CreateProjectCommand } from 'src/core/commands/project.command';
import { ProjectService } from 'src/core/services/projects/project.service';

@Controller('projects')
export class ProjectController {
	constructor(@Inject(ProjectService) private readonly projectService: ProjectService) {}

	@Post('')
	@HttpCode(201)
	createProject(@Body() command: CreateProjectCommand) {
		return this.projectService.createProject(command);
	}
}
