import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '../auth/entities/user.entity';
import { PostgreSQLTaskAdapter } from './postgresql-task.adapter';
import { TaskEntity } from './entity/task.entity';
import { Task } from 'src/core/models/projects/task.model';
import { CreateTaskCommand } from 'src/core/commands/task.command';

describe(PostgreSQLTaskAdapter.name, () => {
	let adapter: PostgreSQLTaskAdapter;
	let repository: jest.Mocked<Repository<TaskEntity>>;
	let userRepository: jest.Mocked<Repository<UserEntity>>;

	const mockUser: Partial<UserEntity> = {
		id: 'user-123',
		name: 'Test User',
		email: 'test@example.com',
	};

	const mockTask: Task = {
		id: 'task-123',
		projectId: 'project-123',
		title: 'Test Project',
		description: 'Test Description',
		summary: 'Test Summary',
		createdAt: new Date('2024-01-01'),
		createdBy: 'user-123',
		lastUpdatedAt: new Date('2024-01-01'),
		lastUpdatedBy: 'user-123',
	};

	const mockTaskEntity: Partial<TaskEntity> = {
		id: 'task-123',
		projectId: 'project-123',
		title: 'Test Project',
		description: 'Test Description',
		summary: 'Test Summary',
		createdAt: new Date('2024-01-01'),
		lastUpdatedAt: new Date('2024-01-01'),
		toTask: jest.fn().mockReturnValue(mockTask),
	};

	beforeEach(async () => {
		const mockRepository = {
			create: jest.fn(),
			insert: jest.fn(),
			save: jest.fn(),
			findOne: jest.fn(),
			find: jest.fn(),
		};

		const mockUserRepository = {
			findOne: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PostgreSQLTaskAdapter,
				{
					provide: getRepositoryToken(TaskEntity),
					useValue: mockRepository,
				},
				{
					provide: getRepositoryToken(UserEntity),
					useValue: mockUserRepository,
				},
			],
		}).compile();

		adapter = module.get<PostgreSQLTaskAdapter>(PostgreSQLTaskAdapter);
		repository = module.get(getRepositoryToken(TaskEntity));
		userRepository = module.get(getRepositoryToken(UserEntity));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(adapter).toBeDefined();
	});

	describe('#createTask', () => {
		const validCommand: CreateTaskCommand = {
			projectId: 'project-123',
			title: 'My Task',
			description: 'My task description',
			summary: 'My task summary',
			userId: 'user-123',
		};

		const taskId = 'new-task-id-123';

		beforeEach(() => {
			userRepository.findOne.mockResolvedValue(mockUser as UserEntity);
			repository.create.mockReturnValue(mockTaskEntity as TaskEntity);
			repository.insert.mockResolvedValue(undefined as any);
		});

		it('should create a task successfully', async () => {
			const result = await adapter.createTask(taskId, validCommand);

			expect(result).toEqual(mockTask);
			expect(repository.create).toHaveBeenCalled();
			expect(repository.insert).toHaveBeenCalledWith(mockTaskEntity);
		});

		it('should create task entity with correct data', async () => {
			await adapter.createTask(taskId, validCommand);

			expect(repository.create).toHaveBeenCalledWith({
				id: taskId,
				title: 'My Task',
				projectId: 'project-123',
				description: 'My task description',
				summary: 'My task summary',
				createdBy: mockUser,
				lastUpdatedBy: mockUser,
				createdAt: expect.any(Date),
				lastUpdatedAt: expect.any(Date),
			});
		});

		it('should set createdAt and lastUpdatedAt to the same value', async () => {
			await adapter.createTask(taskId, validCommand);

			const createCall = repository.create.mock.calls[0][0];
			expect(createCall.createdAt).toEqual(createCall.lastUpdatedAt);
		});

		it('should handle task without summar', async () => {
			const commandWithoutSummary: CreateTaskCommand = {
				title: 'My Task',
				description: 'My description',
				projectId: 'project-123',
				userId: 'user-123',
			};

			await adapter.createTask(taskId, commandWithoutSummary);

			expect(repository.create).toHaveBeenCalledWith({
				id: taskId,
				title: 'My Task',
				projectId: 'project-123',
				description: 'My description',
				summary: undefined,
				createdBy: mockUser,
				lastUpdatedBy: mockUser,
				createdAt: expect.any(Date),
				lastUpdatedAt: expect.any(Date),
			});
		});

		it('should insert task entity into repository', async () => {
			await adapter.createTask(taskId, validCommand);

			expect(repository.insert).toHaveBeenCalledWith(mockTaskEntity);
		});

		it('should call toTask on the entity', async () => {
			const result = await adapter.createTask(taskId, validCommand);

			expect(mockTaskEntity.toTask).toHaveBeenCalled();
			expect(result).toEqual(mockTask);
		});

		it('should use provided task id', async () => {
			const customId = 'custom-uuid-456';
			await adapter.createTask(customId, validCommand);

			expect(repository.create).toHaveBeenCalledWith(
				expect.objectContaining({ id: customId }),
			);
		});

		it('should handle tasks with unicode characters', async () => {
			const command = {
				title: 'Проект Тест 项目测试',
				projectId: 'project-123',
				description: 'Test',
				userId: 'user-123',
			};
			await adapter.createTask(taskId, command);

			expect(repository.create).toHaveBeenCalledWith(
				expect.objectContaining({ title: 'Проект Тест 项目测试' }),
			);
		});
	});
});
