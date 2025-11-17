import { Controller, Post, Get, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { LoggerService } from '../../../../common/logging/logger.service';
import { TracingService } from '../../../../common/tracing/tracing.service';
import { MetricsService } from '../../../../common/metrics/metrics.service';

export interface AuthDto {
	email?: string | null;
	password?: string | null;
}

@Controller('auth')
export class AuthController {
	constructor(
		private readonly logger: LoggerService,
		private readonly tracing: TracingService,
		private readonly metrics: MetricsService,
	) {}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@UseGuards(LocalAuthGuard)
	async authenticate(@Req() req: Request) {
		return this.tracing.traceOperation('auth.login', async span => {
			const user = req.user as any;

			this.logger.info('User login attempt', {
				userId: user?.id,
				email: user?.email,
				ip: req.ip,
			});

			span.setAttribute('user.id', user?.id || 'unknown');
			span.setAttribute('user.email', user?.email || 'unknown');

			// The LocalAuthGuard validates credentials and sets req.user,
			// but we need to explicitly establish the session
			await new Promise<void>((resolve, reject) => {
				req.login(req.user!, err => {
					if (err) {
						this.logger.error('Login session establishment failed', err);
						this.metrics.trackAuthEvent('login_failure', user?.id);
						reject(err);
					} else {
						this.logger.info('User logged in successfully', { userId: user?.id });
						this.metrics.trackAuthEvent('login_success', user?.id);
						resolve();
					}
				});
			});

			return req.user;
		});
	}

	@Post('logout')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthenticatedGuard)
	async logout(@Req() request: Request): Promise<void> {
		return this.tracing.traceOperation('auth.logout', async span => {
			const user = request.user as any;

			this.logger.info('User logout attempt', { userId: user?.id });
			span.setAttribute('user.id', user?.id || 'unknown');

			return new Promise<void>((resolve, reject) => {
				request.logout(err => {
					if (err) {
						this.logger.error('Logout failed', err);
						reject(err);
						return;
					}
					// Destroy the session completely to prevent stale session issues
					request.session.destroy(sessionErr => {
						if (sessionErr) {
							this.logger.error('Session destruction failed', sessionErr);
							reject(sessionErr);
						} else {
							this.logger.info('User logged out successfully', { userId: user?.id });
							this.metrics.trackAuthEvent('logout', user?.id);
							resolve();
						}
					});
				});
			});
		});
	}

	@Get('me')
	@UseGuards(AuthenticatedGuard)
	async getCurrentUser(@Req() request: Request) {
		const user = request.user as any;
		this.logger.debug('Get current user', { userId: user?.id });
		return request.user;
	}
}
