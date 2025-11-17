import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { User } from '../../models/auth/user.model';
import { AUTH_PORT, AuthPort } from '../../ports/out/auth/auth.port';
import { CreateUserCommand } from '../../commands/user.command';
import { LoggerService } from '../../../common/logging/logger.service';
import { TracingService } from '../../../common/tracing/tracing.service';
import { MetricsService } from '../../../common/metrics/metrics.service';

// Email validation regex - RFC 5322 compliant
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

@Injectable()
export class AuthService {
	constructor(
		@Inject(AUTH_PORT) private readonly authPort: AuthPort,
		private readonly logger: LoggerService,
		private readonly tracing: TracingService,
		private readonly metrics: MetricsService,
	) {}

	async authenticate(email?: string | null, password?: string | null): Promise<User> {
		return this.tracing.traceOperation('auth.service.authenticate', async span => {
			if (email == null || email.trim() === '') {
				this.logger.security('Authentication failed: missing email', {});
				this.metrics.trackAuthEvent('login_failure');
				throw new BadRequestException('You must provide an email');
			}
			if (password == null || password.trim() === '') {
				this.logger.security('Authentication failed: missing password', { email });
				this.metrics.trackAuthEvent('login_failure');
				throw new BadRequestException('You must provide a password');
			}

			const normalizedEmail = email.trim().toLowerCase();
			span.setAttribute('user.email', normalizedEmail);

			try {
				const user = await this.authPort.authenticate(normalizedEmail, password);
				this.logger.info('User authenticated successfully', {
					userId: user.id,
					email: normalizedEmail,
				});
				this.metrics.trackBusinessOperation('auth.authenticate', true);
				return user;
			} catch (error) {
				this.logger.security('Authentication failed: invalid credentials', {
					email: normalizedEmail,
				});
				this.metrics.trackAuthEvent('login_failure');
				this.metrics.trackBusinessOperation('auth.authenticate', false);
				throw error;
			}
		});
	}

	async createUser(command: CreateUserCommand): Promise<User> {
		return this.tracing.traceOperation('auth.service.createUser', async span => {
			if (!command) {
				throw new BadRequestException('Missing email, password, and name.');
			}
			if (!command.email?.trim()) {
				throw new BadRequestException('Invalid email');
			}
			if (!EMAIL_REGEX.test(command.email.trim())) {
				throw new BadRequestException('Invalid email format');
			}
			if (!command.password?.trim()) {
				throw new BadRequestException('Invalid password');
			}
			if (command.password.length < MIN_PASSWORD_LENGTH) {
				throw new BadRequestException(
					`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
				);
			}
			if (!command.name?.trim()) {
				throw new BadRequestException('Invalid name');
			}

			// Normalize email to lowercase to prevent duplicate accounts with different casing
			const normalizedCommand = {
				...command,
				email: command.email.trim().toLowerCase(),
			};

			span.setAttribute('user.email', normalizedCommand.email);
			span.setAttribute('user.name', normalizedCommand.name);

			try {
				const startTime = Date.now();
				const user = await this.authPort.createUser(crypto.randomUUID(), normalizedCommand);
				const duration = Date.now() - startTime;

				this.logger.info('User created successfully', {
					userId: user.id,
					email: user.email,
				});
				this.metrics.trackBusinessOperation('auth.createUser', true, duration);

				return user;
			} catch (error) {
				this.logger.error('User creation failed', error as Error, {
					email: normalizedCommand.email,
				});
				this.metrics.trackBusinessOperation('auth.createUser', false);
				throw error;
			}
		});
	}

	async findById(id: string): Promise<User> {
		return this.authPort.findById(id);
	}

	async findAllUsers(): Promise<User[]> {
		return this.authPort.findAllUsers();
	}

	async deleteUser(id: string): Promise<void> {
		if (!id || id.trim() === '') {
			throw new BadRequestException('User ID is required');
		}
		return this.authPort.deleteUser(id);
	}
}
