import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logging/logger.service';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Global exception filter that catches all errors and provides
 * centralized logging, metrics tracking, and consistent error responses.
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

		// Send error response
		const responseBody: Record<string, unknown> = {
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.path,
			message: this.getSafeErrorMessage(message, status),
		};

		if (correlationId) {
			responseBody['correlationId'] = correlationId;
		}

		if (process.env['NODE_ENV'] !== 'production' && errorResponse) {
			responseBody['details'] = errorResponse;
		}

		response.status(status).json(responseBody);
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
	 * Get a safe error message to return to clients.
	 * Prevents leaking sensitive information in production.
	 */
	private getSafeErrorMessage(message: string, status: number): string {
		// In production, don't expose internal error details for 5xx errors
		if (process.env['NODE_ENV'] === 'production' && status >= 500) {
			return 'Internal server error';
		}
		return message;
	}
}
