import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';

/**
 * Metrics collection service for monitoring API performance and security events.
 * Tracks key metrics that can be used for alerting and dashboards.
 */
@Injectable()
export class MetricsService {
	private metrics: Map<string, MetricData> = new Map();
	private readonly REPORT_INTERVAL = 60000; // Report metrics every minute

	constructor(private readonly logger: LoggerService) {
		// Periodically report metrics
		setInterval(() => this.reportMetrics(), this.REPORT_INTERVAL);
	}

	/**
	 * Increment a counter metric
	 */
	incrementCounter(name: string, labels?: Record<string, string>) {
		const key = this.getKey(name, labels);
		const metric = this.metrics.get(key) || { type: 'counter', value: 0, labels };
		(metric as CounterMetric).value++;
		this.metrics.set(key, metric);
	}

	/**
	 * Set a gauge metric value
	 */
	setGauge(name: string, value: number, labels?: Record<string, string>) {
		const key = this.getKey(name, labels);
		this.metrics.set(key, { type: 'gauge', value, labels });
	}

	/**
	 * Record a histogram value (for timing/duration measurements)
	 */
	recordHistogram(name: string, value: number, labels?: Record<string, string>) {
		const key = this.getKey(name, labels);
		const metric = this.metrics.get(key) || {
			type: 'histogram',
			values: [],
			labels,
		};
		(metric as HistogramMetric).values.push(value);
		this.metrics.set(key, metric);
	}

	/**
	 * Track authentication event
	 */
	trackAuthEvent(event: 'login_success' | 'login_failure' | 'logout', userId?: string) {
		this.incrementCounter('auth_events', { event });
		this.logger.info(`Authentication event: ${event}`, { event, userId });
	}

	/**
	 * Track authorization failure
	 */
	trackAuthorizationFailure(resource: string, userId: string, reason: string) {
		this.incrementCounter('authorization_failures', { resource });
		this.logger.security('Authorization failure', {
			resource,
			userId,
			reason,
		});
	}

	/**
	 * Track API errors
	 */
	trackError(operation: string, errorType: string, statusCode?: number) {
		this.incrementCounter('api_errors', {
			operation,
			errorType,
			statusCode: statusCode !== undefined ? statusCode.toString() : 'unknown',
		});
	}

	/**
	 * Track database operations
	 */
	trackDatabaseOperation(
		operation: 'query' | 'insert' | 'update' | 'delete',
		durationMs: number,
	) {
		this.recordHistogram('database_operation_duration', durationMs, { operation });
		this.incrementCounter('database_operations', { operation });
	}

	/**
	 * Track business operations
	 */
	trackBusinessOperation(operation: string, success: boolean, durationMs?: number) {
		this.incrementCounter('business_operations', {
			operation,
			status: success ? 'success' : 'failure',
		});

		if (durationMs !== undefined) {
			this.recordHistogram('business_operation_duration', durationMs, { operation });
		}
	}

	/**
	 * Report all collected metrics
	 */
	private reportMetrics() {
		if (this.metrics.size === 0) {
			return;
		}

		const report: Record<string, unknown> = {};

		for (const [key, metric] of this.metrics.entries()) {
			if (metric.type === 'histogram') {
				const values = (metric as HistogramMetric).values;
				if (values.length > 0) {
					report[key] = {
						type: 'histogram',
						count: values.length,
						sum: values.reduce((a, b) => a + b, 0),
						avg: values.reduce((a, b) => a + b, 0) / values.length,
						min: Math.min(...values),
						max: Math.max(...values),
						p50: this.percentile(values, 0.5),
						p95: this.percentile(values, 0.95),
						p99: this.percentile(values, 0.99),
						labels: metric.labels,
					};
				}
			} else {
				report[key] = {
					type: metric.type,
					value: metric.value,
					labels: metric.labels,
				};
			}
		}

		this.logger.info('Metrics report', { metrics: report });

		// Reset counters and histograms after reporting
		this.metrics.clear();
	}

	/**
	 * Calculate percentile for histogram values
	 */
	private percentile(values: number[], p: number): number {
		const sorted = [...values].sort((a, b) => a - b);
		const index = Math.ceil(sorted.length * p) - 1;
		return sorted[index];
	}

	/**
	 * Generate a unique key for metric with labels
	 */
	private getKey(name: string, labels?: Record<string, string>): string {
		if (!labels || Object.keys(labels).length === 0) {
			return name;
		}
		const labelStr = Object.entries(labels)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => `${k}="${v}"`)
			.join(',');
		return `${name}{${labelStr}}`;
	}
}

type MetricData = CounterMetric | GaugeMetric | HistogramMetric;

interface CounterMetric {
	type: 'counter';
	value: number;
	labels?: Record<string, string>;
}

interface GaugeMetric {
	type: 'gauge';
	value: number;
	labels?: Record<string, string>;
}

interface HistogramMetric {
	type: 'histogram';
	values: number[];
	labels?: Record<string, string>;
}
