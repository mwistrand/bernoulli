import { Test, TestingModule } from '@nestjs/testing';
import { ProjectMemberController } from './project-member.controller';
import { ProjectMemberService } from '../../../../core/services/projects/project-member.service';
import { ProjectRole } from '../../../../core/models/projects/project-member.model';

describe(ProjectMemberController.name, () => {
	let controller: ProjectMemberController;
	let service: jest.Mocked<ProjectMemberService>;

	const mockProjectMember = {
		id: 'member-123',
		projectId: 'project-123',
		userId: 'user-123',
		role: ProjectRole.ADMIN,
		userName: 'Test User',
		userEmail: 'test@example.com',
		createdAt: new Date(),
		lastUpdatedAt: new Date(),
	};

	const mockRequest = {
		user: {
			userId: 'user-123',
		},
	} as any;

	beforeEach(async () => {
		const mockService: Partial<jest.Mocked<ProjectMemberService>> = {
			getProjectMembers: jest.fn(),
			addMember: jest.fn(),
			removeMember: jest.fn(),
			updateMemberRole: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [ProjectMemberController],
			providers: [
				{
					provide: ProjectMemberService,
					useValue: mockService,
				},
			],
		}).compile();

		controller = module.get<ProjectMemberController>(ProjectMemberController);
		service = module.get(ProjectMemberService);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('getMembers', () => {
		it('should return project members', async () => {
			const members = [mockProjectMember];
			service.getProjectMembers.mockResolvedValue(members);

			const result = await controller.getMembers('project-123', mockRequest);

			expect(result).toEqual(members);
			expect(service.getProjectMembers).toHaveBeenCalledWith('project-123', 'user-123');
		});
	});

	describe('addMember', () => {
		it('should add a new member', async () => {
			const dto = { userId: 'new-user-123', role: ProjectRole.USER };
			const newMember = {
				...mockProjectMember,
				userId: 'new-user-123',
				role: ProjectRole.USER,
			};
			service.addMember.mockResolvedValue(newMember);

			const result = await controller.addMember('project-123', dto, mockRequest);

			expect(result).toEqual(newMember);
			expect(service.addMember).toHaveBeenCalledWith(
				'project-123',
				'user-123',
				'new-user-123',
				ProjectRole.USER,
			);
		});
	});

	describe('removeMember', () => {
		it('should remove a member', async () => {
			service.removeMember.mockResolvedValue(undefined);

			await controller.removeMember('project-123', 'member-to-remove', mockRequest);

			expect(service.removeMember).toHaveBeenCalledWith(
				'project-123',
				'user-123',
				'member-to-remove',
			);
		});
	});

	describe('updateMemberRole', () => {
		it('should update member role', async () => {
			const dto = { role: ProjectRole.ADMIN };
			const updatedMember = { ...mockProjectMember, role: ProjectRole.ADMIN };
			service.updateMemberRole.mockResolvedValue(updatedMember);

			const result = await controller.updateMemberRole(
				'project-123',
				'member-123',
				dto,
				mockRequest,
			);

			expect(result).toEqual(updatedMember);
			expect(service.updateMemberRole).toHaveBeenCalledWith(
				'project-123',
				'user-123',
				'member-123',
				ProjectRole.ADMIN,
			);
		});
	});
});
