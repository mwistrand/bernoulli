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
import { I18nService } from 'nestjs-i18n';

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

		const mockI18nService = {
			t: jest.fn((key: string) => {
				const translations: Record<string, string> = {
					'auth.errors.user_not_authenticated': 'User not authenticated',
					'projects.errors.not_found': 'Project not found',
					'projects.errors.not_a_member': 'User is not a project member',
					'projects.errors.task_not_found': 'Task not found',
				};
				return translations[key] || key;
			}),
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
				{
					provide: I18nService,
					useValue: mockI18nService,
				},
			],
		}).compile();

		service = module.get<TaskService>(TaskService);
		taskPort = module.get(TASK_PORT);
		projectMemberPort = module.get(PROJECT_MEMBER_PORT);
	});

	describe('createTask', () => {
		const now = new Date();
		const validCommand: CreateTaskCommand = {
			userId: 'user-id',
			projectId: 'project-id',
			title: 'Title',
			description: 'Description',
		};

		it('should throw UnauthorizedException when userId is invalid', async () => {
			const command = { ...validCommand, userId: '      ' };
			await expect(service.createTask(command)).rejects.toThrow(
				new UnauthorizedException('User not authenticated'),
			);
		});

		it('should throw NotFoundException when projectId is invalid', async () => {
			const command = { ...validCommand, projectId: '      ' };
			await expect(service.createTask(command)).rejects.toThrow(
				new NotFoundException('Project not found'),
			);
		});

		it('should throw ForbiddenException when user is not a project member', async () => {
			projectMemberPort.findByProjectAndUser.mockResolvedValue(null);

			await expect(service.createTask(validCommand)).rejects.toThrow(
				new ForbiddenException('User is not a project member'),
			);
		});

		it('should create task when user is a project member', async () => {
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

			const expectedTask = {
				id: 'task-id',
				projectId: 'project-id',
				title: 'Title',
				description: 'Description',
				createdAt: now,
				createdBy: 'user-123',
				lastUpdatedBy: 'user-123',
				lastUpdatedAt: now,
			};

			taskPort.createTask.mockResolvedValue(expectedTask);

			const task = await service.createTask(validCommand);

			expect(projectMemberPort.findByProjectAndUser).toHaveBeenCalledWith(
				'project-id',
				'user-id',
			);
			expect(taskPort.createTask).toHaveBeenCalledTimes(1);
			expect(task).toEqual(expectedTask);
		});
	});

	describe('findAllTasksByProjectId', () => {
		const now = new Date();

		it('should throw NotFoundException when projectId is invalid', async () => {
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

		it('should return tasks when user is a project member', async () => {
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

			const expectedTasks = [
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
			];

			taskPort.findAllTasksByProjectId.mockResolvedValue(expectedTasks);

			const tasks = await service.findAllTasksByProjectId('project-id', 'user-id');

			expect(projectMemberPort.findByProjectAndUser).toHaveBeenCalledWith(
				'project-id',
				'user-id',
			);
			expect(tasks).toEqual(expectedTasks);
		});
	});
});
