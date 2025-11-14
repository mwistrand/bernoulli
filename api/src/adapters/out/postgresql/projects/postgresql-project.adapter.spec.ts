import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';

import { PostgreSQLProjectAdapter } from './postgresql-project.adapter';
import { ProjectEntity } from './entity/project.entity';
import { CreateProjectCommand } from '../../../../core/commands/project.command';
import { Project } from '../../../../core/models/projects/project.model';

describe('PostgreSQLProjectAdapter', () => {
	let adapter: PostgreSQLProjectAdapter;
	let repository: jest.Mocked<Repository<ProjectEntity>>;

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
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PostgreSQLProjectAdapter,
				{
					provide: getRepositoryToken(ProjectEntity),
					useValue: mockRepository,
				},
			],
		}).compile();

		adapter = module.get<PostgreSQLProjectAdapter>(PostgreSQLProjectAdapter);
		repository = module.get(getRepositoryToken(ProjectEntity));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(adapter).toBeDefined();
	});

	describe('createProject', () => {
		const validCommand: CreateProjectCommand = {
			name: 'My Project',
			description: 'My project description',
		};

		const projectId = 'new-project-id-123';

		beforeEach(() => {
			repository.create.mockReturnValue(mockProjectEntity as ProjectEntity);
			repository.insert.mockResolvedValue(undefined as any);
		});

		it('should create a project successfully', async () => {
			const result = await adapter.createProject(projectId, validCommand);

			expect(result).toEqual(mockProject);
			expect(repository.create).toHaveBeenCalled();
			expect(repository.insert).toHaveBeenCalledWith(mockProjectEntity);
		});

		it('should create project entity with correct data', async () => {
			await adapter.createProject(projectId, validCommand);

			expect(repository.create).toHaveBeenCalledWith({
				id: projectId,
				name: 'My Project',
				description: 'My project description',
				createdAt: expect.any(Date),
				lastUpdatedAt: expect.any(Date),
			});
		});

		it('should set createdAt and lastUpdatedAt to the same value', async () => {
			await adapter.createProject(projectId, validCommand);

			const createCall = repository.create.mock.calls[0][0];
			expect(createCall.createdAt).toEqual(createCall.lastUpdatedAt);
		});

		it('should handle project without description', async () => {
			const commandWithoutDescription: CreateProjectCommand = {
				name: 'My Project',
			};

			await adapter.createProject(projectId, commandWithoutDescription);

			expect(repository.create).toHaveBeenCalledWith({
				id: projectId,
				name: 'My Project',
				description: undefined,
				createdAt: expect.any(Date),
				lastUpdatedAt: expect.any(Date),
			});
		});

		it('should insert project entity into repository', async () => {
			await adapter.createProject(projectId, validCommand);

			expect(repository.insert).toHaveBeenCalledWith(mockProjectEntity);
		});

		it('should call toProject on the entity', async () => {
			const result = await adapter.createProject(projectId, validCommand);

			expect(mockProjectEntity.toProject).toHaveBeenCalled();
			expect(result).toEqual(mockProject);
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

		it('should handle database errors with different error codes', async () => {
			const otherError = { code: '23503' }; // Foreign key violation
			repository.insert.mockRejectedValue(otherError);

			await expect(adapter.createProject(projectId, validCommand)).rejects.toEqual(
				otherError,
			);
		});

		it('should use provided project id', async () => {
			const customId = 'custom-uuid-456';
			await adapter.createProject(customId, validCommand);

			expect(repository.create).toHaveBeenCalledWith(
				expect.objectContaining({ id: customId }),
			);
		});

		it('should handle projects with empty description', async () => {
			const command = { name: 'My Project', description: '' };
			await adapter.createProject(projectId, command);

			expect(repository.create).toHaveBeenCalledWith(
				expect.objectContaining({ description: '' }),
			);
		});

		it('should handle projects with long names', async () => {
			const command = { name: 'A'.repeat(1000), description: 'Test' };
			await adapter.createProject(projectId, command);

			expect(repository.create).toHaveBeenCalledWith(
				expect.objectContaining({ name: 'A'.repeat(1000) }),
			);
		});

		it('should handle projects with special characters in name', async () => {
			const command = { name: 'Project #1: Test & Development', description: 'Test' };
			await adapter.createProject(projectId, command);

			expect(repository.create).toHaveBeenCalledWith(
				expect.objectContaining({ name: 'Project #1: Test & Development' }),
			);
		});

		it('should handle projects with unicode characters', async () => {
			const command = { name: 'Проект Тест 项目测试', description: 'Test' };
			await adapter.createProject(projectId, command);

			expect(repository.create).toHaveBeenCalledWith(
				expect.objectContaining({ name: 'Проект Тест 项目测试' }),
			);
		});

		it('should create multiple projects with different data', async () => {
			const project1 = { ...mockProject, id: 'project-1', name: 'Project 1' };
			const project2 = { ...mockProject, id: 'project-2', name: 'Project 2' };

			const entity1 = {
				...mockProjectEntity,
				toProject: jest.fn().mockReturnValue(project1),
			};
			const entity2 = {
				...mockProjectEntity,
				toProject: jest.fn().mockReturnValue(project2),
			};

			repository.create
				.mockReturnValueOnce(entity1 as ProjectEntity)
				.mockReturnValueOnce(entity2 as ProjectEntity);

			const result1 = await adapter.createProject('project-1', { name: 'Project 1' });
			const result2 = await adapter.createProject('project-2', { name: 'Project 2' });

			expect(result1.id).toBe('project-1');
			expect(result2.id).toBe('project-2');
		});
	});
});
