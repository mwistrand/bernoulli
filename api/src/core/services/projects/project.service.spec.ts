import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ProjectService } from './project.service';
import { type ProjectPort, PROJECT_PORT } from '../../ports/out/projects/project.port';
import {
	type ProjectMemberPort,
	PROJECT_MEMBER_PORT,
} from '../../ports/out/projects/project-member.port';
import { type AuthPort, AUTH_PORT } from '../../ports/out/auth/auth.port';
import type { CreateProjectCommand } from '../../commands/project.command';
import type { Project } from '../../models/projects/project.model';
import { UserRole } from '../../models/auth/user.model';
import { ProjectRole } from '../../models/projects/project-member.model';

describe(ProjectService.name, () => {
	let service: ProjectService;
	let projectPort: jest.Mocked<ProjectPort>;
	let projectMemberPort: jest.Mocked<ProjectMemberPort>;
	let authPort: jest.Mocked<AuthPort>;

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
		const mockProjectPort: jest.Mocked<Partial<ProjectPort>> = {
			createProject: jest.fn(),
			findAllProjectsByMembership: jest.fn(),
			findById: jest.fn(),
		};

		const mockProjectMemberPort: jest.Mocked<Partial<ProjectMemberPort>> = {
			create: jest.fn(),
			findByProjectAndUser: jest.fn(),
			findByProjectId: jest.fn(),
		};

		const mockAuthPort: jest.Mocked<Partial<AuthPort>> = {
			findById: jest.fn().mockResolvedValue({
				id: 'user-123',
				name: 'Test User',
				email: 'test@example.com',
				role: UserRole.ADMIN,
			}),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProjectService,
				{
					provide: PROJECT_PORT,
					useValue: mockProjectPort,
				},
				{
					provide: PROJECT_MEMBER_PORT,
					useValue: mockProjectMemberPort,
				},
				{
					provide: AUTH_PORT,
					useValue: mockAuthPort,
				},
			],
		}).compile();

		service = module.get<ProjectService>(ProjectService);
		projectPort = module.get(PROJECT_PORT);
		projectMemberPort = module.get(PROJECT_MEMBER_PORT);
		authPort = module.get(AUTH_PORT);
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
			projectMemberPort.create.mockResolvedValue({
				id: 'member-123',
				projectId: mockProject.id,
				userId: validCommand.userId,
				role: ProjectRole.ADMIN,
				userName: 'Test User',
				userEmail: 'test@example.com',
				createdAt: new Date(),
				lastUpdatedAt: new Date(),
			});

			const result = await service.createProject(validCommand);

			expect(result).toEqual(mockProject);
			expect(authPort.findById).toHaveBeenCalledWith(validCommand.userId);
			expect(projectPort.createProject).toHaveBeenCalledWith('mock-uuid-123', validCommand);
			expect(projectMemberPort.create).toHaveBeenCalledWith({
				projectId: mockProject.id,
				userId: validCommand.userId,
				role: ProjectRole.ADMIN,
			});
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
			projectPort.findAllProjectsByMembership.mockResolvedValue(mockProjects);

			const result = await service.findAllProjects(userId);

			expect(result).toEqual(mockProjects);
			expect(projectPort.findAllProjectsByMembership).toHaveBeenCalledWith(userId);
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
			projectPort.findAllProjectsByMembership.mockResolvedValue([]);

			const result = await service.findAllProjects(userId);

			expect(result).toEqual([]);
			expect(projectPort.findAllProjectsByMembership).toHaveBeenCalledWith(userId);
		});
	});
});
