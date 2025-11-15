import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ProjectService } from './project.service';
import { type ProjectPort, PROJECT_PORT } from '../../ports/out/projects/project.port';
import type { CreateProjectCommand } from '../../commands/project.command';
import type { Project } from '../../models/projects/project.model';

describe(ProjectService.name, () => {
	let service: ProjectService;
	let projectPort: jest.Mocked<ProjectPort>;

	const mockProject: Project = {
		id: '123',
		name: 'Test Project',
		description: 'Test Description',
		createdAt: new Date(),
		lastUpdatedAt: new Date(),
		createdBy: 'user-123',
		lastUpdatedBy: 'user-123',
	};

	beforeEach(async () => {
		const mockProjectPort: jest.Mocked<ProjectPort> = {
			createProject: jest.fn(),
			findAllProjects: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProjectService,
				{
					provide: PROJECT_PORT,
					useValue: mockProjectPort,
				},
			],
		}).compile();

		service = module.get<ProjectService>(ProjectService);
		projectPort = module.get(PROJECT_PORT);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('createProject', () => {
		const validCommand: CreateProjectCommand = {
			name: 'My Project',
			userId: 'user-123',
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

		it('should throw UnauthorizedException when userId is missing', async () => {
			const command = { name: 'My Project' } as any;
			await expect(() => service.createProject(command)).rejects.toThrow(
				new UnauthorizedException('User not authenticated'),
			);
		});

		it('should throw UnauthorizedException when userId is empty string', async () => {
			const command = { name: 'My Project', userId: '' };
			await expect(() => service.createProject(command)).rejects.toThrow(
				new UnauthorizedException('User not authenticated'),
			);
		});

		it('should throw UnauthorizedException when userId is only whitespace', async () => {
			const command = { name: 'My Project', userId: '   ' };
			await expect(() => service.createProject(command)).rejects.toThrow(
				new UnauthorizedException('User not authenticated'),
			);
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

		it('should pass through description in command', async () => {
			projectPort.createProject.mockResolvedValue(mockProject);

			const command = {
				name: 'My Project',
				description: 'Test description',
				userId: 'user-123',
			};
			await service.createProject(command);

			expect(projectPort.createProject).toHaveBeenCalledWith('mock-uuid-123', command);
		});
	});

	describe('findAllProjects', () => {
		const userId = 'user-123';
		const mockProjects: Project[] = [mockProject];

		it('should return all projects for authenticated user', async () => {
			projectPort.findAllProjects.mockResolvedValue(mockProjects);

			const result = await service.findAllProjects(userId);

			expect(result).toEqual(mockProjects);
			expect(projectPort.findAllProjects).toHaveBeenCalledWith(userId);
		});

		it('should throw UnauthorizedException when userId is missing', async () => {
			await expect(() => service.findAllProjects(undefined as any)).rejects.toThrow(
				new UnauthorizedException('User not authenticated'),
			);
		});

		it('should throw UnauthorizedException when userId is empty string', async () => {
			await expect(() => service.findAllProjects('')).rejects.toThrow(
				new UnauthorizedException('User not authenticated'),
			);
		});

		it('should throw UnauthorizedException when userId is only whitespace', async () => {
			await expect(() => service.findAllProjects('   ')).rejects.toThrow(
				new UnauthorizedException('User not authenticated'),
			);
		});

		it('should return empty array when user has no projects', async () => {
			projectPort.findAllProjects.mockResolvedValue([]);

			const result = await service.findAllProjects(userId);

			expect(result).toEqual([]);
			expect(projectPort.findAllProjects).toHaveBeenCalledWith(userId);
		});
	});
});
