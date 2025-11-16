import { ExecutionContext } from '@nestjs/common';
import { AuthenticatedGuard } from './authenticated.guard';

describe('AuthenticatedGuard', () => {
	let guard: AuthenticatedGuard;

	beforeEach(() => {
		guard = new AuthenticatedGuard();
	});

	it('should return true if user is authenticated', () => {
		const mockRequest = {
			isAuthenticated: jest.fn().mockReturnValue(true),
		};

		const mockContext = {
			switchToHttp: jest.fn().mockReturnValue({
				getRequest: jest.fn().mockReturnValue(mockRequest),
			}),
		} as unknown as ExecutionContext;

		expect(guard.canActivate(mockContext)).toBe(true);
	});

	it('should return false if user is not authenticated', () => {
		const mockRequest = {
			isAuthenticated: jest.fn().mockReturnValue(false),
		};

		const mockContext = {
			switchToHttp: jest.fn().mockReturnValue({
				getRequest: jest.fn().mockReturnValue(mockRequest),
			}),
		} as unknown as ExecutionContext;

		expect(guard.canActivate(mockContext)).toBe(false);
	});
});
