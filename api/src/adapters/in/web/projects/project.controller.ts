import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Inject,
	Param,
	Patch,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectService } from '../../../../core/services/projects/project.service';
import { CreateProjectDto } from './dto/project.dto';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { TaskService } from '../../../../core/services/projects/task.service';

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
			userId: (request.user! as any).id,
		});
	}

	@Get('')
	@UseGuards(AuthenticatedGuard)
	findAllProjects(@Req() request: Request) {
		const userId = (request.user! as any).id as string;
		return this.projectService.findAllProjects(userId);
	}

	@Get(':id')
	@UseGuards(AuthenticatedGuard)
	findProjectById(@Param('id') id: string, @Req() request: Request) {
		const userId = (request.user! as any).id as string;
		return this.projectService.findById(id, userId);
	}

	@Post(':id/tasks')
	@HttpCode(201)
	@UseGuards(AuthenticatedGuard)
	createTask(
		@Param('id') projectId: string,
		@Req() request: Request,
		@Body() dto: CreateTaskDto,
	) {
		const userId = (request.user! as any).id;
		return this.taskService.createTask({
			...dto,
			projectId,
			userId,
		});
	}

	@Get(':id/tasks')
	@UseGuards(AuthenticatedGuard)
	findAllTasksByProjectId(@Param('id') projectId: string, @Req() request: Request) {
		const userId = (request.user! as any).id as string;
		return this.taskService.findAllTasksByProjectId(projectId, userId);
	}

	@Get(':projectId/tasks/:taskId')
	@UseGuards(AuthenticatedGuard)
	getTaskById(
		@Param('projectId') projectId: string,
		@Param('taskId') taskId: string,
		@Req() request: Request,
	) {
		const userId: string = (request.user! as any).id;
		return this.taskService.getTaskById(projectId, taskId, userId);
	}

	@Patch(':projectId/tasks/:taskId')
	@UseGuards(AuthenticatedGuard)
	updateTask(
		@Param('projectId') projectId: string,
		@Param('taskId') taskId: string,
		@Req() request: Request,
		@Body() dto: UpdateTaskDto,
	) {
		const userId: string = (request.user! as any).id;
		return this.taskService.updateTask({
			...dto,
			projectId,
			taskId,
			userId,
		});
	}

	@Delete(':projectId/tasks/:taskId')
	@HttpCode(204)
	@UseGuards(AuthenticatedGuard)
	async deleteTask(
		@Param('projectId') projectId: string,
		@Param('taskId') taskId: string,
		@Req() request: Request,
	) {
		const userId = (request.user! as any).id;
		await this.taskService.deleteTask({
			projectId,
			taskId,
			userId,
		});
	}
}
