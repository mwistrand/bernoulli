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
import {
	AddTaskCommentDto,
	CreateTaskDto,
	UpdateTaskDto,
	UpdateTaskCommentDto,
} from './dto/task.dto';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { TaskService } from '../../../../core/services/projects/task.service';
import { ProjectMemberGuard } from './guards/project-member.guard';

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
	@UseGuards(AuthenticatedGuard, ProjectMemberGuard)
	findProjectById(@Param('id') id: string, @Req() request: Request) {
		const userId = (request.user! as any).id as string;
		return this.projectService.findById(id, userId);
	}

	@Post(':id/tasks')
	@HttpCode(201)
	@UseGuards(AuthenticatedGuard, ProjectMemberGuard)
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
	@UseGuards(AuthenticatedGuard, ProjectMemberGuard)
	findAllTasksByProjectId(@Param('id') projectId: string, @Req() request: Request) {
		const userId = (request.user! as any).id as string;
		return this.taskService.findAllTasksByProjectId(projectId, userId);
	}

	@Get(':projectId/tasks/:taskId')
	@UseGuards(AuthenticatedGuard, ProjectMemberGuard)
	findTaskById(
		@Param('projectId') projectId: string,
		@Param('taskId') taskId: string,
		@Req() request: Request,
	) {
		const userId: string = (request.user! as any).id;
		return this.taskService.findTaskById(projectId, taskId, userId);
	}

	@Patch(':projectId/tasks/:taskId')
	@UseGuards(AuthenticatedGuard, ProjectMemberGuard)
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
	@UseGuards(AuthenticatedGuard, ProjectMemberGuard)
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

	@Post(':id/tasks/:taskId/comments')
	@HttpCode(201)
	@UseGuards(AuthenticatedGuard, ProjectMemberGuard)
	addTaskComment(
		@Param('taskId') taskId: string,
		@Req() request: Request,
		@Body() dto: AddTaskCommentDto,
	) {
		const userId = (request.user! as any).id;
		return this.taskService.addTaskComment({
			...dto,
			taskId,
			userId,
		});
	}

	@Get(':projectId/tasks/:taskId/comments')
	@UseGuards(AuthenticatedGuard, ProjectMemberGuard)
	findAllCommentsByTaskId(@Param('taskId') taskId: string, @Req() request: Request) {
		const userId = (request.user! as any).id;
		return this.taskService.findAllCommentsByTaskId(taskId, userId);
	}

	@Patch(':projectId/tasks/:taskId/comments/:commentId')
	@UseGuards(AuthenticatedGuard, ProjectMemberGuard)
	updateTaskComment(
		@Param('commentId') commentId: string,
		@Req() request: Request,
		@Body() dto: UpdateTaskCommentDto,
	) {
		const userId = (request.user! as any).id;
		return this.taskService.updateTaskComment({
			...dto,
			commentId,
			userId,
		});
	}

	@Delete(':projectId/tasks/:taskId/comments/:commentId')
	@HttpCode(204)
	@UseGuards(AuthenticatedGuard, ProjectMemberGuard)
	async deleteTaskComment(@Param('commentId') commentId: string, @Req() request: Request) {
		const userId = (request.user! as any).id;
		await this.taskService.deleteTaskComment(commentId, userId);
	}
}
