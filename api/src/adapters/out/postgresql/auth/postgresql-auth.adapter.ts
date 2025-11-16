import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { User } from '../../../../core/models/auth/user.model';
import { AuthPort } from '../../../../core/ports/out/auth/auth.port';
import { CreateUserCommand } from '../../../../core/commands/user.command';
import { UserEntity } from './entities/user.entity';

export function toUser({ id, name, email, role }: UserEntity): User {
	return { id, name, email, role };
}

@Injectable()
export class PostgreSQLAuthAdapter implements AuthPort {
	constructor(
		@InjectRepository(UserEntity) private readonly usersRepository: Repository<UserEntity>,
		private readonly i18n: I18nService,
	) {}

	async authenticate(username: string, password: string): Promise<User> {
		const entity = await this.usersRepository
			.createQueryBuilder('user')
			.addSelect('user.password')
			.where('user.email = :email', { email: username })
			.getOne();
		if (!entity) {
			throw new UnauthorizedException(
				this.i18n.t('auth.errors.unrecognized_credentials', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		const isMatch = await bcrypt.compare(password, entity?.password);
		if (!isMatch) {
			throw new UnauthorizedException(
				this.i18n.t('auth.errors.unrecognized_credentials', {
					lang: I18nContext.current()?.lang,
				}),
			);
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
			return toUser(entity);
		} catch (error: any) {
			// Check for unique constraint violation (Postgres error code '23505')
			if (error.code === '23505') {
				throw new ConflictException(
					this.i18n.t('auth.errors.email_exists', {
						lang: I18nContext.current()?.lang,
					}),
				);
			}
			throw error;
		}
	}

	async findById(id: string): Promise<User> {
		const entity = await this.usersRepository.findOne({ where: { id } });
		if (!entity) {
			throw new UnauthorizedException('User not found');
		}
		return toUser(entity);
	}

	async findAllUsers(): Promise<User[]> {
		const entities = await this.usersRepository.find({
			order: { name: 'ASC' },
		});
		return entities.map(toUser);
	}

	async deleteUser(id: string): Promise<void> {
		const entity = await this.usersRepository.findOne({ where: { id } });
		if (!entity) {
			throw new UnauthorizedException('User not found');
		}
		await this.usersRepository.delete({ id });
	}
}
