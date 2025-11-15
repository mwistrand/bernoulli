import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { CreateTaskCommand } from '../../../core/commands/task.command';
import { TASK_PORT, TaskPort } from '../../../core/ports/out/projects/task.port';
import {
	PROJECT_MEMBER_PORT,
	ProjectMemberPort,
} from '../../../core/ports/out/projects/project-member.port';
import { ProjectRole } from '../../../core/models/projects/project-member.model';

describe(TaskService.name, () => {
	let service: TaskService;
	let taskPort: jest.Mocked<TaskPort>;
	let projectMemberPort: jest.Mocked<ProjectMemberPort>;

	beforeEach(async () => {
		const mockTaskPort: jest.Mocked<TaskPort> = {
			createTask: jest.fn(),
			findAllTasksByProjectId: jest.fn(),
			findTaskById: jest.fn(),
			updateTask: jest.fn(),
			deleteTask: jest.fn(),
		} as any;

		const mockProjectMemberPort: jest.Mocked<Partial<ProjectMemberPort>> = {
			findByProjectAndUser: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskService,
				{
					provide: TASK_PORT,
					useValue: mockTaskPort,
				},
				{
					provide: PROJECT_MEMBER_PORT,
					useValue: mockProjectMemberPort,
				},
			],
		}).compile();

		service = module.get<TaskService>(TaskService);
		taskPort = module.get(TASK_PORT);
		projectMemberPort = module.get(PROJECT_MEMBER_PORT);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('#createTask', () => {
		it('should throw without a valid user id', async () => {
			const command: CreateTaskCommand = {
				userId: '      ',
				projectId: 'project-123',
				title: 'Title',
				description: 'Description',
			};
			await expect(service.createTask(command)).rejects.toThrow(
				new UnauthorizedException('User not authenticated'),
			);
		});

		it('should throw without a valid project id', async () => {
			const command: CreateTaskCommand = {
				userId: 'user-id',
				projectId: '      ',
				title: 'Title',
				description: 'Description',
			};
			await expect(service.createTask(command)).rejects.toThrow(
				new NotFoundException('Project not found'),
			);
		});

		it('should throw ForbiddenException when user is not a project member', async () => {
			const command: CreateTaskCommand = {
				userId: 'user-id',
				projectId: 'project-id',
				title: 'Title',
				description: 'Description',
			};
			projectMemberPort.findByProjectAndUser.mockResolvedValue(null);

			await expect(service.createTask(command)).rejects.toThrow(
				new ForbiddenException('User is not a project member'),
			);
		});

		it('should persist the task with a new task ID', async () => {
			const now = new Date();
			const command: CreateTaskCommand = {
				userId: 'user-id',
				projectId: 'project-id',
				title: 'Title',
				description: 'Description',
			};

			projectMemberPort.findByProjectAndUser.mockResolvedValue({
				id: 'member-id',
				projectId: 'project-id',
				userId: 'user-id',
				role: ProjectRole.USER,
				userName: 'Test User',
				userEmail: 'test@example.com',
				createdAt: now,
				lastUpdatedAt: now,
			});

			taskPort.createTask.mockResolvedValue({
				id: 'task-id',
				projectId: 'project-id',
				title: 'Title',
				description: 'Description',
				createdAt: now,
				createdBy: 'user-123',
				lastUpdatedBy: 'user-123',
				lastUpdatedAt: now,
			});

			const portSpy = jest.spyOn(taskPort, 'createTask');
			const task = await service.createTask(command);
			expect(portSpy).toHaveBeenCalledTimes(1);
			expect(projectMemberPort.findByProjectAndUser).toHaveBeenCalledWith(
				'project-id',
				'user-id',
			);
			expect(task).toEqual({
				id: 'task-id',
				projectId: 'project-id',
				title: 'Title',
				description: 'Description',
				createdAt: now,
				createdBy: 'user-123',
				lastUpdatedBy: 'user-123',
				lastUpdatedAt: now,
			});
		});
	});

	describe('#findAllTasksByProjectId', () => {
		it('should throw without a valid project id', async () => {
			await expect(service.findAllTasksByProjectId('      ', 'user-id')).rejects.toThrow(
				new NotFoundException('Project not found'),
			);
		});

		it('should throw ForbiddenException when user is not a project member', async () => {
			projectMemberPort.findByProjectAndUser.mockResolvedValue(null);

			await expect(service.findAllTasksByProjectId('project-id', 'user-id')).rejects.toThrow(
				new ForbiddenException('User is not a project member'),
			);
		});

		it('should load all tasks by project ID', async () => {
			const now = new Date();

			projectMemberPort.findByProjectAndUser.mockResolvedValue({
				id: 'member-id',
				projectId: 'project-id',
				userId: 'user-id',
				role: ProjectRole.USER,
				userName: 'Test User',
				userEmail: 'test@example.com',
				createdAt: now,
				lastUpdatedAt: now,
			});

			taskPort.findAllTasksByProjectId.mockResolvedValue([
				{
					id: 'task-id',
					projectId: 'project-id',
					title: 'Title',
					description: 'Description',
					createdAt: now,
					createdBy: 'user-123',
					lastUpdatedBy: 'user-123',
					lastUpdatedAt: now,
				},
			]);

			const portSpy = jest.spyOn(taskPort, 'findAllTasksByProjectId');
			const tasks = await service.findAllTasksByProjectId('project-id', 'user-id');
			expect(portSpy).toHaveBeenCalledTimes(1);
			expect(projectMemberPort.findByProjectAndUser).toHaveBeenCalledWith(
				'project-id',
				'user-id',
			);
			expect(tasks).toEqual([
				{
					id: 'task-id',
					projectId: 'project-id',
					title: 'Title',
					description: 'Description',
					createdAt: now,
					createdBy: 'user-123',
					lastUpdatedBy: 'user-123',
					lastUpdatedAt: now,
				},
			]);
		});
	});
});
