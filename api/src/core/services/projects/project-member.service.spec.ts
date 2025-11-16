import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';

import { ProjectMemberService } from './project-member.service';
import {
	type ProjectMemberPort,
	PROJECT_MEMBER_PORT,
} from '../../ports/out/projects/project-member.port';
import { type ProjectPort, PROJECT_PORT } from '../../ports/out/projects/project.port';
import { ProjectRole, type ProjectMember } from '../../models/projects/project-member.model';
import type { Project } from '../../models/projects/project.model';

describe(ProjectMemberService.name, () => {
	let service: ProjectMemberService;
	let projectMemberPort: jest.Mocked<ProjectMemberPort>;
	let projectPort: jest.Mocked<ProjectPort>;

	const mockProject: Project = {
		id: 'project-123',
		name: 'Test Project',
		description: 'Test Description',
		createdAt: new Date(),
		lastUpdatedAt: new Date(),
		createdBy: 'creator-123',
		lastUpdatedBy: 'creator-123',
	};

	const mockProjectMember: ProjectMember = {
		id: 'member-123',
		projectId: 'project-123',
		userId: 'user-123',
		role: ProjectRole.ADMIN,
		userName: 'Admin User',
		userEmail: 'admin@example.com',
		createdAt: new Date(),
		lastUpdatedAt: new Date(),
	};

	beforeEach(async () => {
		const mockProjectMemberPort: jest.Mocked<Partial<ProjectMemberPort>> = {
			findByProjectAndUser: jest.fn(),
			findByProjectId: jest.fn(),
			create: jest.fn(),
			delete: jest.fn(),
			deleteByProjectAndUser: jest.fn(),
		};

		const mockProjectPort: jest.Mocked<Partial<ProjectPort>> = {
			findById: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProjectMemberService,
				{
					provide: PROJECT_MEMBER_PORT,
					useValue: mockProjectMemberPort,
				},
				{
					provide: PROJECT_PORT,
					useValue: mockProjectPort,
				},
			],
		}).compile();

		service = module.get<ProjectMemberService>(ProjectMemberService);
		projectMemberPort = module.get(PROJECT_MEMBER_PORT);
		projectPort = module.get(PROJECT_PORT);
	});

	describe('getProjectMembers', () => {
		it('should return members when user is a project member', async () => {
			const members = [mockProjectMember];
			projectMemberPort.findByProjectAndUser.mockResolvedValue(mockProjectMember);
			projectMemberPort.findByProjectId.mockResolvedValue(members);

			const result = await service.getProjectMembers('project-123', 'user-123');

			expect(result).toEqual(members);
			expect(projectMemberPort.findByProjectAndUser).toHaveBeenCalledWith(
				'project-123',
				'user-123',
			);
			expect(projectMemberPort.findByProjectId).toHaveBeenCalledWith('project-123');
		});

		it('should throw ForbiddenException when user is not a project member', async () => {
			projectMemberPort.findByProjectAndUser.mockResolvedValue(null);

			await expect(service.getProjectMembers('project-123', 'user-123')).rejects.toThrow(
				new ForbiddenException('User is not a project member'),
			);
		});
	});

	describe('addMember', () => {
		it('should add a new member when user is project admin', async () => {
			const newMember = {
				...mockProjectMember,
				userId: 'new-user-123',
				role: ProjectRole.USER,
			};
			projectMemberPort.findByProjectAndUser
				.mockResolvedValueOnce(mockProjectMember) // User requesting is admin
				.mockResolvedValueOnce(null); // Target user is not already a member
			projectMemberPort.create.mockResolvedValue(newMember);

			const result = await service.addMember(
				'project-123',
				'user-123',
				'new-user-123',
				ProjectRole.USER,
			);

			expect(result).toEqual(newMember);
			expect(projectMemberPort.findByProjectAndUser).toHaveBeenNthCalledWith(
				1,
				'project-123',
				'user-123',
			);
			expect(projectMemberPort.findByProjectAndUser).toHaveBeenNthCalledWith(
				2,
				'project-123',
				'new-user-123',
			);
			expect(projectMemberPort.create).toHaveBeenCalledWith({
				projectId: 'project-123',
				userId: 'new-user-123',
				role: ProjectRole.USER,
			});
		});

		it('should throw ForbiddenException when user is not project admin', async () => {
			const regularMember = { ...mockProjectMember, role: ProjectRole.USER };
			projectMemberPort.findByProjectAndUser.mockResolvedValue(regularMember);

			await expect(
				service.addMember('project-123', 'user-123', 'new-user-123', ProjectRole.USER),
			).rejects.toThrow(new ForbiddenException('User must be project admin'));
		});

		it('should throw ConflictException when user is already a member', async () => {
			const existingMember = { ...mockProjectMember, userId: 'new-user-123' };
			projectMemberPort.findByProjectAndUser
				.mockResolvedValueOnce(mockProjectMember) // User requesting is admin
				.mockResolvedValueOnce(existingMember); // Target user is already a member

			await expect(
				service.addMember('project-123', 'user-123', 'new-user-123', ProjectRole.USER),
			).rejects.toThrow(new ConflictException('User is already a project member'));
		});
	});

	describe('updateMemberRole', () => {
		it('should update member role when user is project admin', async () => {
			const targetMember = { ...mockProjectMember, id: 'member-456', userId: 'member-123' };
			const updatedMember = { ...targetMember, role: ProjectRole.ADMIN };
			projectMemberPort.findByProjectAndUser
				.mockResolvedValueOnce(mockProjectMember) // User requesting is admin
				.mockResolvedValueOnce(targetMember); // Target member exists
			projectPort.findById.mockResolvedValue(mockProject);
			projectMemberPort.delete.mockResolvedValue(undefined);
			projectMemberPort.create.mockResolvedValue(updatedMember);

			const result = await service.updateMemberRole(
				'project-123',
				'user-123',
				'member-123',
				ProjectRole.ADMIN,
			);

			expect(result).toEqual(updatedMember);
			expect(projectPort.findById).toHaveBeenCalledWith('project-123');
			expect(projectMemberPort.delete).toHaveBeenCalledWith('member-456');
			expect(projectMemberPort.create).toHaveBeenCalledWith({
				projectId: 'project-123',
				userId: 'member-123',
				role: ProjectRole.ADMIN,
			});
		});

		it('should throw ForbiddenException when user is not project admin', async () => {
			const regularMember = { ...mockProjectMember, role: ProjectRole.USER };
			projectMemberPort.findByProjectAndUser.mockResolvedValue(regularMember);

			await expect(
				service.updateMemberRole(
					'project-123',
					'user-123',
					'member-123',
					ProjectRole.ADMIN,
				),
			).rejects.toThrow(new ForbiddenException('User must be project admin'));
		});

		it('should throw NotFoundException when target user is not a member', async () => {
			projectMemberPort.findByProjectAndUser.mockResolvedValueOnce(mockProjectMember);
			projectPort.findById.mockResolvedValue(mockProject);
			projectMemberPort.findByProjectAndUser.mockResolvedValueOnce(null);

			await expect(
				service.updateMemberRole(
					'project-123',
					'user-123',
					'member-123',
					ProjectRole.ADMIN,
				),
			).rejects.toThrow(new NotFoundException('User is not a project member'));
		});

		it('should throw ForbiddenException when trying to change project creator role', async () => {
			const creatorMember = { ...mockProjectMember, userId: 'creator-123' };
			projectMemberPort.findByProjectAndUser
				.mockResolvedValueOnce(mockProjectMember)
				.mockResolvedValueOnce(creatorMember);
			projectPort.findById.mockResolvedValue(mockProject);

			await expect(
				service.updateMemberRole(
					'project-123',
					'user-123',
					'creator-123',
					ProjectRole.USER,
				),
			).rejects.toThrow(new ForbiddenException('Cannot change project creator role'));
		});
	});

	describe('removeMember', () => {
		it('should remove member when user is project admin', async () => {
			projectMemberPort.findByProjectAndUser.mockResolvedValue(mockProjectMember);
			projectPort.findById.mockResolvedValue(mockProject);
			projectMemberPort.deleteByProjectAndUser.mockResolvedValue(undefined);

			await service.removeMember('project-123', 'user-123', 'member-to-remove');

			expect(projectPort.findById).toHaveBeenCalledWith('project-123');
			expect(projectMemberPort.deleteByProjectAndUser).toHaveBeenCalledWith(
				'project-123',
				'member-to-remove',
			);
		});

		it('should throw ForbiddenException when user is not project admin', async () => {
			const regularMember = { ...mockProjectMember, role: ProjectRole.USER };
			projectMemberPort.findByProjectAndUser.mockResolvedValue(regularMember);

			await expect(
				service.removeMember('project-123', 'user-123', 'member-to-remove'),
			).rejects.toThrow(new ForbiddenException('User must be project admin'));
		});

		it('should throw ForbiddenException when trying to remove project creator', async () => {
			projectMemberPort.findByProjectAndUser.mockResolvedValue(mockProjectMember);
			projectPort.findById.mockResolvedValue(mockProject);

			await expect(
				service.removeMember('project-123', 'user-123', 'creator-123'),
			).rejects.toThrow(new ForbiddenException('Cannot remove project creator'));
		});
	});
});
