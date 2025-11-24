import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, DeleteResult, InsertResult, Repository } from 'typeorm';

import { UserEntity } from '../auth/entities/user.entity';
import { PostgreSQLTaskAdapter } from './postgresql-task.adapter';
import { TaskEntity } from './entities/task.entity';
import { Task, TaskComment } from '../../../../core/models/projects/task.model';
import { AddTaskCommentCommand, CreateTaskCommand } from '../../../../core/commands/task.command';
import { TaskCommentEntity } from './entities/task-comment.entity';

describe(PostgreSQLTaskAdapter.name, () => {
	let adapter: PostgreSQLTaskAdapter;
	let repository: jest.Mocked<Repository<TaskEntity>>;
	let commentRepository: jest.Mocked<Repository<TaskCommentEntity>>;
	let userRepository: jest.Mocked<Repository<UserEntity>>;
	let dataSource: jest.Mocked<DataSource>;

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

		const mockCommentRepository = {
			create: jest.fn(),
			delete: jest.fn(),
			insert: jest.fn(),
			save: jest.fn(),
			findOne: jest.fn(),
			find: jest.fn(),
		};

		const mockUserRepository = {
			findOne: jest.fn(),
		};

		const mockTransactionalEntityManager = {
			delete: jest.fn().mockResolvedValue(new DeleteResult()),
		};

		const mockDataSource = {
			transaction: jest.fn(async (isolationLevel, callback) => {
				return callback(mockTransactionalEntityManager);
			}),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PostgreSQLTaskAdapter,
				{
					provide: getRepositoryToken(TaskEntity),
					useValue: mockRepository,
				},
				{
					provide: getRepositoryToken(TaskCommentEntity),
					useValue: mockCommentRepository,
				},
				{
					provide: getRepositoryToken(UserEntity),
					useValue: mockUserRepository,
				},
				{
					provide: DataSource,
					useValue: mockDataSource,
				},
			],
		}).compile();

		adapter = module.get<PostgreSQLTaskAdapter>(PostgreSQLTaskAdapter);
		repository = module.get(getRepositoryToken(TaskEntity));
		commentRepository = module.get(getRepositoryToken(TaskCommentEntity));
		userRepository = module.get(getRepositoryToken(UserEntity));
		dataSource = module.get(DataSource);
	});

	afterEach(() => {
		jest.clearAllMocks();
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
			repository.insert.mockResolvedValue(Promise.resolve(new InsertResult()));
		});

		it('should create a task and return Task domain model', async () => {
			const result = await adapter.createTask(taskId, validCommand);

			expect(result).toEqual(mockTask);
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
			expect(repository.insert).toHaveBeenCalledWith(mockTaskEntity);
			expect(mockTaskEntity.toTask).toHaveBeenCalled();
		});

		it('should set createdAt and lastUpdatedAt to the same value', async () => {
			await adapter.createTask(taskId, validCommand);

			const createCall = repository.create.mock.calls[0][0];
			expect(createCall.createdAt).toEqual(createCall.lastUpdatedAt);
		});

		it('should handle optional summary field', async () => {
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
	});

	describe('#updateTask', () => {
		const baseTaskEntity: any = {
			id: 'task-123',
			projectId: 'project-123',
			title: 'Old Title',
			description: 'Old Description',
			summary: 'Old Summary',
			createdAt: new Date('2024-01-01'),
			lastUpdatedAt: new Date('2024-01-01'),
			createdBy: { id: 'user-123' },
			lastUpdatedBy: { id: 'user-123' },
			toTask: jest.fn().mockReturnValue(mockTask),
		};

		const validCommand = {
			taskId: 'task-123',
			projectId: 'project-123',
			userId: 'user-123',
			title: 'New Title',
			description: 'New Description',
			summary: 'New Summary',
		};

		beforeEach(() => {
			userRepository.findOne.mockResolvedValue(mockUser as UserEntity);
			repository.findOne.mockResolvedValue({ ...baseTaskEntity } as TaskEntity);
			repository.save.mockImplementation(
				async entity =>
					({ ...entity, toTask: jest.fn().mockReturnValue(mockTask) }) as TaskEntity,
			);
		});

		it('should update all fields and return Task domain model', async () => {
			const result = await adapter.updateTask(validCommand);
			// The returned entity should have updated fields
			expect(result).toEqual(mockTask);
			const updatedEntity = repository.save.mock.calls[0][0];
			expect(updatedEntity.title).toBe('New Title');
			expect(updatedEntity.description).toBe('New Description');
			expect(updatedEntity.summary).toBe('New Summary');
			expect(updatedEntity.lastUpdatedBy).toEqual(mockUser);
			expect(updatedEntity.lastUpdatedAt).toBeInstanceOf(Date);
			// toTask should be called
			expect(updatedEntity.toTask).toHaveBeenCalled();
		});

		it('should update only provided fields', async () => {
			const partialCommand = {
				taskId: 'task-123',
				projectId: 'project-123',
				userId: 'user-123',
				title: 'Title Only',
			};
			await adapter.updateTask(partialCommand as any);
			const updatedEntity = repository.save.mock.calls[0][0];
			expect(updatedEntity.title).toBe('Title Only');
			expect(updatedEntity.description).toBe('Old Description');
			expect(updatedEntity.summary).toBe('Old Summary');
		});

		it('should set summary to null if explicitly set to null', async () => {
			const nullSummaryCommand = {
				taskId: 'task-123',
				projectId: 'project-123',
				userId: 'user-123',
				summary: null,
			};
			await adapter.updateTask(nullSummaryCommand as any);
			const updatedEntity = repository.save.mock.calls[0][0];
			expect(updatedEntity.summary).toBeNull();
		});

		it('should throw if user not found', async () => {
			userRepository.findOne.mockResolvedValue(null);
			await expect(adapter.updateTask(validCommand)).rejects.toThrow(
				'Logic error: user not found',
			);
		});

		it('should throw if task not found', async () => {
			repository.findOne.mockResolvedValue(null);
			await expect(adapter.updateTask(validCommand)).rejects.toThrow(
				'Logic error: task not found',
			);
		});

		it('should throw if task not found', async () => {
			repository.findOne.mockResolvedValue(null);
			await expect(adapter.updateTask(validCommand)).rejects.toThrow(
				'Logic error: task not found',
			);
		});
	});

	describe('#deleteTask', () => {
		it('should delete task and all associated comments in a SERIALIZABLE transaction', async () => {
			const command = {
				taskId: 'task-123',
				projectId: 'project-123',
				userId: 'user-123',
			};

			await adapter.deleteTask(command);

			// Verify transaction was called with SERIALIZABLE isolation level
			expect(dataSource.transaction).toHaveBeenCalledWith(
				'SERIALIZABLE',
				expect.any(Function),
			);

			// Get the transaction callback that was passed
			const transactionCallback = (dataSource.transaction as jest.Mock).mock.calls[0][1];
			const mockEntityManager = { delete: jest.fn().mockResolvedValue(new DeleteResult()) };

			// Execute the callback to verify the operations
			await transactionCallback(mockEntityManager);

			// Verify comments are deleted first
			expect(mockEntityManager.delete).toHaveBeenNthCalledWith(1, TaskCommentEntity, {
				taskId: 'task-123',
			});

			// Verify task is deleted second
			expect(mockEntityManager.delete).toHaveBeenNthCalledWith(2, TaskEntity, {
				id: 'task-123',
				projectId: 'project-123',
			});

			// Verify exactly 2 delete operations
			expect(mockEntityManager.delete).toHaveBeenCalledTimes(2);
		});

		it('should handle errors during transaction and rollback', async () => {
			const command = {
				taskId: 'task-123',
				projectId: 'project-123',
				userId: 'user-123',
			};

			const error = new Error('Database error');
			const mockDataSourceWithError = {
				transaction: jest.fn(async (isolationLevel, callback) => {
					const mockEntityManager = {
						delete: jest.fn().mockRejectedValue(error),
					};
					return callback(mockEntityManager);
				}),
			};

			// Replace the dataSource with one that throws an error
			(adapter as any).dataSource = mockDataSourceWithError;

			await expect(adapter.deleteTask(command)).rejects.toThrow('Database error');
		});

		it('should not delete task if comment deletion fails', async () => {
			const command = {
				taskId: 'task-123',
				projectId: 'project-123',
				userId: 'user-123',
			};

			const error = new Error('Failed to delete comments');
			const mockEntityManager = {
				delete: jest
					.fn()
					.mockRejectedValueOnce(error) // First call (comments) fails
					.mockResolvedValueOnce(new DeleteResult()), // Second call (task) should not happen
			};

			const mockDataSourceWithError = {
				transaction: jest.fn(async (isolationLevel, callback) => {
					return callback(mockEntityManager);
				}),
			};

			// Replace the dataSource
			(adapter as any).dataSource = mockDataSourceWithError;

			await expect(adapter.deleteTask(command)).rejects.toThrow('Failed to delete comments');

			// Verify only one delete was attempted (for comments)
			expect(mockEntityManager.delete).toHaveBeenCalledTimes(1);
		});
	});

	describe('#addTaskComment', () => {
		const validCommand: AddTaskCommentCommand = {
			taskId: 'task-123',
			comment: 'Lorem ipsum dolor sit amet',
			userId: 'user-123',
		};

		const mockComment: TaskComment = {
			id: 'task-123',
			taskId: 'task-123',
			comment: 'Lorem ipsum dolor sit amet',
			createdAt: new Date('2024-01-01'),
			createdBy: 'user-123',
			lastUpdatedAt: new Date('2024-01-01'),
			lastUpdatedBy: 'user-123',
		};

		const mockCommentEntity: Partial<TaskCommentEntity> = {
			id: 'comment-123',
			taskId: 'task-123',
			comment: 'Lorem ipsum dolor sit amet',
			createdAt: new Date('2024-01-01'),
			lastUpdatedAt: new Date('2024-01-01'),
			toComment: jest.fn().mockReturnValue(mockComment),
		};

		beforeEach(() => {
			userRepository.findOne.mockResolvedValue(mockUser as UserEntity);
			commentRepository.create.mockReturnValue(mockCommentEntity as TaskCommentEntity);
			commentRepository.insert.mockResolvedValue(Promise.resolve(new InsertResult()));
		});

		it('should create a task and return Task domain model', async () => {
			const result = await adapter.addTaskComment('comment-123', validCommand);

			expect(result).toEqual(mockComment);
			expect(commentRepository.create).toHaveBeenCalledWith({
				id: 'comment-123',
				taskId: 'task-123',
				comment: 'Lorem ipsum dolor sit amet',
				createdBy: mockUser,
				lastUpdatedBy: mockUser,
				createdAt: expect.any(Date),
				lastUpdatedAt: expect.any(Date),
			});
			expect(commentRepository.insert).toHaveBeenCalledWith(mockCommentEntity);
			expect(mockCommentEntity.toComment).toHaveBeenCalled();
		});
	});

	describe('#updateTaskComment', () => {
		const mockComment: TaskComment = {
			id: 'task-123',
			taskId: 'task-123',
			comment: 'Lorem ipsum dolor sit amet',
			createdAt: new Date('2024-01-01'),
			createdBy: 'user-123',
			lastUpdatedAt: new Date('2024-01-01'),
			lastUpdatedBy: 'user-123',
		};

		const mockCommentEntity: Partial<TaskCommentEntity> = {
			id: 'comment-123',
			taskId: 'task-123',
			comment: 'Lorem ipsum dolor sit amet',
			createdAt: new Date('2024-01-01'),
			lastUpdatedAt: new Date('2024-01-01'),
			toComment: jest.fn().mockReturnValue(mockComment),
		};

		beforeEach(() => {
			userRepository.findOne.mockResolvedValue(mockUser as UserEntity);
			commentRepository.findOne.mockResolvedValue(mockCommentEntity as TaskCommentEntity);
			commentRepository.save.mockImplementation(
				async entity =>
					({
						...entity,
						toComment: jest.fn().mockReturnValue(mockComment),
					}) as TaskCommentEntity,
			);
		});

		it('should update the comment', async () => {
			const result = await adapter.updateTaskComment({
				commentId: 'comment-123',
				comment: 'edited',
				userId: 'user-123',
			});
			// The returned entity should have updated fields
			expect(result).toEqual(mockComment);
			const updatedEntity = commentRepository.save.mock.calls[0][0];
			expect(updatedEntity.comment).toBe('edited');
			expect(updatedEntity.lastUpdatedBy).toEqual(mockUser);
			expect(updatedEntity.lastUpdatedAt).toBeInstanceOf(Date);
			expect(updatedEntity.lastUpdatedAt).not.toEqual(updatedEntity.createdAt);
			expect(updatedEntity.toComment).toHaveBeenCalled();
		});

		it('should throw if user not found', async () => {
			userRepository.findOne.mockResolvedValue(null);
			await expect(
				adapter.updateTaskComment({
					commentId: 'comment-123',
					comment: 'edited',
					userId: 'user-123',
				}),
			).rejects.toThrow('Logic error: user not found');
		});

		it('should throw if comment not found', async () => {
			commentRepository.findOne.mockResolvedValue(null);
			await expect(
				adapter.updateTaskComment({
					commentId: 'comment-123',
					comment: 'edited',
					userId: 'user-123',
				}),
			).rejects.toThrow('No such comment with ID comment-123');
		});
	});

	describe('#findAllCommentsByTaskId', () => {
		const mockComment: TaskComment = {
			id: 'task-123',
			taskId: 'task-123',
			comment: 'Lorem ipsum dolor sit amet',
			createdAt: new Date('2024-01-01'),
			createdBy: 'user-123',
			lastUpdatedAt: new Date('2024-01-01'),
			lastUpdatedBy: 'user-123',
		};

		const mockCommentEntity: Partial<TaskCommentEntity> = {
			id: 'comment-123',
			taskId: 'task-123',
			comment: 'Lorem ipsum dolor sit amet',
			createdAt: new Date('2024-01-01'),
			lastUpdatedAt: new Date('2024-01-01'),
			toComment: jest.fn().mockReturnValue(mockComment),
		};

		it('should find all comments by task ID', async () => {
			userRepository.findOne.mockResolvedValue(mockUser as UserEntity);
			commentRepository.find.mockResolvedValue([mockCommentEntity as TaskCommentEntity]);
			repository.findOne.mockResolvedValue(null);
			// Ensure no undefined is returned for entity mocks
			repository.findOne.mockResolvedValue(null);

			const taskId = 'task-123';
			const result = await adapter.findAllCommentsByTaskId(taskId);

			expect(result).toEqual([mockComment]);
			expect(commentRepository.find).toHaveBeenCalledWith({
				where: { taskId },
				relations: ['createdBy', 'lastUpdatedBy'],
				order: {
					createdAt: 'DESC',
				},
			});
			expect(mockCommentEntity.toComment).toHaveBeenCalled();
		});
	});

	describe('#deleteAllCommentsByTaskId', () => {
		it('should delete all comments by task ID', async () => {
			userRepository.findOne.mockResolvedValue(mockUser as UserEntity);
			commentRepository.delete.mockResolvedValue(new DeleteResult());

			const taskId = 'task-123';
			await adapter.deleteAllCommentsByTaskId(taskId);

			expect(commentRepository.delete).toHaveBeenCalledWith({
				taskId,
			});
		});
	});

	describe('#deleteTaskComment', () => {
		it('should delete a comment by its ID', async () => {
			userRepository.findOne.mockResolvedValue(mockUser as UserEntity);
			commentRepository.delete.mockResolvedValue(new DeleteResult());

			const commentId = 'comment-123';
			await adapter.deleteTaskComment(commentId);

			expect(commentRepository.delete).toHaveBeenCalledWith({
				id: commentId,
			});
		});
	});
});
