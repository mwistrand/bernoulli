import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { AddTaskCommentCommand, CreateTaskCommand } from '../../../core/commands/task.command';
import { TASK_PORT, TaskPort } from '../../../core/ports/out/projects/task.port';
import { I18nService } from 'nestjs-i18n';

describe(TaskService.name, () => {
	let service: TaskService;
	let taskPort: jest.Mocked<TaskPort>;

	beforeEach(async () => {
		const mockTaskPort: jest.Mocked<TaskPort> = {
			createTask: jest.fn(),
			findAllTasksByProjectId: jest.fn(),
			findTaskById: jest.fn(),
			updateTask: jest.fn(),
			deleteTask: jest.fn(),
			addTaskComment: jest.fn(),
		} as any;

		const mockI18nService = {
			t: jest.fn((key: string) => {
				const translations: Record<string, string> = {
					'auth.errors.user_not_authenticated': 'User not authenticated',
					'projects.errors.not_found': 'Project not found',
					'projects.errors.not_a_member': 'User is not a project member',
					'projects.errors.task_not_found': 'Task not found',
					'projects.errors.comment_blank': 'Comment must not be blank',
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
					provide: I18nService,
					useValue: mockI18nService,
				},
			],
		}).compile();

		service = module.get<TaskService>(TaskService);
		taskPort = module.get(TASK_PORT);
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

		it('should create task', async () => {
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

		it('should return tasks', async () => {
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
			expect(tasks).toEqual(expectedTasks);
		});
	});

	describe('findTaskById', () => {
		const now = new Date();

		it('should throw NotFoundException when projectId is invalid', async () => {
			await expect(service.findTaskById('      ', '   ', 'user-id')).rejects.toThrow(
				new NotFoundException('Project not found'),
			);
		});

		it('should throw NotFoundException when taskId is invalid', async () => {
			await expect(service.findTaskById('project-id', '   ', 'user-id')).rejects.toThrow(
				new NotFoundException('Task not found'),
			);
		});

		it('should return the requested task', async () => {
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

			taskPort.findTaskById.mockResolvedValue(expectedTask);

			const task = await service.findTaskById('project-id', 'task-id', 'user-id');
			expect(task).toEqual(expectedTask);
		});
	});

	describe('#addTaskComment', () => {
		beforeEach(() => {
			jest.spyOn(crypto, 'randomUUID').mockReturnValue('type-safe-mock-uuid-123');
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('should throw without a valid user ID', async () => {
			const command: AddTaskCommentCommand = {
				comment: 'Lorem ipsum',
				userId: '   ',
				taskId: 'task-123',
			};

			await expect(service.addTaskComment(command)).rejects.toThrow(
				new UnauthorizedException('User not authenticated'),
			);
		});

		it('should throw without a valid comment', async () => {
			const command: AddTaskCommentCommand = {
				comment: '      ',
				userId: 'user-123',
				taskId: 'task-123',
			};

			await expect(service.addTaskComment(command)).rejects.toThrow(
				new BadRequestException('Comment must not be blank'),
			);
		});

		it('should add a comment successfully', async () => {
			const command: AddTaskCommentCommand = {
				comment: 'Lorem ipsum dolor sit amet',
				userId: 'user-123',
				taskId: 'task-123',
			};

			await service.addTaskComment(command);
			expect(taskPort.addTaskComment).toHaveBeenCalledWith(
				'type-safe-mock-uuid-123',
				command,
			);
		});
	});
});
