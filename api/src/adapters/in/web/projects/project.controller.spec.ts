import { Test, TestingModule } from '@nestjs/testing';
import {
	INestApplication,
	BadRequestException,
	NotFoundException,
	ValidationPipe,
	ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';

import { ProjectController } from './project.controller';
import { ProjectService } from '../../../../core/services/projects/project.service';
import type { Project } from '../../../../core/models/projects/project.model';
import { TaskService } from '../../../../core/services/projects/task.service';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { Task, TaskComment } from '../../../../core/models/projects/task.model';
import { ProjectMemberGuard } from './guards/project-member.guard';

describe(ProjectController.name, () => {
	let app: INestApplication;
	let projectService: jest.Mocked<ProjectService>;
	let taskService: jest.Mocked<TaskService>;

	const mockProject: Project = {
		id: 'project-123',
		name: 'Test Project',
		createdAt: new Date(),
		lastUpdatedAt: new Date(),
		lastUpdatedBy: 'user-123',
		createdBy: 'user-123',
	};

	const mockTask: Task = {
		id: 'task-123',
		projectId: 'project-123',
		title: 'Test Task',
		description: 'Test Description',
		createdAt: new Date(),
		lastUpdatedAt: new Date(),
		lastUpdatedBy: 'user-123',
		createdBy: 'user-123',
	};

	const mockUser = {
		id: 'user-123',
		email: 'test@example.com',
	};

	beforeEach(async () => {
		const mockProjectService = {
			createProject: jest.fn(),
			findAllProjects: jest.fn(),
		};
		const mockTaskService = {
			createTask: jest.fn(),
			findAllTasks: jest.fn(),
			findAllTasksByProjectId: jest.fn(),
			updateTask: jest.fn(),
			deleteTask: jest.fn(),
			addTaskComment: jest.fn(),
			findAllCommentsByTaskId: jest.fn(),
			updateTaskComment: jest.fn(),
			deleteTaskComment: jest.fn(),
		};

		const mockAuthGuard = {
			canActivate: jest.fn((context: ExecutionContext) => {
				const request = context.switchToHttp().getRequest();
				request.user = mockUser;
				return true;
			}),
		};

		const mockProjectMemberGuard = {
			canActivate: jest.fn(() => true),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [ProjectController],
			providers: [
				{
					provide: ProjectService,
					useValue: mockProjectService,
				},
				{
					provide: TaskService,
					useValue: mockTaskService,
				},
			],
		})
			.overrideGuard(AuthenticatedGuard)
			.useValue(mockAuthGuard)
			.overrideGuard(ProjectMemberGuard)
			.useValue(mockProjectMemberGuard)
			.compile();

		app = module.createNestApplication();
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true,
			}),
		);
		await app.init();

		projectService = module.get(ProjectService);
		taskService = module.get(TaskService);
	});

	afterEach(async () => {
		await app.close();
	});

	describe('POST /projects', () => {
		it('should create a project successfully', async () => {
			projectService.createProject.mockResolvedValue(mockProject);

			const response = await request(app.getHttpServer())
				.post('/projects')
				.send({ name: 'My Project' })
				.expect(201);

			expect(response.body).toEqual(JSON.parse(JSON.stringify(mockProject)));
			expect(projectService.createProject).toHaveBeenCalledWith({
				name: 'My Project',
				userId: 'user-123',
			});
		});

		it('should propagate validation errors from ProjectService', async () => {
			const error = new BadRequestException('Project must have a valid name');
			projectService.createProject.mockRejectedValue(error);

			const response = await request(app.getHttpServer())
				.post('/projects')
				.send({ name: 'My Project' })
				.expect(400);

			expect(response.body).toHaveProperty('message', 'Project must have a valid name');
		});

		it('should validate project name is required', async () => {
			const response = await request(app.getHttpServer())
				.post('/projects')
				.send({ name: '' })
				.expect(400);

			expect(response.body.message).toContain('Project name is required');
		});

		it('should validate project name max length', async () => {
			const response = await request(app.getHttpServer())
				.post('/projects')
				.send({ name: 'A'.repeat(101) })
				.expect(400);

			expect(response.body.message).toContain('Project name must not exceed 100 characters');
		});
	});

	describe('GET /projects', () => {
		it('should return all projects for the authenticated user', async () => {
			const mockProjects = [mockProject, { ...mockProject, id: 'project-456' }];
			projectService.findAllProjects.mockResolvedValue(mockProjects);

			const response = await request(app.getHttpServer()).get('/projects').expect(200);

			expect(response.body).toEqual(JSON.parse(JSON.stringify(mockProjects)));
			expect(projectService.findAllProjects).toHaveBeenCalledWith('user-123');
		});

		it('should return empty array when no projects exist', async () => {
			projectService.findAllProjects.mockResolvedValue([]);

			const response = await request(app.getHttpServer()).get('/projects').expect(200);

			expect(response.body).toEqual([]);
		});
	});

	describe('POST /projects/:id/tasks', () => {
		const validTaskDto = {
			title: 'New Task',
			description: 'Task description',
		};

		it('should create a task successfully', async () => {
			taskService.createTask.mockResolvedValue(mockTask);

			const response = await request(app.getHttpServer())
				.post('/projects/project-123/tasks')
				.send(validTaskDto)
				.expect(201);

			expect(response.body).toEqual(JSON.parse(JSON.stringify(mockTask)));
			expect(taskService.createTask).toHaveBeenCalledWith({
				...validTaskDto,
				projectId: 'project-123',
				userId: 'user-123',
			});
		});

		it('should validate task title is required', async () => {
			await request(app.getHttpServer())
				.post('/projects/project-123/tasks')
				.send({ ...validTaskDto, title: '' })
				.expect(400);
		});

		it('should propagate errors from TaskService', async () => {
			taskService.createTask.mockRejectedValue(new BadRequestException('Invalid task'));

			await request(app.getHttpServer())
				.post('/projects/project-123/tasks')
				.send(validTaskDto)
				.expect(400);
		});
	});

	describe('GET /projects/:id/tasks', () => {
		it('should return all tasks for a project', async () => {
			const mockTasks = [mockTask, { ...mockTask, id: 'task-456' }];
			taskService.findAllTasksByProjectId.mockResolvedValue(mockTasks);

			const response = await request(app.getHttpServer())
				.get('/projects/project-123/tasks')
				.expect(200);

			expect(response.body).toEqual(JSON.parse(JSON.stringify(mockTasks)));
			expect(taskService.findAllTasksByProjectId).toHaveBeenCalledWith(
				'project-123',
				'user-123',
			);
		});
	});

	describe('PATCH /projects/:projectId/tasks/:taskId', () => {
		const updateDto = {
			title: 'Updated Task',
			description: 'Updated Description',
		};

		it('should update a task successfully', async () => {
			const updatedTask = { ...mockTask, ...updateDto };
			taskService.updateTask.mockResolvedValue(updatedTask);

			const response = await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-123')
				.send(updateDto)
				.expect(200);

			expect(response.body).toEqual(JSON.parse(JSON.stringify(updatedTask)));
			expect(taskService.updateTask).toHaveBeenCalledWith({
				...updateDto,
				taskId: 'task-123',
				projectId: 'project-123',
				userId: 'user-123',
			});
		});

		it('should propagate errors from TaskService', async () => {
			taskService.updateTask.mockRejectedValue(new BadRequestException('Task not found'));

			await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-123')
				.send(updateDto)
				.expect(400);
		});
	});

	describe('DELETE /projects/:projectId/tasks/:taskId', () => {
		it('should delete a task successfully', async () => {
			taskService.deleteTask.mockResolvedValue(undefined);

			await request(app.getHttpServer())
				.delete('/projects/project-123/tasks/task-123')
				.expect(204);

			expect(taskService.deleteTask).toHaveBeenCalledWith({
				taskId: 'task-123',
				projectId: 'project-123',
				userId: 'user-123',
			});
		});

		it('should propagate errors from TaskService', async () => {
			taskService.deleteTask.mockRejectedValue(new BadRequestException('Task not found'));

			await request(app.getHttpServer())
				.delete('/projects/project-123/tasks/task-123')
				.expect(400);
		});
	});

	describe('POST /projects/:id/tasks/:id/comments', () => {
		const mockComment: TaskComment = {
			id: 'task-123',
			taskId: 'task-123',
			comment: 'Lorem ipsum dolor sit amet',
			createdAt: new Date('2024-01-01'),
			createdBy: 'user-123',
			lastUpdatedAt: new Date('2024-01-01'),
			lastUpdatedBy: 'user-123',
		};

		const validCommentDto = {
			comment: 'Lorem ipsum dolor sit amet',
		};

		it('should add a comment successfully', async () => {
			taskService.addTaskComment.mockResolvedValue(mockComment);

			const response = await request(app.getHttpServer())
				.post('/projects/project-123/tasks/task-123/comments')
				.send(validCommentDto)
				.expect(201);

			expect(response.body).toEqual(JSON.parse(JSON.stringify(mockComment)));
			expect(taskService.addTaskComment).toHaveBeenCalledWith({
				...validCommentDto,
				taskId: 'task-123',
				userId: 'user-123',
			});
		});

		it('should validate comment is required', async () => {
			await request(app.getHttpServer())
				.post('/projects/project-123/tasks/task-123/comments')
				.send({ ...validCommentDto, comment: '' })
				.expect(400);
		});

		it('should propagate errors from TaskService', async () => {
			taskService.addTaskComment.mockRejectedValue(
				new BadRequestException('Invalid comment'),
			);

			await request(app.getHttpServer())
				.post('/projects/project-123/tasks/task-123/comments')
				.send(validCommentDto)
				.expect(400);
		});
	});

	describe('GET /projects/:projectId/tasks/:taskId/comments', () => {
		const mockComment: TaskComment = {
			id: 'comment-123',
			taskId: 'task-123',
			comment: 'Lorem ipsum dolor sit amet',
			createdAt: new Date('2024-01-01'),
			createdBy: 'user-123',
			lastUpdatedAt: new Date('2024-01-01'),
			lastUpdatedBy: 'user-123',
		};

		it('should return all comments for a task', async () => {
			const mockComments = [mockComment, { ...mockComment, id: 'comment-456' }];
			taskService.findAllCommentsByTaskId.mockResolvedValue(mockComments);

			const response = await request(app.getHttpServer())
				.get('/projects/project-123/tasks/task-123/comments')
				.expect(200);

			expect(response.body).toEqual(JSON.parse(JSON.stringify(mockComments)));
			expect(taskService.findAllCommentsByTaskId).toHaveBeenCalledWith(
				'task-123',
				'user-123',
			);
		});

		it('should propagate errors from TaskService', async () => {
			taskService.findAllCommentsByTaskId.mockRejectedValue(
				new NotFoundException('Task not found'),
			);

			await request(app.getHttpServer())
				.get('/projects/project-123/tasks/task-123/comments')
				.expect(404);
		});
	});

	describe('PATCH /projects/:projectId/tasks/:taskId/comments/:commentId', () => {
		const mockComment: TaskComment = {
			id: 'comment-123',
			taskId: 'task-123',
			comment: 'Updated comment',
			createdAt: new Date('2024-01-01'),
			createdBy: 'user-123',
			lastUpdatedAt: new Date('2024-01-02'),
			lastUpdatedBy: 'user-123',
		};

		const updateDto = {
			comment: 'Updated comment',
		};

		it('should update a comment successfully', async () => {
			taskService.updateTaskComment.mockResolvedValue(mockComment);

			const response = await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-123/comments/comment-123')
				.send(updateDto)
				.expect(200);

			expect(response.body).toEqual(JSON.parse(JSON.stringify(mockComment)));
			expect(taskService.updateTaskComment).toHaveBeenCalledWith({
				...updateDto,
				commentId: 'comment-123',
				userId: 'user-123',
			});
		});

		it('should validate comment is required', async () => {
			await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-123/comments/comment-123')
				.send({ comment: '' })
				.expect(400);
		});

		it('should propagate errors from TaskService', async () => {
			taskService.updateTaskComment.mockRejectedValue(
				new NotFoundException('Comment not found'),
			);

			await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-123/comments/comment-123')
				.send(updateDto)
				.expect(404);
		});
	});

	describe('DELETE /projects/:projectId/tasks/:taskId/comments/:commentId', () => {
		it('should delete a comment successfully', async () => {
			taskService.deleteTaskComment.mockResolvedValue(undefined);

			await request(app.getHttpServer())
				.delete('/projects/project-123/tasks/task-123/comments/comment-123')
				.expect(204);

			expect(taskService.deleteTaskComment).toHaveBeenCalledWith('comment-123', 'user-123');
		});

		it('should propagate errors from TaskService', async () => {
			taskService.deleteTaskComment.mockRejectedValue(
				new NotFoundException('Comment not found'),
			);

			await request(app.getHttpServer())
				.delete('/projects/project-123/tasks/task-123/comments/comment-123')
				.expect(404);
		});
	});
});
