import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';

import { PostgreSQLProjectAdapter } from './postgresql-project.adapter';
import { ProjectEntity } from './entities/project.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { CreateProjectCommand } from '../../../../core/commands/project.command';
import { Project } from '../../../../core/models/projects/project.model';

describe(PostgreSQLProjectAdapter.name, () => {
	let adapter: PostgreSQLProjectAdapter;
	let repository: jest.Mocked<Repository<ProjectEntity>>;
	let userRepository: jest.Mocked<Repository<UserEntity>>;

	const mockUser: Partial<UserEntity> = {
		id: 'user-123',
		name: 'Test User',
		email: 'test@example.com',
	};

	const mockProject: Project = {
		id: 'project-123',
		name: 'Test Project',
		description: 'Test Description',
		createdAt: new Date('2024-01-01'),
		createdBy: 'user-123',
		lastUpdatedAt: new Date('2024-01-01'),
		lastUpdatedBy: 'user-123',
	};

	const mockProjectEntity: Partial<ProjectEntity> = {
		id: 'project-123',
		name: 'Test Project',
		description: 'Test Description',
		createdAt: new Date('2024-01-01'),
		lastUpdatedAt: new Date('2024-01-01'),
		toProject: jest.fn().mockReturnValue(mockProject),
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
				PostgreSQLProjectAdapter,
				{
					provide: getRepositoryToken(ProjectEntity),
					useValue: mockRepository,
				},
				{
					provide: getRepositoryToken(UserEntity),
					useValue: mockUserRepository,
				},
			],
		}).compile();

		adapter = module.get<PostgreSQLProjectAdapter>(PostgreSQLProjectAdapter);
		repository = module.get(getRepositoryToken(ProjectEntity));
		userRepository = module.get(getRepositoryToken(UserEntity));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('createProject', () => {
		const validCommand: CreateProjectCommand = {
			name: 'My Project',
			description: 'My project description',
			userId: 'user-123',
		};

		const projectId = 'new-project-id-123';

		beforeEach(() => {
			userRepository.findOne.mockResolvedValue(mockUser as UserEntity);
			repository.create.mockReturnValue(mockProjectEntity as ProjectEntity);
			repository.insert.mockResolvedValue(undefined as any);
		});

		it('should create a project and return Project domain model', async () => {
			const result = await adapter.createProject(projectId, validCommand);

			expect(result).toEqual(mockProject);
			expect(repository.create).toHaveBeenCalledWith({
				id: projectId,
				name: 'My Project',
				description: 'My project description',
				createdBy: mockUser,
				lastUpdatedBy: mockUser,
				createdAt: expect.any(Date),
				lastUpdatedAt: expect.any(Date),
			});
			expect(repository.insert).toHaveBeenCalledWith(mockProjectEntity);
			expect(mockProjectEntity.toProject).toHaveBeenCalled();
		});

		it('should set createdAt and lastUpdatedAt to the same value', async () => {
			await adapter.createProject(projectId, validCommand);

			const createCall = repository.create.mock.calls[0][0];
			expect(createCall.createdAt).toEqual(createCall.lastUpdatedAt);
		});

		it('should handle optional description field', async () => {
			const commandWithoutDescription: CreateProjectCommand = {
				name: 'My Project',
				userId: 'user-123',
			};

			await adapter.createProject(projectId, commandWithoutDescription);

			expect(repository.create).toHaveBeenCalledWith({
				id: projectId,
				name: 'My Project',
				description: undefined,
				createdBy: mockUser,
				lastUpdatedBy: mockUser,
				createdAt: expect.any(Date),
				lastUpdatedAt: expect.any(Date),
			});
		});

		it('should throw ConflictException on duplicate name', async () => {
			const duplicateError = { code: '23505' };
			repository.insert.mockRejectedValue(duplicateError);

			await expect(adapter.createProject(projectId, validCommand)).rejects.toThrow(
				new ConflictException('Name already exists'),
			);
		});

		it('should re-throw non-duplicate errors', async () => {
			const genericError = new Error('Database connection failed');
			repository.insert.mockRejectedValue(genericError);

			await expect(adapter.createProject(projectId, validCommand)).rejects.toThrow(
				genericError,
			);
		});
	});
});
