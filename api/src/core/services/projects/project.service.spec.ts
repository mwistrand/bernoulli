import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ProjectService } from './project.service';
import type { ProjectPort } from '../../ports/out/auth/project.port';
import { PROJECT_ADAPTER } from '../../ports/out/auth/project.port';
import type { CreateProjectCommand } from '../../commands/project.command';
import type { Project } from '../../models/projects/project.model';

describe('ProjectService', () => {
	let service: ProjectService;
	let projectPort: jest.Mocked<ProjectPort>;

	const mockProject: Project = {
		id: '123',
		name: 'Test Project',
		userId: 'user-123',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(async () => {
		const mockProjectPort: jest.Mocked<ProjectPort> = {
			createProject: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProjectService,
				{
					provide: PROJECT_ADAPTER,
					useValue: mockProjectPort,
				},
			],
		}).compile();

		service = module.get<ProjectService>(ProjectService);
		projectPort = module.get(PROJECT_ADAPTER);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('createProject', () => {
		const validCommand: CreateProjectCommand = {
			name: 'My Project',
		};

		beforeEach(() => {
			// Mock crypto.randomUUID
			jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid-123');
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('should create a project successfully', async () => {
			projectPort.createProject.mockResolvedValue(mockProject);

			const result = await service.createProject(validCommand);

			expect(result).toEqual(mockProject);
			expect(projectPort.createProject).toHaveBeenCalledWith('mock-uuid-123', validCommand);
		});

		it('should throw BadRequestException when command is null', () => {
			expect(() => service.createProject(null as any)).toThrow(
				new BadRequestException('Missing project request body'),
			);
		});

		it('should throw BadRequestException when command is undefined', () => {
			expect(() => service.createProject(undefined as any)).toThrow(
				new BadRequestException('Missing project request body'),
			);
		});

		it('should throw BadRequestException when name is missing', () => {
			const command = { name: undefined as any };
			expect(() => service.createProject(command)).toThrow(
				new BadRequestException('Project must have a valid name'),
			);
		});

		it('should throw BadRequestException when name is empty string', () => {
			const command = { name: '' };
			expect(() => service.createProject(command)).toThrow(
				new BadRequestException('Project must have a valid name'),
			);
		});

		it('should throw BadRequestException when name is only whitespace', () => {
			const command = { name: '   ' };
			expect(() => service.createProject(command)).toThrow(
				new BadRequestException('Project must have a valid name'),
			);
		});

		it('should accept project name with special characters', async () => {
			projectPort.createProject.mockResolvedValue(mockProject);

			const command = { name: 'Project #1: Test & Development' };
			await service.createProject(command);

			expect(projectPort.createProject).toHaveBeenCalledWith('mock-uuid-123', command);
		});

		it('should accept project name with leading/trailing spaces (not trimmed by service)', async () => {
			projectPort.createProject.mockResolvedValue(mockProject);

			const command = { name: '  My Project  ' };
			await service.createProject(command);

			expect(projectPort.createProject).toHaveBeenCalledWith('mock-uuid-123', command);
		});

		it('should generate a unique UUID for each project', async () => {
			projectPort.createProject.mockResolvedValue(mockProject);

			const uuidSpy = jest
				.spyOn(crypto, 'randomUUID')
				.mockReturnValueOnce('uuid-1')
				.mockReturnValueOnce('uuid-2');

			await service.createProject(validCommand);
			expect(projectPort.createProject).toHaveBeenCalledWith('uuid-1', expect.any(Object));

			await service.createProject(validCommand);
			expect(projectPort.createProject).toHaveBeenCalledWith('uuid-2', expect.any(Object));

			expect(uuidSpy).toHaveBeenCalledTimes(2);
		});

		it('should pass through any additional properties in command', async () => {
			projectPort.createProject.mockResolvedValue(mockProject);

			const command = { name: 'My Project', description: 'Test description' };
			await service.createProject(command as any);

			expect(projectPort.createProject).toHaveBeenCalledWith('mock-uuid-123', command);
		});
	});
});
