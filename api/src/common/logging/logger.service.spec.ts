import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';
import * as otelApi from '@opentelemetry/api';

describe('LoggerService', () => {
	let service: LoggerService;
	let mockSpan: jest.Mocked<otelApi.Span>;
	let mockSpanContext: otelApi.SpanContext;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [LoggerService],
		}).compile();

		service = module.get<LoggerService>(LoggerService);

		// Mock span and span context
		mockSpanContext = {
			traceId: 'trace-123',
			spanId: 'span-456',
			traceFlags: 1,
		};

		mockSpan = {
			spanContext: jest.fn().mockReturnValue(mockSpanContext),
			setAttribute: jest.fn(),
			setAttributes: jest.fn(),
			addEvent: jest.fn(),
			setStatus: jest.fn(),
			updateName: jest.fn(),
			end: jest.fn(),
			isRecording: jest.fn().mockReturnValue(true),
			recordException: jest.fn(),
		} as any;
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('debug', () => {
		it('should log debug messages', () => {
			const logSpy = jest.spyOn(service['logger'], 'log');

			service.debug('Debug message', { key: 'value' });

			expect(logSpy).toHaveBeenCalledWith(
				'debug',
				'Debug message',
				expect.objectContaining({ key: 'value' }),
			);
		});

		it('should include trace context when available', () => {
			jest.spyOn(otelApi.trace, 'getSpan').mockReturnValue(mockSpan);
			const logSpy = jest.spyOn(service['logger'], 'log');

			service.debug('Debug with trace');

			expect(logSpy).toHaveBeenCalledWith(
				'debug',
				'Debug with trace',
				expect.objectContaining({
					traceId: 'trace-123',
					spanId: 'span-456',
					traceFlags: 1,
				}),
			);
		});
	});

	describe('info', () => {
		it('should log info messages', () => {
			const logSpy = jest.spyOn(service['logger'], 'log');

			service.info('Info message', { userId: '123' });

			expect(logSpy).toHaveBeenCalledWith(
				'info',
				'Info message',
				expect.objectContaining({ userId: '123' }),
			);
		});
	});

	describe('warn', () => {
		it('should log warning messages', () => {
			const logSpy = jest.spyOn(service['logger'], 'log');

			service.warn('Warning message', { reason: 'test' });

			expect(logSpy).toHaveBeenCalledWith(
				'warn',
				'Warning message',
				expect.objectContaining({ reason: 'test' }),
			);
		});
	});

	describe('error', () => {
		it('should log error messages with Error objects', () => {
			const logSpy = jest.spyOn(service['logger'], 'log');
			const error = new Error('Test error');

			service.error('Error occurred', error, { context: 'test' });

			expect(logSpy).toHaveBeenCalledWith(
				'error',
				'Error occurred',
				expect.objectContaining({
					context: 'test',
					error: expect.objectContaining({
						name: 'Error',
						message: 'Test error',
						stack: expect.any(String),
					}),
				}),
			);
		});

		it('should log error messages with unknown error types', () => {
			const logSpy = jest.spyOn(service['logger'], 'log');

			service.error('Error occurred', { custom: 'error' });

			expect(logSpy).toHaveBeenCalledWith(
				'error',
				'Error occurred',
				expect.objectContaining({
					error: { custom: 'error' },
				}),
			);
		});

		it('should record exception in current span', () => {
			jest.spyOn(otelApi.trace, 'getSpan').mockReturnValue(mockSpan);
			const error = new Error('Test error');

			service.error('Error occurred', error);

			expect(mockSpan.recordException).toHaveBeenCalledWith(error);
			expect(mockSpan.setStatus).toHaveBeenCalledWith({
				code: otelApi.SpanStatusCode.ERROR,
				message: 'Test error',
			});
		});

		it('should handle errors without span', () => {
			jest.spyOn(otelApi.trace, 'getSpan').mockReturnValue(undefined);
			const error = new Error('Test error');

			expect(() => service.error('Error occurred', error)).not.toThrow();
		});
	});

	describe('security', () => {
		it('should log security events with proper tagging', () => {
			const logSpy = jest.spyOn(service['logger'], 'log');

			service.security('Unauthorized access', { userId: '123', resource: 'project' });

			expect(logSpy).toHaveBeenCalledWith(
				'warn',
				'SECURITY: Unauthorized access',
				expect.objectContaining({
					userId: '123',
					resource: 'project',
					securityEvent: true,
				}),
			);
		});
	});

	describe('performance', () => {
		it('should log performance metrics', () => {
			const logSpy = jest.spyOn(service['logger'], 'log');

			service.performance('database.query', 123, { query: 'SELECT *' });

			expect(logSpy).toHaveBeenCalledWith(
				'info',
				'PERFORMANCE: database.query',
				expect.objectContaining({
					durationMs: 123,
					query: 'SELECT *',
					performanceMetric: true,
				}),
			);
		});
	});

	describe('request', () => {
		it('should log HTTP request details', () => {
			const logSpy = jest.spyOn(service['logger'], 'log');

			service.request('GET', '/api/users', 200, 45, { userId: '123' });

			expect(logSpy).toHaveBeenCalledWith(
				'info',
				'GET /api/users 200',
				expect.objectContaining({
					method: 'GET',
					path: '/api/users',
					statusCode: 200,
					durationMs: 45,
					userId: '123',
					requestLog: true,
				}),
			);
		});
	});
});
