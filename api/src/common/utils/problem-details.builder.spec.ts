import { HttpStatus } from '@nestjs/common';
import { ProblemDetailsBuilder } from './problem-details.builder';

describe('ProblemDetailsBuilder', () => {
	describe('build', () => {
		it('should build a basic problem details response', () => {
			const result = ProblemDetailsBuilder.build({
				status: HttpStatus.NOT_FOUND,
				detail: 'Resource not found',
				instance: '/api/users/123',
			});

			expect(result).toEqual({
				type: 'https://httpstatuses.io/404',
				title: 'Not Found',
				status: 404,
				detail: 'Resource not found',
				instance: '/api/users/123',
				timestamp: expect.any(String),
			});

			// Verify timestamp is valid ISO string
			expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
		});

		it('should include correlation ID when provided', () => {
			const result = ProblemDetailsBuilder.build({
				status: HttpStatus.BAD_REQUEST,
				detail: 'Invalid input',
				instance: '/api/projects',
				correlationId: 'test-correlation-123',
			});

			expect(result.correlationId).toBe('test-correlation-123');
		});

		it('should include errors array when provided', () => {
			const errors = ['field1 is required', 'field2 is invalid'];

			const result = ProblemDetailsBuilder.build({
				status: HttpStatus.BAD_REQUEST,
				detail: 'Validation failed',
				instance: '/api/users',
				errors,
			});

			expect(result.errors).toEqual(errors);
		});

		it('should not include errors field when array is empty', () => {
			const result = ProblemDetailsBuilder.build({
				status: HttpStatus.BAD_REQUEST,
				detail: 'Validation failed',
				instance: '/api/users',
				errors: [],
			});

			expect(result.errors).toBeUndefined();
		});

		it('should use custom title when provided', () => {
			const result = ProblemDetailsBuilder.build({
				status: HttpStatus.BAD_REQUEST,
				detail: 'Invalid email format',
				instance: '/api/users',
				title: 'Email Validation Error',
			});

			expect(result.title).toBe('Email Validation Error');
		});

		it('should use custom type when provided', () => {
			const result = ProblemDetailsBuilder.build({
				status: HttpStatus.BAD_REQUEST,
				detail: 'Invalid email format',
				instance: '/api/users',
				type: 'https://example.com/errors/email-validation',
			});

			expect(result.type).toBe('https://example.com/errors/email-validation');
		});

		it('should build problem details for various HTTP status codes', () => {
			const testCases = [
				{ status: HttpStatus.BAD_REQUEST, expectedTitle: 'Bad Request' },
				{ status: HttpStatus.UNAUTHORIZED, expectedTitle: 'Unauthorized' },
				{ status: HttpStatus.FORBIDDEN, expectedTitle: 'Forbidden' },
				{ status: HttpStatus.NOT_FOUND, expectedTitle: 'Not Found' },
				{ status: HttpStatus.CONFLICT, expectedTitle: 'Conflict' },
				{ status: HttpStatus.UNPROCESSABLE_ENTITY, expectedTitle: 'Unprocessable Entity' },
				{
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					expectedTitle: 'Internal Server Error',
				},
				{ status: HttpStatus.SERVICE_UNAVAILABLE, expectedTitle: 'Service Unavailable' },
			];

			testCases.forEach(({ status, expectedTitle }) => {
				const result = ProblemDetailsBuilder.build({
					status,
					detail: 'Test error',
					instance: '/api/test',
				});

				expect(result.title).toBe(expectedTitle);
				expect(result.type).toBe(`https://httpstatuses.io/${status}`);
			});
		});

		it('should handle unknown status codes', () => {
			const result = ProblemDetailsBuilder.build({
				status: 999,
				detail: 'Unknown error',
				instance: '/api/test',
			});

			expect(result.title).toBe('Unknown Error');
			expect(result.type).toBe('https://httpstatuses.io/999');
		});
	});

	describe('sanitizeDetail', () => {
		it('should return original detail for 4xx errors in production', () => {
			const originalEnv = process.env['NODE_ENV'];
			process.env['NODE_ENV'] = 'production';

			const detail = ProblemDetailsBuilder.sanitizeDetail('Not found', HttpStatus.NOT_FOUND);

			expect(detail).toBe('Not found');

			process.env['NODE_ENV'] = originalEnv;
		});

		it('should sanitize detail for 5xx errors in production', () => {
			const originalEnv = process.env['NODE_ENV'];
			process.env['NODE_ENV'] = 'production';

			const detail = ProblemDetailsBuilder.sanitizeDetail(
				'Database connection failed',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);

			expect(detail).toBe('An internal server error occurred.');

			process.env['NODE_ENV'] = originalEnv;
		});

		it('should return original detail for 5xx errors in development', () => {
			const originalEnv = process.env['NODE_ENV'];
			process.env['NODE_ENV'] = 'development';

			const detail = ProblemDetailsBuilder.sanitizeDetail(
				'Database connection failed',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);

			expect(detail).toBe('Database connection failed');

			process.env['NODE_ENV'] = originalEnv;
		});

		it('should return original detail for 5xx errors when NODE_ENV is not set', () => {
			const originalEnv = process.env['NODE_ENV'];
			delete process.env['NODE_ENV'];

			const detail = ProblemDetailsBuilder.sanitizeDetail(
				'Database connection failed',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);

			expect(detail).toBe('Database connection failed');

			process.env['NODE_ENV'] = originalEnv;
		});

		it('should handle all 5xx status codes consistently', () => {
			const originalEnv = process.env['NODE_ENV'];
			process.env['NODE_ENV'] = 'production';

			const testCases = [500, 501, 502, 503, 504, 599];

			testCases.forEach(status => {
				const detail = ProblemDetailsBuilder.sanitizeDetail(
					'Internal error details',
					status,
				);
				expect(detail).toBe('An internal server error occurred.');
			});

			process.env['NODE_ENV'] = originalEnv;
		});
	});
});
