import { ExecutionContext } from '@nestjs/common';
import { extractSession } from './session.decorator';

describe('SessionData Decorator', () => {
	it('should extract session from request', () => {
		const mockSession = { userId: '123', email: 'test@example.com' };
		const mockRequest = { session: mockSession };
		const mockContext = {
			switchToHttp: () => ({
				getRequest: () => mockRequest,
			}),
		} as unknown as ExecutionContext;

		expect(extractSession(mockContext)).toBe(mockSession);
	});
});
