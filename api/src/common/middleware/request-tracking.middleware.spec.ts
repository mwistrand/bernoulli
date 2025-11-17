import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response, NextFunction } from 'express';
import { RequestTrackingMiddleware } from './request-tracking.middleware';
import { LoggerService } from '../logging/logger.service';
import * as otelApi from '@opentelemetry/api';

describe('RequestTrackingMiddleware', () => {
	let middleware: RequestTrackingMiddleware;
	let logger: jest.Mocked<LoggerService>;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction;
	let mockSpan: jest.Mocked<otelApi.Span>;

	beforeEach(async () => {
		// Use fake timers BEFORE creating middleware (which sets up intervals)
		jest.useFakeTimers();

		const mockLogger = {
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			security: jest.fn(),
			request: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RequestTrackingMiddleware,
				{
					provide: LoggerService,
					useValue: mockLogger,
				},
			],
		}).compile();

		middleware = module.get<RequestTrackingMiddleware>(RequestTrackingMiddleware);
		logger = module.get(LoggerService);

		// Mock span
		mockSpan = {
			setAttribute: jest.fn(),
		} as any;

		jest.spyOn(otelApi.trace, 'getSpan').mockReturnValue(mockSpan);

		// Mock request
		mockRequest = {
			method: 'GET',
			path: '/api/users',
			ip: '192.168.1.1',
			headers: {
				'user-agent': 'Mozilla/5.0',
			},
			user: undefined,
		};

		// Mock response
		const eventHandlers: Record<string, Function> = {};
		mockResponse = {
			statusCode: 200,
			on: jest.fn((event: string, handler: Function) => {
				eventHandlers[event] = handler;
				return mockResponse as Response;
			}),
			emit: (event: string) => {
				if (eventHandlers[event]) {
					eventHandlers[event]();
					return true;
				}
				return false;
			},
		};

		nextFunction = jest.fn();
	});

	afterEach(() => {
		jest.restoreAllMocks();
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	describe('use', () => {
		it('should generate correlation ID and add to request', () => {
			middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

			expect((mockRequest as any).correlationId).toBeDefined();
			expect(typeof (mockRequest as any).correlationId).toBe('string');
		});

		it('should add correlation ID to span', () => {
			middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockSpan.setAttribute).toHaveBeenCalledWith(
				'correlation.id',
				expect.any(String),
			);
		});

		it('should add client IP to span', () => {
			middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockSpan.setAttribute).toHaveBeenCalledWith('client.ip', '192.168.1.1');
		});

		it('should log request start', () => {
			middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(logger.debug).toHaveBeenCalledWith(
				'Request started',
				expect.objectContaining({
					correlationId: expect.any(String),
					method: 'GET',
					path: '/api/users',
					ip: '192.168.1.1',
					userAgent: 'Mozilla/5.0',
				}),
			);
		});

		it('should call next function', () => {
			middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(nextFunction).toHaveBeenCalled();
		});

		it('should log request completion on response finish', () => {
			middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

			(mockResponse as any).emit('finish');

			expect(logger.request).toHaveBeenCalledWith(
				'GET',
				'/api/users',
				200,
				expect.any(Number),
				expect.objectContaining({
					correlationId: expect.any(String),
					ip: '192.168.1.1',
					userAgent: 'Mozilla/5.0',
				}),
			);
		});

		it('should include userId in request log if user is authenticated', () => {
			mockRequest.user = { id: 'user-123' } as any;

			middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
			(mockResponse as any).emit('finish');

			expect(logger.request).toHaveBeenCalledWith(
				'GET',
				'/api/users',
				200,
				expect.any(Number),
				expect.objectContaining({
					userId: 'user-123',
				}),
			);
		});

		it('should warn on slow requests (>5 seconds)', () => {
			middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

			// Advance time by 6 seconds
			jest.advanceTimersByTime(6000);

			// Emit finish event
			(mockResponse as any).emit('finish');

			// Check that warning was logged
			expect(logger.warn).toHaveBeenCalledWith(
				'Slow request detected',
				expect.objectContaining({
					method: 'GET',
					path: '/api/users',
					duration: expect.any(Number),
					statusCode: 200,
				}),
			);
		});
	});

	describe('getClientIp', () => {
		it('should extract IP from x-forwarded-for header', () => {
			mockRequest.headers = {
				'x-forwarded-for': '203.0.113.1, 198.51.100.1',
			};

			middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockSpan.setAttribute).toHaveBeenCalledWith('client.ip', '203.0.113.1');
		});

		it('should use req.ip if x-forwarded-for is not present', () => {
			(mockRequest as any).ip = '192.168.1.100';
			delete mockRequest.headers?.['x-forwarded-for'];

			middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockSpan.setAttribute).toHaveBeenCalledWith('client.ip', '192.168.1.100');
		});

		it('should handle array in x-forwarded-for', () => {
			mockRequest.headers = {
				'x-forwarded-for': ['203.0.113.1', '198.51.100.1'],
			};

			middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockSpan.setAttribute).toHaveBeenCalledWith('client.ip', '203.0.113.1');
		});
	});

	describe('DDoS detection', () => {
		it('should not trigger alert for normal request rates', () => {
			// Make 50 requests (below warning threshold)
			for (let i = 0; i < 50; i++) {
				middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
			}

			expect(logger.security).not.toHaveBeenCalled();
		});

		it('should trigger WARNING for high request rate (100-299 req)', () => {
			// Make 100 requests from same IP
			for (let i = 0; i < 100; i++) {
				middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
			}

			expect(logger.security).toHaveBeenCalledWith(
				'High request rate detected',
				expect.objectContaining({
					ip: '192.168.1.1',
					totalRequests: 100,
					severity: 'WARNING',
				}),
			);
		});

		it('should trigger CRITICAL for potential DDoS (≥300 req)', () => {
			// Make 300 requests from same IP
			for (let i = 0; i < 300; i++) {
				middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
			}

			expect(logger.security).toHaveBeenCalledWith(
				'Potential DDoS attack detected',
				expect.objectContaining({
					ip: '192.168.1.1',
					totalRequests: 300,
					severity: 'CRITICAL',
				}),
			);
		});

		it('should track requests per IP separately', () => {
			// Make 150 requests from IP 1
			for (let i = 0; i < 150; i++) {
				middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
			}

			// Make 50 requests from IP 2
			const mockRequest2 = { ...mockRequest, ip: '192.168.1.2' };
			for (let i = 0; i < 50; i++) {
				middleware.use(mockRequest2 as Request, mockResponse as Response, nextFunction);
			}

			// Should only warn about IP 1
			const securityCalls = logger.security.mock.calls;
			expect(securityCalls.length).toBeGreaterThan(0);
			expect(securityCalls.every(call => call[1]['ip'] === '192.168.1.1')).toBe(true);
		});

		it('should reset counter after time window', () => {
			// Make 100 requests
			for (let i = 0; i < 100; i++) {
				middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
			}

			// Clear the security call from the first batch
			logger.security.mockClear();

			// Advance time beyond the window (60 seconds)
			jest.advanceTimersByTime(61000);

			// Make another 50 requests (should not trigger alert)
			for (let i = 0; i < 50; i++) {
				middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
			}

			expect(logger.security).not.toHaveBeenCalled();
		});
	});

	describe('cleanup', () => {
		it('should clean up old tracking entries', () => {
			// Make some requests
			for (let i = 0; i < 10; i++) {
				middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
			}

			// Advance time beyond cleanup threshold (2x window)
			jest.advanceTimersByTime(121000);

			// Trigger cleanup interval (5 minutes)
			jest.advanceTimersByTime(300000);

			expect(logger.debug).toHaveBeenCalledWith(
				'Cleaned up request tracking data',
				expect.objectContaining({
					entriesRemoved: expect.any(Number),
					remainingEntries: expect.any(Number),
				}),
			);
		});

		it('should not log if no entries to clean up', () => {
			// Advance time to trigger cleanup without any requests
			jest.advanceTimersByTime(300000);

			const debugCalls = logger.debug.mock.calls.filter(
				call => call[0] === 'Cleaned up request tracking data',
			);
			expect(debugCalls).toHaveLength(0);
		});
	});
});
