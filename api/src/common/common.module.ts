import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logging/logger.service';
import { TracingService } from './tracing/tracing.service';
import { MetricsService } from './metrics/metrics.service';

/**
 * Global module providing logging, tracing, and metrics services
 * to all modules in the application.
 */
@Global()
@Module({
	providers: [LoggerService, TracingService, MetricsService],
	exports: [LoggerService, TracingService, MetricsService],
})
export class CommonModule {}
