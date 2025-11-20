import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logging/logger.service';
import { MetricsService } from '../metrics/metrics.service';
import { ProblemDetailsBuilder } from '../utils/problem-details.builder';

/**
 * Global exception filter that catches all errors and provides
 * centralized logging, metrics tracking, and RFC 7807 Problem Details responses.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	constructor(
		private readonly logger: LoggerService,
		private readonly metrics: MetricsService,
	) {}

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		// Extract error details
		const { status, message, errorType, errorResponse } = this.extractErrorDetails(exception);

		// Get correlation ID from request
		const correlationId = (request as any).correlationId;
		const userId = (request.user as any)?.id;

		// Log the error with full context
		this.logger.error(
			`${request.method} ${request.path} failed with ${status}`,
			exception instanceof Error ? exception : undefined,
			{
				correlationId,
				method: request.method,
				path: request.path,
				statusCode: status,
				errorType,
				userId,
				ip: request.ip,
				userAgent: request.headers['user-agent'],
			},
		);

		// Track error metrics
		this.metrics.trackError(`${request.method} ${request.path}`, errorType, status);

		// Extract validation errors if present
		const errors = this.extractValidationErrors(errorResponse);

		// Build RFC 7807 Problem Details response
		const problemDetails = ProblemDetailsBuilder.build({
			status,
			detail: ProblemDetailsBuilder.sanitizeDetail(message, status),
			instance: request.path,
			correlationId,
			errors: process.env['NODE_ENV'] !== 'production' ? errors : undefined,
		});

		// Set Content-Type header per RFC 7807
		response.setHeader('Content-Type', 'application/problem+json');
		response.status(status).json(problemDetails);
	}

	/**
	 * Extract error details from various exception types
	 */
	private extractErrorDetails(exception: unknown): {
		status: number;
		message: string;
		errorType: string;
		errorResponse?: unknown;
	} {
		if (exception instanceof HttpException) {
			const response = exception.getResponse();
			return {
				status: exception.getStatus(),
				message: exception.message,
				errorType: exception.constructor.name,
				errorResponse: typeof response === 'object' ? response : undefined,
			};
		}

		if (exception instanceof Error) {
			return {
				status: HttpStatus.INTERNAL_SERVER_ERROR,
				message: exception.message,
				errorType: exception.constructor.name,
			};
		}

		return {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
			message: 'Internal server error',
			errorType: 'UnknownError',
		};
	}

	/**
	 * Extract validation errors from exception response
	 */
	private extractValidationErrors(errorResponse: unknown): string[] | undefined {
		if (!errorResponse || typeof errorResponse !== 'object') {
			return undefined;
		}

		const response = errorResponse as Record<string, unknown>;

		// Handle validation errors from class-validator
		if (Array.isArray(response['message'])) {
			return response['message'].filter((msg): msg is string => typeof msg === 'string');
		}

		// Handle other error formats
		if (response['errors'] && Array.isArray(response['errors'])) {
			return response['errors'].filter((msg): msg is string => typeof msg === 'string');
		}

		return undefined;
	}
}
