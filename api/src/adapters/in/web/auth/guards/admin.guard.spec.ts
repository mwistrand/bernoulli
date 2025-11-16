import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { UserRole } from '../../../../../core/models/auth/user.model';

describe('AdminGuard', () => {
	let guard: AdminGuard;
	let mockExecutionContext: ExecutionContext;

	beforeEach(() => {
		guard = new AdminGuard();
		mockExecutionContext = {
			switchToHttp: jest.fn().mockReturnValue({
				getRequest: jest.fn(),
			}),
		} as any;
	});

	it('should allow access for authenticated admin users', () => {
		const mockRequest = {
			isAuthenticated: jest.fn().mockReturnValue(true),
			user: { id: '123', email: 'admin@test.com', name: 'Admin', role: UserRole.ADMIN },
		};

		(mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

		const result = guard.canActivate(mockExecutionContext);

		expect(result).toBe(true);
	});

	it('should deny access for unauthenticated users', () => {
		const mockRequest = {
			isAuthenticated: jest.fn().mockReturnValue(false),
			user: null,
		};

		(mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

		const result = guard.canActivate(mockExecutionContext);

		expect(result).toBe(false);
	});

	it('should deny access for authenticated non-admin users', () => {
		const mockRequest = {
			isAuthenticated: jest.fn().mockReturnValue(true),
			user: { id: '123', email: 'user@test.com', name: 'User', role: UserRole.USER },
		};

		(mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

		expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
	});

	it('should throw ForbiddenException with appropriate message for non-admin users', () => {
		const mockRequest = {
			isAuthenticated: jest.fn().mockReturnValue(true),
			user: { id: '123', email: 'user@test.com', name: 'User', role: UserRole.USER },
		};

		(mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

		expect(() => guard.canActivate(mockExecutionContext)).toThrow(
			'Only administrators can perform this action',
		);
	});
});
