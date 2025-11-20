import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { LoggerService } from '../logging/logger.service';
import { MetricsService } from '../metrics/metrics.service';

describe('AllExceptionsFilter', () => {
	let filter: AllExceptionsFilter;
	let logger: jest.Mocked<LoggerService>;
	let metrics: jest.Mocked<MetricsService>;
	let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
	let mockRequest: any;
	let mockResponse: any;

	beforeEach(async () => {
		const mockLogger = {
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			security: jest.fn(),
		};

		const mockMetrics = {
			trackError: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AllExceptionsFilter,
				{
					provide: LoggerService,
					useValue: mockLogger,
				},
				{
					provide: MetricsService,
					useValue: mockMetrics,
				},
			],
		}).compile();

		filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
		logger = module.get(LoggerService);
		metrics = module.get(MetricsService);

		// Mock request
		mockRequest = {
			method: 'GET',
			path: '/api/users',
			ip: '192.168.1.1',
			headers: {
				'user-agent': 'Mozilla/5.0',
			},
			user: undefined,
			correlationId: 'test-correlation-id',
		};

		// Mock response
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			setHeader: jest.fn(),
		};

		// Mock ArgumentsHost
		mockArgumentsHost = {
			switchToHttp: jest.fn().mockReturnValue({
				getRequest: () => mockRequest,
				getResponse: () => mockResponse,
			}),
		} as any;
	});

	describe('catch - HttpException', () => {
		it('should handle HttpException and return RFC 7807 Problem Details', () => {
			const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

			filter.catch(exception, mockArgumentsHost);

			expect(mockResponse.setHeader).toHaveBeenCalledWith(
				'Content-Type',
				'application/problem+json',
			);
			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'https://httpstatuses.io/404',
					title: 'Not Found',
					status: 404,
					detail: 'Not Found',
					instance: '/api/users',
					timestamp: expect.any(String),
					correlationId: 'test-correlation-id',
				}),
			);
		});

		it('should log error with full context', () => {
			const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

			filter.catch(exception, mockArgumentsHost);

			expect(logger.error).toHaveBeenCalledWith(
				'GET /api/users failed with 400',
				exception,
				expect.objectContaining({
					correlationId: 'test-correlation-id',
					method: 'GET',
					path: '/api/users',
					statusCode: 400,
					errorType: 'HttpException',
					ip: '192.168.1.1',
					userAgent: 'Mozilla/5.0',
				}),
			);
		});

		it('should track error metrics', () => {
			const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

			filter.catch(exception, mockArgumentsHost);

			expect(metrics.trackError).toHaveBeenCalledWith('GET /api/users', 'HttpException', 403);
		});

		it('should include userId if user is authenticated', () => {
			mockRequest.user = { id: 'user-123' };
			const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

			filter.catch(exception, mockArgumentsHost);

			expect(logger.error).toHaveBeenCalledWith(
				expect.any(String),
				exception,
				expect.objectContaining({
					userId: 'user-123',
				}),
			);
		});

		it('should include validation errors in non-production', () => {
			const originalEnv = process.env['NODE_ENV'];
			process.env['NODE_ENV'] = 'development';

			const exception = new HttpException(
				{
					message: ['field1 is required', 'field2 is invalid'],
				},
				HttpStatus.BAD_REQUEST,
			);

			filter.catch(exception, mockArgumentsHost);

			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					errors: ['field1 is required', 'field2 is invalid'],
				}),
			);

			process.env['NODE_ENV'] = originalEnv;
		});

		it('should not include validation errors in production', () => {
			const originalEnv = process.env['NODE_ENV'];
			process.env['NODE_ENV'] = 'production';

			const exception = new HttpException(
				{
					message: ['field1 is required'],
				},
				HttpStatus.BAD_REQUEST,
			);

			filter.catch(exception, mockArgumentsHost);

			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.not.objectContaining({
					errors: expect.anything(),
				}),
			);

			process.env['NODE_ENV'] = originalEnv;
		});
	});

	describe('catch - Error', () => {
		it('should handle generic Error and return 500 with RFC 7807 format', () => {
			const exception = new Error('Something went wrong');

			filter.catch(exception, mockArgumentsHost);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'https://httpstatuses.io/500',
					title: 'Internal Server Error',
					status: 500,
					detail: 'Something went wrong',
					instance: '/api/users',
				}),
			);
		});

		it('should log error type as constructor name', () => {
			const exception = new TypeError('Invalid type');

			filter.catch(exception, mockArgumentsHost);

			expect(logger.error).toHaveBeenCalledWith(
				expect.any(String),
				exception,
				expect.objectContaining({
					errorType: 'TypeError',
				}),
			);
		});

		it('should hide internal error details in production for 5xx errors', () => {
			const originalEnv = process.env['NODE_ENV'];
			process.env['NODE_ENV'] = 'production';

			const exception = new Error('Database connection failed');

			filter.catch(exception, mockArgumentsHost);

			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: 'An internal server error occurred.',
				}),
			);

			process.env['NODE_ENV'] = originalEnv;
		});

		it('should show error details in development for 5xx errors', () => {
			const originalEnv = process.env['NODE_ENV'];
			process.env['NODE_ENV'] = 'development';

			const exception = new Error('Database connection failed');

			filter.catch(exception, mockArgumentsHost);

			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: 'Database connection failed',
				}),
			);

			process.env['NODE_ENV'] = originalEnv;
		});
	});

	describe('catch - Unknown exception', () => {
		it('should handle unknown exception types', () => {
			const exception = 'string error';

			filter.catch(exception, mockArgumentsHost);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 500,
					detail: 'Internal server error',
				}),
			);
		});

		it('should log unknown error type', () => {
			const exception = { custom: 'error object' };

			filter.catch(exception, mockArgumentsHost);

			expect(logger.error).toHaveBeenCalledWith(
				expect.any(String),
				undefined,
				expect.objectContaining({
					errorType: 'UnknownError',
				}),
			);
		});
	});

	describe('without correlation ID', () => {
		it('should handle requests without correlation ID', () => {
			delete mockRequest.correlationId;
			const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

			filter.catch(exception, mockArgumentsHost);

			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.not.objectContaining({
					correlationId: expect.anything(),
				}),
			);
		});
	});

	describe('extractErrorDetails', () => {
		it('should extract HttpException details', () => {
			const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

			const details = filter['extractErrorDetails'](exception);

			expect(details).toEqual({
				status: 400,
				message: 'Test error',
				errorType: 'HttpException',
				errorResponse: undefined,
			});
		});

		it('should extract HttpException with object response', () => {
			const responseObj = { message: 'Validation error', fields: ['name', 'email'] };
			const exception = new HttpException(responseObj, HttpStatus.BAD_REQUEST);

			const details = filter['extractErrorDetails'](exception);

			expect(details.errorResponse).toEqual(responseObj);
		});

		it('should extract Error details', () => {
			const exception = new Error('Generic error');

			const details = filter['extractErrorDetails'](exception);

			expect(details).toEqual({
				status: 500,
				message: 'Generic error',
				errorType: 'Error',
			});
		});

		it('should handle unknown exception types', () => {
			const exception = 'unknown';

			const details = filter['extractErrorDetails'](exception);

			expect(details).toEqual({
				status: 500,
				message: 'Internal server error',
				errorType: 'UnknownError',
			});
		});
	});

	describe('extractValidationErrors', () => {
		it('should extract validation errors from message array', () => {
			const errorResponse = {
				message: ['field1 is required', 'field2 is invalid'],
			};

			const errors = filter['extractValidationErrors'](errorResponse);

			expect(errors).toEqual(['field1 is required', 'field2 is invalid']);
		});

		it('should extract validation errors from errors array', () => {
			const errorResponse = {
				errors: ['error1', 'error2'],
			};

			const errors = filter['extractValidationErrors'](errorResponse);

			expect(errors).toEqual(['error1', 'error2']);
		});

		it('should filter out non-string values', () => {
			const errorResponse = {
				message: ['valid error', 123, null, 'another error'],
			};

			const errors = filter['extractValidationErrors'](errorResponse);

			expect(errors).toEqual(['valid error', 'another error']);
		});

		it('should return undefined for non-object responses', () => {
			expect(filter['extractValidationErrors'](null)).toBeUndefined();
			expect(filter['extractValidationErrors'](undefined)).toBeUndefined();
			expect(filter['extractValidationErrors']('string')).toBeUndefined();
		});

		it('should return undefined when no error arrays present', () => {
			const errorResponse = {
				foo: 'bar',
			};

			const errors = filter['extractValidationErrors'](errorResponse);

			expect(errors).toBeUndefined();
		});
	});
});
