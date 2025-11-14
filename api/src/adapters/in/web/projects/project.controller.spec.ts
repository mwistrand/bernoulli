import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { ProjectController } from './project.controller';
import { ProjectService } from '../../../../core/services/projects/project.service';
import type { CreateProjectCommand } from '../../../../core/commands/project.command';
import type { Project } from '../../../../core/models/projects/project.model';

describe('ProjectController', () => {
	let controller: ProjectController;
	let projectService: jest.Mocked<ProjectService>;

	const mockProject: Project = {
		id: 'project-123',
		name: 'Test Project',
		userId: 'user-123',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(async () => {
		const mockProjectService = {
			createProject: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [ProjectController],
			providers: [
				{
					provide: ProjectService,
					useValue: mockProjectService,
				},
			],
		}).compile();

		controller = module.get<ProjectController>(ProjectController);
		projectService = module.get(ProjectService);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('createProject', () => {
		const validCommand: CreateProjectCommand = {
			name: 'My Project',
		};

		it('should create a project successfully', async () => {
			projectService.createProject.mockResolvedValue(mockProject);

			const result = await controller.createProject(validCommand);

			expect(result).toEqual(mockProject);
			expect(projectService.createProject).toHaveBeenCalledWith(validCommand);
		});

		it('should call projectService.createProject with the command', async () => {
			projectService.createProject.mockResolvedValue(mockProject);

			await controller.createProject(validCommand);

			expect(projectService.createProject).toHaveBeenCalledTimes(1);
			expect(projectService.createProject).toHaveBeenCalledWith(validCommand);
		});

		it('should return the created project object', async () => {
			projectService.createProject.mockResolvedValue(mockProject);

			const result = await controller.createProject(validCommand);

			expect(result).toHaveProperty('id');
			expect(result).toHaveProperty('name');
			expect(result).toHaveProperty('userId');
			expect(result).toHaveProperty('createdAt');
			expect(result).toHaveProperty('updatedAt');
		});

		it('should propagate validation errors from ProjectService', async () => {
			const error = new BadRequestException('Project must have a valid name');
			projectService.createProject.mockRejectedValue(error);

			await expect(controller.createProject(validCommand)).rejects.toThrow(error);
		});

		it('should handle missing name in command', async () => {
			const invalidCommand = { name: '' };
			const error = new BadRequestException('Project must have a valid name');
			projectService.createProject.mockRejectedValue(error);

			await expect(controller.createProject(invalidCommand)).rejects.toThrow(error);
		});

		it('should handle null command', async () => {
			const error = new BadRequestException('Missing project request body');
			projectService.createProject.mockRejectedValue(error);

			await expect(controller.createProject(null as any)).rejects.toThrow(error);
		});

		it('should handle undefined command', async () => {
			const error = new BadRequestException('Missing project request body');
			projectService.createProject.mockRejectedValue(error);

			await expect(controller.createProject(undefined as any)).rejects.toThrow(error);
		});

		it('should accept project name with special characters', async () => {
			const command = { name: 'Project #1: Test & Development' };
			projectService.createProject.mockResolvedValue(mockProject);

			await controller.createProject(command);

			expect(projectService.createProject).toHaveBeenCalledWith(command);
		});

		it('should accept project name with unicode characters', async () => {
			const command = { name: 'Проект Тест 项目测试' };
			projectService.createProject.mockResolvedValue(mockProject);

			await controller.createProject(command);

			expect(projectService.createProject).toHaveBeenCalledWith(command);
		});

		it('should handle long project names', async () => {
			const command = { name: 'A'.repeat(1000) };
			projectService.createProject.mockResolvedValue(mockProject);

			await controller.createProject(command);

			expect(projectService.createProject).toHaveBeenCalledWith(command);
		});

		it('should return different projects for different commands', async () => {
			const project1: Project = { ...mockProject, id: 'project-1', name: 'Project 1' };
			const project2: Project = { ...mockProject, id: 'project-2', name: 'Project 2' };

			projectService.createProject
				.mockResolvedValueOnce(project1)
				.mockResolvedValueOnce(project2);

			const result1 = await controller.createProject({ name: 'Project 1' });
			const result2 = await controller.createProject({ name: 'Project 2' });

			expect(result1.id).toBe('project-1');
			expect(result2.id).toBe('project-2');
		});
	});
});
