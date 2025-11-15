import { Test, TestingModule } from '@nestjs/testing';
import {
	INestApplication,
	BadRequestException,
	ValidationPipe,
	ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';

import { ProjectController } from './project.controller';
import { ProjectService } from '../../../../core/services/projects/project.service';
import type { Project } from '../../../../core/models/projects/project.model';
import { TaskService } from '../../../../core/services/projects/task.service';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';

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

	const mockUser = {
		userId: 'user-123',
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
		};

		// Mock guard to always return true and set user
		const mockAuthGuard = {
			canActivate: jest.fn((context: ExecutionContext) => {
				const request = context.switchToHttp().getRequest();
				request.user = mockUser;
				return true;
			}),
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

	it('should be defined', () => {
		expect(app).toBeDefined();
	});

	describe('POST /projects', () => {
		const validDto = {
			name: 'My Project',
		};

		it('should create a project successfully', async () => {
			projectService.createProject.mockResolvedValue(mockProject);

			const response = await request(app.getHttpServer())
				.post('/projects')
				.send(validDto)
				.expect(201);

			expect(response.body).toEqual(JSON.parse(JSON.stringify(mockProject)));
			expect(projectService.createProject).toHaveBeenCalledWith({
				...validDto,
				userId: 'user-123',
			});
		});

		it('should call projectService.createProject with the command', async () => {
			projectService.createProject.mockResolvedValue(mockProject);

			await request(app.getHttpServer()).post('/projects').send(validDto).expect(201);

			expect(projectService.createProject).toHaveBeenCalledTimes(1);
			expect(projectService.createProject).toHaveBeenCalledWith({
				...validDto,
				userId: 'user-123',
			});
		});

		it('should return the created project object', async () => {
			projectService.createProject.mockResolvedValue(mockProject);

			const response = await request(app.getHttpServer())
				.post('/projects')
				.send(validDto)
				.expect(201);

			expect(response.body).toHaveProperty('id');
			expect(response.body).toHaveProperty('name');
		});

		it('should propagate validation errors from ProjectService', async () => {
			const error = new BadRequestException('Project must have a valid name');
			projectService.createProject.mockRejectedValue(error);

			const response = await request(app.getHttpServer())
				.post('/projects')
				.send(validDto)
				.expect(400);

			expect(response.body).toHaveProperty('message', 'Project must have a valid name');
		});

		it('should handle missing name in command', async () => {
			const response = await request(app.getHttpServer())
				.post('/projects')
				.send({ name: '' })
				.expect(400);

			expect(response.body).toHaveProperty('message');
			expect(response.body.message).toContain('Project name is required');
		});

		it('should handle null command', async () => {
			const response = await request(app.getHttpServer())
				.post('/projects')
				.send(null)
				.expect(400);

			expect(response.body).toHaveProperty('message');
		});

		it('should handle undefined command', async () => {
			const response = await request(app.getHttpServer())
				.post('/projects')
				.send(undefined)
				.expect(400);

			expect(response.body).toHaveProperty('message');
		});

		it('should accept project name with special characters', async () => {
			const dto = { name: 'Project #1: Test & Development' };
			projectService.createProject.mockResolvedValue(mockProject);

			await request(app.getHttpServer()).post('/projects').send(dto).expect(201);

			expect(projectService.createProject).toHaveBeenCalledWith({
				...dto,
				userId: 'user-123',
			});
		});

		it('should accept project name with unicode characters', async () => {
			const dto = { name: 'Проект Тест 项目测试' };
			projectService.createProject.mockResolvedValue(mockProject);

			await request(app.getHttpServer()).post('/projects').send(dto).expect(201);

			expect(projectService.createProject).toHaveBeenCalledWith({
				...dto,
				userId: 'user-123',
			});
		});

		it('should reject long project names exceeding max length', async () => {
			const dto = { name: 'A'.repeat(101) };

			const response = await request(app.getHttpServer())
				.post('/projects')
				.send(dto)
				.expect(400);

			expect(response.body).toHaveProperty('message');
			expect(response.body.message).toContain('Project name must not exceed 100 characters');
		});

		it('should return different projects for different commands', async () => {
			const project1: Project = { ...mockProject, id: 'project-1', name: 'Project 1' };
			const project2: Project = { ...mockProject, id: 'project-2', name: 'Project 2' };

			projectService.createProject
				.mockResolvedValueOnce(project1)
				.mockResolvedValueOnce(project2);

			const response1 = await request(app.getHttpServer())
				.post('/projects')
				.send({ name: 'Project 1' })
				.expect(201);

			const response2 = await request(app.getHttpServer())
				.post('/projects')
				.send({ name: 'Project 2' })
				.expect(201);

			expect(response1.body.id).toBe('project-1');
			expect(response2.body.id).toBe('project-2');
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

	describe('PATCH /projects/:projectId/tasks/:taskId', () => {
		const mockTask = {
			id: 'task-123',
			projectId: 'project-123',
			title: 'Updated Task',
			description: 'Updated Description',
			summary: 'Updated Summary',
			createdAt: new Date(),
			createdBy: 'user-123',
			lastUpdatedAt: new Date(),
			lastUpdatedBy: 'user-123',
		};

		it('should update a task successfully', async () => {
			const updateDto = {
				title: 'Updated Task',
				description: 'Updated Description',
			};
			taskService.updateTask.mockResolvedValue(mockTask);

			const response = await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-123')
				.send(updateDto)
				.expect(200);

			expect(response.body).toEqual(JSON.parse(JSON.stringify(mockTask)));
			expect(taskService.updateTask).toHaveBeenCalledWith({
				...updateDto,
				projectId: 'project-123',
				taskId: 'task-123',
				userId: 'user-123',
			});
		});

		it('should allow partial updates with only title', async () => {
			const updateDto = { title: 'New Title' };
			taskService.updateTask.mockResolvedValue(mockTask);

			await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-123')
				.send(updateDto)
				.expect(200);

			expect(taskService.updateTask).toHaveBeenCalledWith({
				title: 'New Title',
				projectId: 'project-123',
				taskId: 'task-123',
				userId: 'user-123',
			});
		});

		it('should allow partial updates with only description', async () => {
			const updateDto = { description: 'New Description' };
			taskService.updateTask.mockResolvedValue(mockTask);

			await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-123')
				.send(updateDto)
				.expect(200);

			expect(taskService.updateTask).toHaveBeenCalledWith({
				description: 'New Description',
				projectId: 'project-123',
				taskId: 'task-123',
				userId: 'user-123',
			});
		});

		it('should allow setting summary to null', async () => {
			const updateDto = { summary: null };
			taskService.updateTask.mockResolvedValue({ ...mockTask, summary: undefined });

			await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-123')
				.send(updateDto)
				.expect(200);

			expect(taskService.updateTask).toHaveBeenCalledWith({
				summary: null,
				projectId: 'project-123',
				taskId: 'task-123',
				userId: 'user-123',
			});
		});

		it('should reject empty title', async () => {
			const updateDto = { title: '' };

			const response = await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-123')
				.send(updateDto)
				.expect(400);

			expect(response.body).toHaveProperty('message');
			expect(taskService.updateTask).not.toHaveBeenCalled();
		});

		it('should reject title exceeding max length', async () => {
			const updateDto = { title: 'A'.repeat(301) };

			const response = await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-123')
				.send(updateDto)
				.expect(400);

			expect(response.body).toHaveProperty('message');
			const message = Array.isArray(response.body.message)
				? response.body.message.join(', ')
				: response.body.message;
			expect(message).toContain('300 characters');
		});

		it('should reject description exceeding max length', async () => {
			const updateDto = { description: 'A'.repeat(5001) };

			const response = await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-123')
				.send(updateDto)
				.expect(400);

			expect(response.body).toHaveProperty('message');
			const message = Array.isArray(response.body.message)
				? response.body.message.join(', ')
				: response.body.message;
			expect(message).toContain('5000 characters');
		});

		it('should reject summary exceeding max length', async () => {
			const updateDto = { summary: 'A'.repeat(501) };

			const response = await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-123')
				.send(updateDto)
				.expect(400);

			expect(response.body).toHaveProperty('message');
			const message = Array.isArray(response.body.message)
				? response.body.message.join(', ')
				: response.body.message;
			expect(message).toContain('500 characters');
		});

		it('should handle task not found error', async () => {
			const updateDto = { title: 'Updated Title' };
			taskService.updateTask.mockRejectedValue({
				statusCode: 404,
				message: 'Task not found',
			});

			await request(app.getHttpServer())
				.patch('/projects/project-123/tasks/task-999')
				.send(updateDto)
				.expect(404);
		});
	});

	describe('DELETE /projects/:projectId/tasks/:taskId', () => {
		it('should delete a task successfully', async () => {
			taskService.deleteTask.mockResolvedValue(undefined);

			await request(app.getHttpServer())
				.delete('/projects/project-123/tasks/task-123')
				.expect(204);

			expect(taskService.deleteTask).toHaveBeenCalledWith({
				projectId: 'project-123',
				taskId: 'task-123',
				userId: 'user-123',
			});
		});

		it('should return 204 with no content', async () => {
			taskService.deleteTask.mockResolvedValue(undefined);

			const response = await request(app.getHttpServer())
				.delete('/projects/project-123/tasks/task-123')
				.expect(204);

			expect(response.body).toEqual({});
		});

		it('should handle task not found error', async () => {
			taskService.deleteTask.mockRejectedValue({
				statusCode: 404,
				message: 'Task not found',
			});

			await request(app.getHttpServer())
				.delete('/projects/project-123/tasks/task-999')
				.expect(404);
		});

		it('should call deleteTask with correct parameters', async () => {
			taskService.deleteTask.mockResolvedValue(undefined);

			await request(app.getHttpServer())
				.delete('/projects/project-456/tasks/task-789')
				.expect(204);

			expect(taskService.deleteTask).toHaveBeenCalledWith({
				projectId: 'project-456',
				taskId: 'task-789',
				userId: 'user-123',
			});
		});
	});
});
