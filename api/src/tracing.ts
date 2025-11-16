import { NodeSDK } from '@opentelemetry/sdk-node';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';

/**
 * OpenTelemetry Tracing Configuration
 *
 * This file initializes OpenTelemetry instrumentation for the NestJS application.
 * It must be imported BEFORE any other application code to ensure automatic
 * instrumentation works correctly.
 *
 * Key Concepts:
 * - NodeSDK: Core OpenTelemetry SDK that manages tracing lifecycle
 * - Resource: Identifies the service (service.name, service.version, etc.)
 * - Exporter: Sends trace data to Jaeger via OTLP HTTP protocol
 * - Instrumentations: Automatically instruments libraries for this application:
 *   - HTTP/HTTPS requests (incoming and outgoing)
 *   - Express middleware and routes
 *   - PostgreSQL database queries
 *
 * Environment Variables:
 * - OTEL_EXPORTER_OTLP_ENDPOINT: Jaeger collector endpoint (default: http://localhost:4318)
 * - OTEL_SERVICE_NAME: Service name for traces (default: bernoulli-api)
 * - NODE_ENV: If 'production', enables tracing; if 'test', disables it
 */

// Determine if tracing should be enabled
const isTracingEnabled = process.env['NODE_ENV'] !== 'test';

let sdk: NodeSDK | undefined;

if (isTracingEnabled) {
	const exporterUrl =
		process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] || 'http://localhost:4318/v1/traces';

	// Ensure URL includes the full path
	const fullUrl = exporterUrl.endsWith('/v1/traces') ? exporterUrl : `${exporterUrl}/v1/traces`;

	console.log(`Configuring OpenTelemetry exporter to send traces to: ${fullUrl}`);

	// Configure the OTLP exporter to send traces to Jaeger
	const traceExporter = new OTLPTraceExporter({
		url: fullUrl,
	});

	// Create a resource to identify this service
	const resource = resourceFromAttributes({
		['service.name']: process.env['OTEL_SERVICE_NAME'] || 'bernoulli-api',
	});

	// Initialize the OpenTelemetry SDK
	sdk = new NodeSDK({
		resource,
		traceExporter,
		instrumentations: [
			// Instrument HTTP requests (incoming and outgoing)
			new HttpInstrumentation(),
			// Instrument Express middleware and routes
			new ExpressInstrumentation(),
			// Instrument PostgreSQL queries
			new PgInstrumentation(),
		],
	});

	// Start the SDK
	sdk.start();
	console.log('OpenTelemetry tracing initialized successfully');

	// Graceful shutdown on process termination
	process.on('SIGTERM', () => {
		sdk?.shutdown()
			.then(() => console.log('OpenTelemetry SDK shut down successfully'))
			.catch(error => console.error('Error shutting down OpenTelemetry SDK', error));
	});
} else {
	console.log('OpenTelemetry tracing disabled (NODE_ENV=test)');
}

export default sdk;
