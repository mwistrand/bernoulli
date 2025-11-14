import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { CreateTaskCommand } from '../../../core/commands/task.command';
import { TASK_PORT, TaskPort } from '../../../core/ports/out/projects/task.port';

describe(TaskService.name, () => {
	let service: TaskService;
	let taskPort: jest.Mocked<TaskPort>;

	beforeEach(async () => {
		const mockTaskPort: jest.Mocked<TaskPort> = {
			createTask: jest.fn(),
			findAllTasksByProjectId: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskService,
				{
					provide: TASK_PORT,
					useValue: mockTaskPort,
				},
			],
		}).compile();

		service = module.get<TaskService>(TaskService);
		taskPort = module.get(TASK_PORT);
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

		it('should persist the task with a new task ID', async () => {
			const now = new Date();
			const command: CreateTaskCommand = {
				userId: 'user-id',
				projectId: 'project-id',
				title: 'Title',
				description: 'Description',
			};
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
		it('should throw without a valid user id', async () => {
			await expect(service.findAllTasksByProjectId('      ')).rejects.toThrow(
				new NotFoundException('Project not found'),
			);
		});

		it('should load all tasks by project ID', async () => {
			const now = new Date();
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
			const tasks = await service.findAllTasksByProjectId('project-id');
			expect(portSpy).toHaveBeenCalledTimes(1);
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
