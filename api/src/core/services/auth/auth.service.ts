import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { User } from '../../models/auth/user.model';
import { AUTH_PORT, AuthPort } from '../../ports/out/auth/auth.port';
import { CreateUserCommand } from '../../commands/user.command';

// Email validation regex - RFC 5322 compliant
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

@Injectable()
export class AuthService {
	constructor(@Inject(AUTH_PORT) private readonly authPort: AuthPort) {}

	async authenticate(email?: string | null, password?: string | null): Promise<User> {
		if (email == null || email.trim() === '') {
			throw new BadRequestException('You must provide an email');
		}
		if (password == null || password.trim() === '') {
			throw new BadRequestException('You must provide a password');
		}

		return this.authPort.authenticate(email.trim().toLowerCase(), password);
	}

	async createUser(command: CreateUserCommand): Promise<User> {
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

		return this.authPort.createUser(crypto.randomUUID(), normalizedCommand);
	}

	async findById(id: string): Promise<User> {
		return this.authPort.findById(id);
	}

	async findAllUsers(): Promise<User[]> {
		return this.authPort.findAllUsers();
	}
}
