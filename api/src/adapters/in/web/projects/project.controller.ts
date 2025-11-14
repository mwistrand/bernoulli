import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import { CreateProjectCommand } from 'src/core/commands/project.command';
import { ProjectService } from 'src/core/services/projects/project.service';

@Controller('projects')
export class ProjectController {
	constructor(@Inject(ProjectService) private readonly projectService: ProjectService) {}

	@Post('')
	createProject(@Req() request: any, @Body() command: CreateProjectCommand) {
		console.log(request.session);
		return this.projectService.createProject(command);
	}
}
