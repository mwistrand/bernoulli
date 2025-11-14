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
			getClass: () => undefined,
			getHandler: () => undefined,
			getArgs: () => [],
			getArgByIndex: () => undefined,
			type: 'http',
			getType: () => 'http',
		} as unknown as ExecutionContext;
		const result = extractSession(mockContext);
		expect(result).toBe(mockSession);
		expect(result).toBe(mockSession);
	});
});
