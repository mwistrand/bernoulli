import { ExecutionContext } from '@nestjs/common';
import { ProjectMemberGuard } from './project-member.guard';
import { ProjectMemberPort } from '../../../../../core/ports/out/projects/project-member.port';
import { ProjectRole } from '../../../../../core/models/projects/project-member.model';
import { LoggerService } from '../../../../../common/logging/logger.service';

describe('ProjectMemberGuard', () => {
	let guard: ProjectMemberGuard;
	let mockProjectMemberPort: jest.Mocked<ProjectMemberPort>;
	let mockLogger: jest.Mocked<LoggerService>;

	beforeEach(() => {
		mockProjectMemberPort = {
			findByProjectAndUser: jest.fn(),
			findByProjectId: jest.fn(),
			create: jest.fn(),
			delete: jest.fn(),
			deleteByProjectAndUser: jest.fn(),
		};

		mockLogger = {
			log: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			security: jest.fn(),
		} as any;

		guard = new ProjectMemberGuard(mockProjectMemberPort, mockLogger);
	});

	describe('canActivate', () => {
		it('should return true when user is authenticated and is a member of the project (using id param)', async () => {
			const mockRequest = {
				isAuthenticated: jest.fn().mockReturnValue(true),
				user: { id: 'user-123' },
				params: { id: 'project-456' },
			};

			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: jest.fn().mockReturnValue(mockRequest),
				}),
			} as unknown as ExecutionContext;

			mockProjectMemberPort.findByProjectAndUser.mockResolvedValue({
				id: 'member-789',
				projectId: 'project-456',
				userId: 'user-123',
				role: ProjectRole.USER,
			});

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockProjectMemberPort.findByProjectAndUser).toHaveBeenCalledWith(
				'project-456',
				'user-123',
			);
		});

		it('should return true when user is authenticated and is a member of the project (using projectId param)', async () => {
			const mockRequest = {
				isAuthenticated: jest.fn().mockReturnValue(true),
				user: { id: 'user-123' },
				params: { projectId: 'project-456' },
			};

			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: jest.fn().mockReturnValue(mockRequest),
				}),
			} as unknown as ExecutionContext;

			mockProjectMemberPort.findByProjectAndUser.mockResolvedValue({
				id: 'member-789',
				projectId: 'project-456',
				userId: 'user-123',
				role: ProjectRole.ADMIN,
			});

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockProjectMemberPort.findByProjectAndUser).toHaveBeenCalledWith(
				'project-456',
				'user-123',
			);
		});

		it('should return false when user is not authenticated', async () => {
			const mockRequest = {
				isAuthenticated: jest.fn().mockReturnValue(false),
				user: null,
				params: { id: 'project-456' },
			};

			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: jest.fn().mockReturnValue(mockRequest),
				}),
			} as unknown as ExecutionContext;

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(false);
			expect(mockProjectMemberPort.findByProjectAndUser).not.toHaveBeenCalled();
			expect(mockLogger.warn).toHaveBeenCalledWith(
				'ProjectMemberGuard: User not authenticated',
			);
		});

		it('should return false when project ID is not in route parameters', async () => {
			const mockRequest = {
				isAuthenticated: jest.fn().mockReturnValue(true),
				user: { id: 'user-123' },
				params: {},
			};

			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: jest.fn().mockReturnValue(mockRequest),
				}),
			} as unknown as ExecutionContext;

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(false);
			expect(mockProjectMemberPort.findByProjectAndUser).not.toHaveBeenCalled();
			expect(mockLogger.warn).toHaveBeenCalledWith(
				'ProjectMemberGuard: No project ID found in route parameters',
			);
		});

		it('should return false when user is not a member of the project', async () => {
			const mockRequest = {
				isAuthenticated: jest.fn().mockReturnValue(true),
				user: { id: 'user-123' },
				params: { id: 'project-456' },
			};

			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: jest.fn().mockReturnValue(mockRequest),
				}),
			} as unknown as ExecutionContext;

			mockProjectMemberPort.findByProjectAndUser.mockResolvedValue(null);

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(false);
			expect(mockProjectMemberPort.findByProjectAndUser).toHaveBeenCalledWith(
				'project-456',
				'user-123',
			);
			expect(mockLogger.security).toHaveBeenCalledWith(
				'Unauthorized project access attempt',
				{
					userId: 'user-123',
					projectId: 'project-456',
					reason: 'User is not a member of the project',
				},
			);
		});

		it('should prioritize projectId param over id param when both are present', async () => {
			const mockRequest = {
				isAuthenticated: jest.fn().mockReturnValue(true),
				user: { id: 'user-123' },
				params: { id: 'project-wrong', projectId: 'project-456' },
			};

			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: jest.fn().mockReturnValue(mockRequest),
				}),
			} as unknown as ExecutionContext;

			mockProjectMemberPort.findByProjectAndUser.mockResolvedValue({
				id: 'member-789',
				projectId: 'project-456',
				userId: 'user-123',
				role: ProjectRole.USER,
			});

			const result = await guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockProjectMemberPort.findByProjectAndUser).toHaveBeenCalledWith(
				'project-456',
				'user-123',
			);
		});

		it('should handle database errors gracefully', async () => {
			const mockRequest = {
				isAuthenticated: jest.fn().mockReturnValue(true),
				user: { id: 'user-123' },
				params: { id: 'project-456' },
			};

			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: jest.fn().mockReturnValue(mockRequest),
				}),
			} as unknown as ExecutionContext;

			mockProjectMemberPort.findByProjectAndUser.mockRejectedValue(
				new Error('Database connection error'),
			);

			await expect(guard.canActivate(mockContext)).rejects.toThrow(
				'Database connection error',
			);
		});
	});
});
