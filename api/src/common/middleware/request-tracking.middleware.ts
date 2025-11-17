import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logging/logger.service';
import { trace, context } from '@opentelemetry/api';

/**
 * Request tracking for DDoS detection and monitoring.
 * Tracks request rates per IP address and logs suspicious patterns.
 */
@Injectable()
export class RequestTrackingMiddleware implements NestMiddleware {
	private requestCounts: Map<
		string,
		{ count: number; firstRequest: number; lastRequest: number }
	> = new Map();
	private readonly WINDOW_MS = 60000; // 1 minute window
	private readonly REQUEST_COUNT_THRESHOLD = 100;
	private readonly WARNING_THRESHOLD = 100; // requests per minute
	private readonly CRITICAL_THRESHOLD = 300; // requests per minute
	private readonly CLEANUP_INTERVAL = 300000; // Clean up old entries every 5 minutes

	constructor(private readonly logger: LoggerService) {
		// Periodically clean up old entries to prevent memory leaks
		setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
	}

	use(req: Request, res: Response, next: NextFunction) {
		const startTime = Date.now();
		const ip = this.getClientIp(req);
		const correlationId = this.generateCorrelationId();

		// Store correlation ID in request for downstream use
		(req as any).correlationId = correlationId;

		// Add correlation ID to trace span
		const span = trace.getSpan(context.active());
		if (span) {
			span.setAttribute('correlation.id', correlationId);
			span.setAttribute('client.ip', ip);
			span.setAttribute('user.agent', req.headers['user-agent'] || 'unknown');
		}

		// Track request rate per IP
		this.trackRequest(ip, req);

		// Log request start
		this.logger.debug('Request started', {
			correlationId,
			method: req.method,
			path: req.path,
			ip,
			userAgent: req.headers['user-agent'],
		});

		// Capture response
		res.on('finish', () => {
			const duration = Date.now() - startTime;
			const userId = (req.user as any)?.id;

			// Log request completion with detailed metrics
			this.logger.request(req.method, req.path, res.statusCode, duration, {
				correlationId,
				ip,
				userId,
				userAgent: req.headers['user-agent'],
				referer: req.headers['referer'],
			});

			// Alert on slow requests
			if (duration > 5000) {
				this.logger.warn('Slow request detected', {
					correlationId,
					method: req.method,
					path: req.path,
					duration,
					statusCode: res.statusCode,
				});
			}
		});

		next();
	}

	/**
	 * Extract client IP address from request, considering proxies
	 */
	private getClientIp(req: Request): string {
		const forwardedFor = req.headers['x-forwarded-for'];
		if (forwardedFor) {
			const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
			return ips.split(',')[0].trim();
		}
		return req.ip || req.socket.remoteAddress || 'unknown';
	}

	/**
	 * Generate a unique correlation ID for request tracking
	 */
	private generateCorrelationId(): string {
		return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
	}

	/**
	 * Track request rates per IP and detect potential DDoS attacks
	 */
	private trackRequest(ip: string, req: Request) {
		const now = Date.now();
		const tracking = this.requestCounts.get(ip);

		if (!tracking) {
			this.requestCounts.set(ip, {
				count: 1,
				firstRequest: now,
				lastRequest: now,
			});
			return;
		}

		// Reset counter if outside the window
		if (now - tracking.firstRequest > this.WINDOW_MS) {
			this.requestCounts.set(ip, {
				count: 1,
				firstRequest: now,
				lastRequest: now,
			});
			return;
		}

		// Increment counter
		tracking.count++;
		tracking.lastRequest = now;

		// Check for suspicious patterns
		if (tracking.count >= this.CRITICAL_THRESHOLD) {
			this.logger.security('Potential DDoS attack detected', {
				ip,
				totalRequests: tracking.count,
				windowMs: now - tracking.firstRequest,
				method: req.method,
				path: req.path,
				userAgent: req.headers['user-agent'],
				severity: 'CRITICAL',
			});
		} else if (tracking.count >= this.WARNING_THRESHOLD) {
			this.logger.security('High request rate detected', {
				ip,
				totalRequests: tracking.count,
				windowMs: now - tracking.firstRequest,
				method: req.method,
				path: req.path,
				userAgent: req.headers['user-agent'],
				severity: 'WARNING',
			});
		}
	}

	/**
	 * Clean up old tracking entries to prevent memory leaks
	 */
	private cleanup() {
		const now = Date.now();
		const ipsToDelete: string[] = [];

		for (const [ip, tracking] of this.requestCounts.entries()) {
			if (now - tracking.lastRequest > this.WINDOW_MS * 2) {
				ipsToDelete.push(ip);
			}
		}

		ipsToDelete.forEach(ip => this.requestCounts.delete(ip));

		if (ipsToDelete.length > 0) {
			this.logger.debug('Cleaned up request tracking data', {
				entriesRemoved: ipsToDelete.length,
				remainingEntries: this.requestCounts.size,
			});
		}
	}
}
