import { Injectable } from '@nestjs/common';
import { trace, context, Span, SpanStatusCode, SpanKind } from '@opentelemetry/api';

/**
 * Service for creating custom OpenTelemetry spans for business operations.
 * Provides detailed tracing for critical operations beyond automatic instrumentation.
 */
@Injectable()
export class TracingService {
	private readonly tracer = trace.getTracer('bernoulli-api');

	/**
	 * Execute a function within a custom span
	 * @param operationName Name of the operation (e.g., 'auth.login', 'project.create')
	 * @param fn Function to execute within the span
	 * @param attributes Additional attributes to add to the span
	 */
	async traceOperation<T>(
		operationName: string,
		fn: (span: Span) => Promise<T>,
		attributes?: Record<string, string | number | boolean>,
	): Promise<T> {
		const span = this.tracer.startSpan(operationName, {
			kind: SpanKind.INTERNAL,
			attributes,
		});

		return context.with(trace.setSpan(context.active(), span), async () => {
			try {
				const result = await fn(span);
				span.setStatus({ code: SpanStatusCode.OK });
				return result;
			} catch (error) {
				if (error instanceof Error) {
					span.recordException(error);
					span.setStatus({
						code: SpanStatusCode.ERROR,
						message: error.message,
					});
				}
				throw error;
			} finally {
				span.end();
			}
		});
	}

	/**
	 * Add an event to the current span
	 */
	addEvent(name: string, attributes?: Record<string, string | number | boolean>) {
		const span = trace.getSpan(context.active());
		if (span) {
			span.addEvent(name, attributes);
		}
	}

	/**
	 * Add attributes to the current span
	 */
	setAttributes(attributes: Record<string, string | number | boolean>) {
		const span = trace.getSpan(context.active());
		if (span) {
			Object.entries(attributes).forEach(([key, value]) => {
				span.setAttribute(key, value);
			});
		}
	}

	/**
	 * Record an exception in the current span
	 */
	recordException(error: Error) {
		const span = trace.getSpan(context.active());
		if (span) {
			span.recordException(error);
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: error.message,
			});
		}
	}
}
