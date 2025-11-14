import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

import { PostgreSQLAuthAdapter, toUser } from './postgresql-auth.adapter';
import { UserEntity } from './entities/user.entity';
import { CreateUserCommand } from '../../../../core/commands/create-user.command';
import { User } from '../../../../core/models/auth/user.model';

// Mock bcrypt
jest.mock('bcrypt');

describe('PostgreSQLAuthAdapter', () => {
	let adapter: PostgreSQLAuthAdapter;
	let repository: jest.Mocked<Repository<UserEntity>>;

	const mockUserEntity: UserEntity = {
		id: 'user-123',
		email: 'test@example.com',
		name: 'Test User',
		password: 'hashed-password',
		createdAt: new Date('2024-01-01'),
		lastUpdatedAt: new Date('2024-01-01'),
	};

	beforeEach(async () => {
		const mockRepository = {
			findOneBy: jest.fn(),
			create: jest.fn(),
			insert: jest.fn(),
			save: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PostgreSQLAuthAdapter,
				{
					provide: getRepositoryToken(UserEntity),
					useValue: mockRepository,
				},
			],
		}).compile();

		adapter = module.get<PostgreSQLAuthAdapter>(PostgreSQLAuthAdapter);
		repository = module.get(getRepositoryToken(UserEntity));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(adapter).toBeDefined();
	});

	describe('toUser', () => {
		it('should convert UserEntity to User', () => {
			const result = toUser(mockUserEntity);

			expect(result).toEqual({
				id: 'user-123',
				email: 'test@example.com',
				name: 'Test User',
			});
		});

		it('should exclude password and timestamps', () => {
			const result = toUser(mockUserEntity);

			expect(result).not.toHaveProperty('password');
			expect(result).not.toHaveProperty('createdAt');
			expect(result).not.toHaveProperty('lastUpdatedAt');
		});
	});

	describe('authenticate', () => {
		it('should authenticate a user successfully', async () => {
			repository.findOneBy.mockResolvedValue(mockUserEntity);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);

			const result = await adapter.authenticate('test@example.com', 'password123');

			expect(result).toEqual({
				id: 'user-123',
				email: 'test@example.com',
				name: 'Test User',
			});
			expect(repository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
			expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
		});

		it('should throw UnauthorizedException when user is not found', async () => {
			repository.findOneBy.mockResolvedValue(null);

			await expect(
				adapter.authenticate('nonexistent@example.com', 'password123'),
			).rejects.toThrow(new UnauthorizedException('Unrecognized username or password'));

			expect(repository.findOneBy).toHaveBeenCalledWith({
				email: 'nonexistent@example.com',
			});
			expect(bcrypt.compare).not.toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when password does not match', async () => {
			repository.findOneBy.mockResolvedValue(mockUserEntity);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			await expect(adapter.authenticate('test@example.com', 'wrongpassword')).rejects.toThrow(
				new UnauthorizedException('Unrecognized username or password'),
			);

			expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashed-password');
		});

		it('should use the same error message for user not found and wrong password', async () => {
			repository.findOneBy.mockResolvedValue(null);
			const userNotFoundError = adapter
				.authenticate('nonexistent@example.com', 'password')
				.catch(e => e.message);

			repository.findOneBy.mockResolvedValue(mockUserEntity);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);
			const wrongPasswordError = adapter
				.authenticate('test@example.com', 'wrongpassword')
				.catch(e => e.message);

			const [msg1, msg2] = await Promise.all([userNotFoundError, wrongPasswordError]);
			expect(msg1).toBe(msg2);
		});

		it('should query by email field', async () => {
			repository.findOneBy.mockResolvedValue(mockUserEntity);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);

			await adapter.authenticate('user@test.com', 'password');

			expect(repository.findOneBy).toHaveBeenCalledWith({ email: 'user@test.com' });
		});
	});

	describe('createUser', () => {
		const validCommand: CreateUserCommand = {
			email: 'newuser@example.com',
			password: 'securePassword123',
			name: 'New User',
		};

		const userId = 'new-user-id-123';

		beforeEach(() => {
			(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password-123');
			repository.create.mockReturnValue(mockUserEntity);
			repository.insert.mockResolvedValue(undefined as any);
		});

		it('should create a user successfully', async () => {
			const result = await adapter.createUser(userId, validCommand);

			expect(result).toEqual({
				id: userId,
				email: validCommand.email,
				name: validCommand.name,
			});
			expect(bcrypt.hash).toHaveBeenCalledWith(validCommand.password, 12);
		});

		it('should hash password with 12 rounds', async () => {
			await adapter.createUser(userId, validCommand);

			expect(bcrypt.hash).toHaveBeenCalledWith('securePassword123', 12);
		});

		it('should create user entity with correct data', async () => {
			await adapter.createUser(userId, validCommand);

			expect(repository.create).toHaveBeenCalledWith({
				id: userId,
				name: 'New User',
				email: 'newuser@example.com',
				password: 'hashed-password-123',
				createdAt: expect.any(Date),
				lastUpdatedAt: expect.any(Date),
			});
		});

		it('should set createdAt and lastUpdatedAt to the same value', async () => {
			await adapter.createUser(userId, validCommand);

			const createCall = repository.create.mock.calls[0][0];
			expect(createCall.createdAt).toEqual(createCall.lastUpdatedAt);
		});

		it('should insert user entity into repository', async () => {
			repository.create.mockReturnValue(mockUserEntity);

			await adapter.createUser(userId, validCommand);

			expect(repository.insert).toHaveBeenCalledWith(mockUserEntity);
		});

		it('should return user without password', async () => {
			const result = await adapter.createUser(userId, validCommand);

			expect(result).not.toHaveProperty('password');
			expect(result).toHaveProperty('id');
			expect(result).toHaveProperty('email');
			expect(result).toHaveProperty('name');
		});

		it('should throw ConflictException on duplicate email', async () => {
			const duplicateError = { code: '23505' };
			repository.insert.mockRejectedValue(duplicateError);

			await expect(adapter.createUser(userId, validCommand)).rejects.toThrow(
				new ConflictException('Email already exists'),
			);
		});

		it('should re-throw non-duplicate errors', async () => {
			const genericError = new Error('Database connection failed');
			repository.insert.mockRejectedValue(genericError);

			await expect(adapter.createUser(userId, validCommand)).rejects.toThrow(genericError);
		});

		it('should handle database errors with different error codes', async () => {
			const otherError = { code: '23503' }; // Foreign key violation
			repository.insert.mockRejectedValue(otherError);

			await expect(adapter.createUser(userId, validCommand)).rejects.toEqual(otherError);
		});

		it('should use provided user id', async () => {
			const customId = 'custom-uuid-456';
			const result = await adapter.createUser(customId, validCommand);

			expect(result.id).toBe(customId);
			expect(repository.create).toHaveBeenCalledWith(
				expect.objectContaining({ id: customId }),
			);
		});

		it('should handle different passwords by hashing each uniquely', async () => {
			(bcrypt.hash as jest.Mock)
				.mockResolvedValueOnce('hashed-password-1')
				.mockResolvedValueOnce('hashed-password-2');

			await adapter.createUser('id-1', { ...validCommand, password: 'password1' });
			await adapter.createUser('id-2', { ...validCommand, password: 'password2' });

			expect(bcrypt.hash).toHaveBeenCalledWith('password1', 12);
			expect(bcrypt.hash).toHaveBeenCalledWith('password2', 12);
		});
	});
});
