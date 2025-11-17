import { Injectable } from '@nestjs/common';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import * as winston from 'winston';

export type LogLevel = 'verbose' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Structured logging service that integrates with OpenTelemetry tracing.
 * Provides correlation between logs and traces for better observability.
 */
@Injectable()
export class LoggerService {
	private logger: winston.Logger;
	private readonly serviceName = 'bernoulli-api';

	constructor() {
		const format = winston.format.combine(
			winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
			winston.format.errors({ stack: true }),
			winston.format.json(),
		);

		this.logger = winston.createLogger({
			level: process.env['LOG_LEVEL'] || 'info',
			format,
			defaultMeta: { service: this.serviceName },
			transports: [
				new winston.transports.Console({
					format: winston.format.combine(
						winston.format.colorize(),
						winston.format.printf(({ timestamp, level, message, ...metadata }) => {
							let msg = `${timestamp} [${level}] ${message}`;
							if (Object.keys(metadata).length > 0) {
								msg += ` ${JSON.stringify(metadata)}`;
							}
							return msg;
						}),
					),
				}),
			],
		});
	}

	/**
	 * Get the current trace context from OpenTelemetry
	 */
	private getTraceContext() {
		const span = trace.getSpan(context.active());
		if (span) {
			const spanContext = span.spanContext();
			return {
				traceId: spanContext.traceId,
				spanId: spanContext.spanId,
				traceFlags: spanContext.traceFlags,
			};
		}
		return {};
	}

	/**
	 * Log with structured metadata and trace correlation
	 */
	private log(level: LogLevel, message: string, metadata: Record<string, unknown> = {}) {
		const traceContext = this.getTraceContext();
		this.logger.log(level, message, {
			...metadata,
			...traceContext,
		});
	}

	/**
	 * Log debug information
	 */
	debug(message: string, metadata?: Record<string, unknown>) {
		this.log('debug', message, metadata);
	}

	/**
	 * Log informational messages
	 */
	info(message: string, metadata?: Record<string, unknown>) {
		this.log('info', message, metadata);
	}

	/**
	 * Log warning messages
	 */
	warn(message: string, metadata?: Record<string, unknown>) {
		this.log('warn', message, metadata);
	}

	/**
	 * Log error messages with optional error object
	 */
	error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>) {
		const errorMetadata: Record<string, unknown> = { ...metadata };

		if (error instanceof Error) {
			errorMetadata['error'] = {
				name: error.name,
				message: error.message,
				stack: error.stack,
			};
		} else if (error) {
			errorMetadata['error'] = error;
		}

		this.log('error', message, errorMetadata);

		// Also record error in current span if available
		const span = trace.getSpan(context.active());
		if (span && error instanceof Error) {
			span.recordException(error);
			span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
		}
	}

	/**
	 * Log security-related events (authentication failures, authorization denials, etc.)
	 */
	security(event: string, metadata: Record<string, unknown>) {
		this.log('warn', `SECURITY: ${event}`, {
			...metadata,
			securityEvent: true,
		});
	}

	/**
	 * Log performance metrics
	 */
	performance(operation: string, durationMs: number, metadata?: Record<string, unknown>) {
		this.log('info', `PERFORMANCE: ${operation}`, {
			...metadata,
			durationMs,
			performanceMetric: true,
		});
	}

	/**
	 * Log HTTP request details
	 */
	request(
		method: string,
		path: string,
		statusCode: number,
		durationMs: number,
		metadata?: Record<string, unknown>,
	) {
		this.log('info', `${method} ${path} ${statusCode}`, {
			...metadata,
			method,
			path,
			statusCode,
			durationMs,
			requestLog: true,
		});
	}
}
