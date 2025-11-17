import { Test, TestingModule } from '@nestjs/testing';
import { TracingService } from './tracing.service';
import * as otelApi from '@opentelemetry/api';

describe('TracingService', () => {
	let service: TracingService;
	let mockSpan: jest.Mocked<otelApi.Span>;
	let mockTracer: jest.Mocked<otelApi.Tracer>;

	beforeEach(async () => {
		// Mock span
		mockSpan = {
			setAttribute: jest.fn(),
			setAttributes: jest.fn(),
			addEvent: jest.fn(),
			setStatus: jest.fn(),
			recordException: jest.fn(),
			end: jest.fn(),
			spanContext: jest.fn(),
			updateName: jest.fn(),
			isRecording: jest.fn(),
		} as any;

		// Mock tracer
		mockTracer = {
			startSpan: jest.fn().mockReturnValue(mockSpan),
		} as any;

		// Mock trace.getTracer BEFORE creating the service
		jest.spyOn(otelApi.trace, 'getTracer').mockReturnValue(mockTracer);

		const module: TestingModule = await Test.createTestingModule({
			providers: [TracingService],
		}).compile();

		service = module.get<TracingService>(TracingService);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('traceOperation', () => {
		it('should create a span and execute function', async () => {
			// Mock context.with to actually call the callback and return its result
			jest.spyOn(otelApi.context, 'with').mockImplementation((_, fn: any) => fn());

			const fn = jest.fn().mockResolvedValue('result');

			const result = await service.traceOperation('test.operation', fn);

			expect(mockTracer.startSpan).toHaveBeenCalledWith(
				'test.operation',
				expect.objectContaining({
					kind: otelApi.SpanKind.INTERNAL,
				}),
			);
			expect(fn).toHaveBeenCalledWith(mockSpan);
			expect(mockSpan.setStatus).toHaveBeenCalledWith({
				code: otelApi.SpanStatusCode.OK,
			});
			expect(mockSpan.end).toHaveBeenCalled();
			expect(result).toBe('result');
		});

		it('should add custom attributes to span', async () => {
			jest.spyOn(otelApi.context, 'with').mockImplementation((_, fn: any) => fn());

			const fn = jest.fn().mockResolvedValue('result');
			const attributes = {
				'user.id': 'user-123',
				'project.id': 'project-456',
			};

			await service.traceOperation('test.operation', fn, attributes);

			expect(mockTracer.startSpan).toHaveBeenCalledWith(
				'test.operation',
				expect.objectContaining({
					attributes,
				}),
			);
		});

		it('should handle errors and record them in span', async () => {
			jest.spyOn(otelApi.context, 'with').mockImplementation((_, fn: any) => fn());

			const error = new Error('Test error');
			const fn = jest.fn().mockRejectedValue(error);

			await expect(service.traceOperation('test.operation', fn)).rejects.toThrow(
				'Test error',
			);

			expect(mockSpan.recordException).toHaveBeenCalledWith(error);
			expect(mockSpan.setStatus).toHaveBeenCalledWith({
				code: otelApi.SpanStatusCode.ERROR,
				message: 'Test error',
			});
			expect(mockSpan.end).toHaveBeenCalled();
		});
	});

	describe('addEvent', () => {
		it('should add event to current span', () => {
			jest.spyOn(otelApi.trace, 'getSpan').mockReturnValue(mockSpan);

			service.addEvent('user.logged_in', { userId: '123' });

			expect(mockSpan.addEvent).toHaveBeenCalledWith('user.logged_in', { userId: '123' });
		});

		it('should not throw if no active span', () => {
			jest.spyOn(otelApi.trace, 'getSpan').mockReturnValue(undefined);

			expect(() => service.addEvent('test.event')).not.toThrow();
		});
	});

	describe('setAttributes', () => {
		it('should set attributes on current span', () => {
			jest.spyOn(otelApi.trace, 'getSpan').mockReturnValue(mockSpan);

			service.setAttributes({
				'user.id': 'user-123',
				'request.id': 'req-456',
			});

			expect(mockSpan.setAttribute).toHaveBeenCalledWith('user.id', 'user-123');
			expect(mockSpan.setAttribute).toHaveBeenCalledWith('request.id', 'req-456');
		});

		it('should not throw if no active span', () => {
			jest.spyOn(otelApi.trace, 'getSpan').mockReturnValue(undefined);

			expect(() =>
				service.setAttributes({
					'user.id': 'user-123',
				}),
			).not.toThrow();
		});
	});

	describe('recordException', () => {
		it('should record exception on current span', () => {
			jest.spyOn(otelApi.trace, 'getSpan').mockReturnValue(mockSpan);
			const error = new Error('Test error');

			service.recordException(error);

			expect(mockSpan.recordException).toHaveBeenCalledWith(error);
			expect(mockSpan.setStatus).toHaveBeenCalledWith({
				code: otelApi.SpanStatusCode.ERROR,
				message: 'Test error',
			});
		});

		it('should not throw if no active span', () => {
			jest.spyOn(otelApi.trace, 'getSpan').mockReturnValue(undefined);
			const error = new Error('Test error');

			expect(() => service.recordException(error)).not.toThrow();
		});
	});
});
