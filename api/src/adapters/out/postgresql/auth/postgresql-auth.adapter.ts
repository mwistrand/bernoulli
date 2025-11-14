import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User } from '../../../../core/models/auth/user.model';
import { AuthPort } from '../../../../core/ports/out/auth/auth.port';
import { UserEntity } from './entities/user.entity';
import { CreateUserCommand } from 'src/core/commands/create-user.command';

export function toUser({ id, name, email }: UserEntity): User {
	return { id, name, email };
}

@Injectable()
export class PostgreSQLAuthAdapter implements AuthPort {
	constructor(
		@InjectRepository(UserEntity) private readonly usersRepository: Repository<UserEntity>,
	) {}

	async authenticate(username: string, password: string): Promise<User> {
		const entity = await this.usersRepository
			.createQueryBuilder('user')
			.addSelect('user.password')
			.where('user.email = :email', { email: username })
			.getOne();
		if (!entity) {
			throw new UnauthorizedException('Unrecognized username or password');
		}

		const isMatch = await bcrypt.compare(password, entity?.password);
		if (!isMatch) {
			throw new UnauthorizedException('Unrecognized username or password');
		}

		return toUser(entity);
	}

	async createUser(id: string, command: CreateUserCommand): Promise<User> {
		// Use 12 rounds for bcrypt (2024 security best practice)
		const hashedPassword = await bcrypt.hash(command.password, 12);
		const { name, email } = command;

		try {
			const createdAt = new Date();
			const entity = this.usersRepository.create({
				id,
				name,
				email,
				password: hashedPassword,
				createdAt,
				lastUpdatedAt: createdAt,
			});
			await this.usersRepository.insert(entity);
			return { id, name, email };
		} catch (error: any) {
			// Check for unique constraint violation (Postgres error code '23505')
			if (error.code === '23505') {
				throw new ConflictException('Email already exists');
			}
			throw error;
		}
	}
}
