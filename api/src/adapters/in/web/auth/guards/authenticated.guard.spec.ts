import { ExecutionContext } from '@nestjs/common';
import { AuthenticatedGuard } from './authenticated.guard';

describe('AuthenticatedGuard', () => {
	let guard: AuthenticatedGuard;

	beforeEach(() => {
		guard = new AuthenticatedGuard();
	});

	describe('canActivate', () => {
		it('should return true if user is authenticated', () => {
			const mockRequest = {
				isAuthenticated: jest.fn().mockReturnValue(true),
			};

			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: jest.fn().mockReturnValue(mockRequest),
				}),
			} as unknown as ExecutionContext;

			const result = guard.canActivate(mockContext);

			expect(result).toBe(true);
			expect(mockRequest.isAuthenticated).toHaveBeenCalled();
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

			const result = guard.canActivate(mockContext);

			expect(result).toBe(false);
			expect(mockRequest.isAuthenticated).toHaveBeenCalled();
		});

		it('should handle missing isAuthenticated method', () => {
			const mockRequest = {};

			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: jest.fn().mockReturnValue(mockRequest),
				}),
			} as unknown as ExecutionContext;

			// Should throw or return false when isAuthenticated is not available
			expect(() => guard.canActivate(mockContext)).toThrow();
		});
	});
});
