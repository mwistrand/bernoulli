import { Body, Controller, Get, HttpCode, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ProjectService } from 'src/core/services/projects/project.service';
import { CreateProjectDto } from './dto/project.dto';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';

@Controller('projects')
export class ProjectController {
	constructor(@Inject(ProjectService) private readonly projectService: ProjectService) {}

	@Post('')
	@HttpCode(201)
	@UseGuards(AuthenticatedGuard)
	createProject(@Req() request: Request, @Body() dto: CreateProjectDto) {
		return this.projectService.createProject({
			...dto,
			userId: (request.user! as any).userId,
		});
	}

	@Get('')
	@UseGuards(AuthenticatedGuard)
	findAllProjects(@Req() request: Request) {
		const userId = (request.user! as any).userId;
		return this.projectService.findAllProjects(userId);
	}
}
