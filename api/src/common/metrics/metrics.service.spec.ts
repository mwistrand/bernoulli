import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { LoggerService } from '../logging/logger.service';

describe('MetricsService', () => {
	let service: MetricsService;
	let logger: jest.Mocked<LoggerService>;

	beforeEach(async () => {
		// Use fake timers BEFORE creating the service
		jest.useFakeTimers();

		const mockLogger = {
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			security: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MetricsService,
				{
					provide: LoggerService,
					useValue: mockLogger,
				},
			],
		}).compile();

		service = module.get<MetricsService>(MetricsService);
		logger = module.get(LoggerService);
	});

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	describe('incrementCounter', () => {
		it('should increment counter metric', () => {
			service.incrementCounter('test_counter');
			service.incrementCounter('test_counter');
			service.incrementCounter('test_counter');

			const metrics = service['metrics'];
			const metric = metrics.get('test_counter');

			expect(metric).toBeDefined();
			expect(metric?.type).toBe('counter');
			expect((metric as any).value).toBe(3);
		});

		it('should increment counter with labels', () => {
			service.incrementCounter('test_counter', { status: 'success' });
			service.incrementCounter('test_counter', { status: 'success' });
			service.incrementCounter('test_counter', { status: 'failure' });

			const metrics = service['metrics'];
			const successMetric = metrics.get('test_counter{status="success"}');
			const failureMetric = metrics.get('test_counter{status="failure"}');

			expect((successMetric as any).value).toBe(2);
			expect((failureMetric as any).value).toBe(1);
		});
	});

	describe('setGauge', () => {
		it('should set gauge metric value', () => {
			service.setGauge('active_users', 42);

			const metrics = service['metrics'];
			const metric = metrics.get('active_users');

			expect(metric).toBeDefined();
			expect(metric?.type).toBe('gauge');
			expect((metric as any).value).toBe(42);
		});

		it('should update gauge value', () => {
			service.setGauge('active_users', 42);
			service.setGauge('active_users', 50);

			const metrics = service['metrics'];
			const metric = metrics.get('active_users');

			expect((metric as any).value).toBe(50);
		});
	});

	describe('recordHistogram', () => {
		it('should record histogram values', () => {
			service.recordHistogram('request_duration', 100);
			service.recordHistogram('request_duration', 200);
			service.recordHistogram('request_duration', 150);

			const metrics = service['metrics'];
			const metric = metrics.get('request_duration');

			expect(metric).toBeDefined();
			expect(metric?.type).toBe('histogram');
			expect((metric as any).values).toEqual([100, 200, 150]);
		});

		it('should record histogram with labels', () => {
			service.recordHistogram('request_duration', 100, { endpoint: '/api/users' });
			service.recordHistogram('request_duration', 200, { endpoint: '/api/users' });

			const metrics = service['metrics'];
			const metric = metrics.get('request_duration{endpoint="/api/users"}');

			expect((metric as any).values).toEqual([100, 200]);
		});
	});

	describe('trackAuthEvent', () => {
		it('should track login success', () => {
			service.trackAuthEvent('login_success', 'user-123');

			expect(logger.info).toHaveBeenCalledWith(
				'Authentication event: login_success',
				expect.objectContaining({
					event: 'login_success',
					userId: 'user-123',
				}),
			);
		});

		it('should track login failure', () => {
			service.trackAuthEvent('login_failure');

			expect(logger.info).toHaveBeenCalledWith(
				'Authentication event: login_failure',
				expect.objectContaining({
					event: 'login_failure',
				}),
			);
		});

		it('should increment auth event counter', () => {
			service.trackAuthEvent('login_success');
			service.trackAuthEvent('login_success');

			const metrics = service['metrics'];
			const metric = metrics.get('auth_events{event="login_success"}');

			expect((metric as any).value).toBe(2);
		});
	});

	describe('trackAuthorizationFailure', () => {
		it('should track authorization failure', () => {
			service.trackAuthorizationFailure('project.create', 'user-123', 'not_admin');

			expect(logger.security).toHaveBeenCalledWith('Authorization failure', {
				resource: 'project.create',
				userId: 'user-123',
				reason: 'not_admin',
			});
		});

		it('should increment authorization failure counter', () => {
			service.trackAuthorizationFailure('project.create', 'user-123', 'not_admin');

			const metrics = service['metrics'];
			const metric = metrics.get('authorization_failures{resource="project.create"}');

			expect((metric as any).value).toBe(1);
		});
	});

	describe('trackError', () => {
		it('should track error with status code', () => {
			service.trackError('auth.login', 'BadRequestException', 400);

			const metrics = service['metrics'];
			const metric = metrics.get(
				'api_errors{errorType="BadRequestException",operation="auth.login",statusCode="400"}',
			);

			expect((metric as any).value).toBe(1);
		});

		it('should track error without status code', () => {
			service.trackError('auth.login', 'Error');

			const metrics = service['metrics'];
			const metric = metrics.get(
				'api_errors{errorType="Error",operation="auth.login",statusCode="unknown"}',
			);

			expect((metric as any).value).toBe(1);
		});
	});

	describe('trackDatabaseOperation', () => {
		it('should track database operation', () => {
			service.trackDatabaseOperation('query', 45);

			const metrics = service['metrics'];
			const counterMetric = metrics.get('database_operations{operation="query"}');
			const histogramMetric = metrics.get('database_operation_duration{operation="query"}');

			expect((counterMetric as any).value).toBe(1);
			expect((histogramMetric as any).values).toEqual([45]);
		});
	});

	describe('trackBusinessOperation', () => {
		it('should track successful business operation with duration', () => {
			service.trackBusinessOperation('project.create', true, 234);

			const metrics = service['metrics'];
			const counterMetric = metrics.get(
				'business_operations{operation="project.create",status="success"}',
			);
			const histogramMetric = metrics.get(
				'business_operation_duration{operation="project.create"}',
			);

			expect((counterMetric as any).value).toBe(1);
			expect((histogramMetric as any).values).toEqual([234]);
		});

		it('should track failed business operation without duration', () => {
			service.trackBusinessOperation('project.create', false);

			const metrics = service['metrics'];
			const counterMetric = metrics.get(
				'business_operations{operation="project.create",status="failure"}',
			);

			expect((counterMetric as any).value).toBe(1);
		});
	});

	describe('reportMetrics', () => {
		it('should report metrics periodically', () => {
			service.incrementCounter('test_counter');
			service.setGauge('test_gauge', 42);
			service.recordHistogram('test_histogram', 100);
			service.recordHistogram('test_histogram', 200);

			// Fast forward 60 seconds
			jest.advanceTimersByTime(60000);

			expect(logger.info).toHaveBeenCalledWith(
				'Metrics report',
				expect.objectContaining({
					metrics: expect.objectContaining({
						test_counter: expect.objectContaining({
							type: 'counter',
							value: 1,
						}),
						test_gauge: expect.objectContaining({
							type: 'gauge',
							value: 42,
						}),
						test_histogram: expect.objectContaining({
							type: 'histogram',
							count: 2,
							avg: 150,
							min: 100,
							max: 200,
						}),
					}),
				}),
			);
		});

		it('should calculate histogram percentiles correctly', () => {
			// Add values: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
			for (let i = 1; i <= 10; i++) {
				service.recordHistogram('test', i * 10);
			}

			jest.advanceTimersByTime(60000);

			const reportCall = logger.info.mock.calls.find(call => call[0] === 'Metrics report');
			const metrics = reportCall?.[1]?.['metrics'] as any;

			expect(metrics.test.count).toBe(10);
			expect(metrics.test.p50).toBeGreaterThan(40);
			expect(metrics.test.p50).toBeLessThanOrEqual(60);
			expect(metrics.test.p95).toBeGreaterThan(80);
			expect(metrics.test.p99).toBeGreaterThan(90);
		});

		it('should clear metrics after reporting', () => {
			service.incrementCounter('test_counter');

			const metricsMapBefore = service['metrics'];
			expect(metricsMapBefore.size).toBe(1);

			jest.advanceTimersByTime(60000);

			const metricsMapAfter = service['metrics'];
			expect(metricsMapAfter.size).toBe(0);
		});

		it('should not report if no metrics collected', () => {
			jest.advanceTimersByTime(60000);

			const reportCalls = logger.info.mock.calls.filter(call => call[0] === 'Metrics report');
			expect(reportCalls).toHaveLength(0);
		});
	});

	describe('getKey', () => {
		it('should generate key without labels', () => {
			const key = service['getKey']('metric_name');
			expect(key).toBe('metric_name');
		});

		it('should generate key with labels', () => {
			const key = service['getKey']('metric_name', { status: 'success', code: '200' });
			expect(key).toBe('metric_name{code="200",status="success"}');
		});

		it('should sort labels alphabetically', () => {
			const key1 = service['getKey']('metric', { z: 'last', a: 'first' });
			const key2 = service['getKey']('metric', { a: 'first', z: 'last' });

			expect(key1).toBe(key2);
			expect(key1).toBe('metric{a="first",z="last"}');
		});
	});

	describe('percentile', () => {
		it('should calculate p50 (median)', () => {
			const values = [1, 2, 3, 4, 5];
			const p50 = service['percentile'](values, 0.5);
			expect(p50).toBe(3);
		});

		it('should calculate p95', () => {
			const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
			const p95 = service['percentile'](values, 0.95);
			// p95 of 10 values at index Math.ceil(10 * 0.95) - 1 = 9 - 1 = 8, which is value 9 or 10
			expect(p95).toBeGreaterThanOrEqual(9);
			expect(p95).toBeLessThanOrEqual(10);
		});

		it('should calculate p99', () => {
			const values = Array.from({ length: 100 }, (_, i) => i + 1);
			const p99 = service['percentile'](values, 0.99);
			expect(p99).toBe(99);
		});
	});
});
