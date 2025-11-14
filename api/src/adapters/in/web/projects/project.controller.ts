import {
	Body,
	Controller,
	Get,
	HttpCode,
	Inject,
	Param,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectService } from 'src/core/services/projects/project.service';
import { CreateProjectDto } from './dto/project.dto';
import { CreateTaskDto } from './dto/task.dto';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { TaskService } from 'src/core/services/projects/task.service';

@Controller('projects')
export class ProjectController {
	constructor(
		@Inject(ProjectService) private readonly projectService: ProjectService,
		@Inject(TaskService) private readonly taskService: TaskService,
	) {}

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

	@Post(':id/tasks')
	@HttpCode(201)
	@UseGuards(AuthenticatedGuard)
	createTask(
		@Param('id') projectId: string,
		@Req() request: Request,
		@Body() dto: CreateTaskDto,
	) {
		const userId = (request.user! as any).userId;
		return this.taskService.createTask({
			...dto,
			projectId,
			userId,
		});
	}

	@Get(':id/tasks')
	@UseGuards(AuthenticatedGuard)
	findAllTasksByProjectId(@Param('id') projectId: string) {
		return this.taskService.findAllTasksByProjectId(projectId);
	}
}
