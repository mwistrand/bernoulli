import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

import { UserController } from './user.controller';
import { AuthService } from '../../../../core/services/auth/auth.service';
import type { CreateUserCommand } from '../../../../core/commands/user.command';
import { UserRole, type User } from '../../../../core/models/auth/user.model';

describe('UserController', () => {
	let controller: UserController;
	let authService: jest.Mocked<AuthService>;

	const mockUser: User = {
		id: 'user-123',
		email: 'test@example.com',
		name: 'Test User',
		role: UserRole.ADMIN,
	};

	beforeEach(async () => {
		const mockAuthService = {
			createUser: jest.fn(),
			authenticate: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [UserController],
			providers: [
				{
					provide: AuthService,
					useValue: mockAuthService,
				},
			],
		}).compile();

		controller = module.get<UserController>(UserController);
		authService = module.get(AuthService);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('createUser', () => {
		const validCommand: CreateUserCommand = {
			email: 'newuser@example.com',
			password: 'securePassword123',
			name: 'New User',
		};

		it('should create a user successfully and establish session', async () => {
			authService.createUser.mockResolvedValue(mockUser);

			const mockRequest = {
				login: jest.fn((user, callback) => callback()),
			} as unknown as Request;

			const result = await controller.createUser(validCommand, mockRequest);

			expect(result).toEqual(mockUser);
			expect(authService.createUser).toHaveBeenCalledWith(validCommand);
			expect(mockRequest.login).toHaveBeenCalledWith(mockUser, expect.any(Function));
		});

		it('should automatically log in the user after signup', async () => {
			authService.createUser.mockResolvedValue(mockUser);

			const mockRequest = {
				login: jest.fn((user, callback) => callback()),
			} as unknown as Request;

			await controller.createUser(validCommand, mockRequest);

			expect(mockRequest.login).toHaveBeenCalledWith(mockUser, expect.any(Function));
		});

		it('should call req.login with the created user', async () => {
			const customUser: User = {
				id: 'custom-id-456',
				email: 'custom@example.com',
				name: 'Custom User',
				role: UserRole.USER,
			};
			authService.createUser.mockResolvedValue(customUser);

			const mockRequest = {
				login: jest.fn((user, callback) => callback()),
			} as unknown as Request;

			await controller.createUser(validCommand, mockRequest);

			expect(mockRequest.login).toHaveBeenCalledWith(customUser, expect.any(Function));
		});

		it('should propagate validation errors from AuthService', async () => {
			const error = new BadRequestException('Invalid email format');
			authService.createUser.mockRejectedValue(error);

			const mockRequest = {
				login: jest.fn(),
			} as unknown as Request;

			await expect(controller.createUser(validCommand, mockRequest)).rejects.toThrow(error);
			expect(mockRequest.login).not.toHaveBeenCalled();
		});

		it('should not call login if user creation fails', async () => {
			const error = new BadRequestException('Invalid email format');
			authService.createUser.mockRejectedValue(error);

			const mockRequest = {
				login: jest.fn(),
			} as unknown as Request;

			try {
				await controller.createUser(validCommand, mockRequest);
			} catch {
				// Expected to throw
			}

			expect(mockRequest.login).not.toHaveBeenCalled();
		});

		it('should handle missing email in command', async () => {
			const invalidCommand = { ...validCommand, email: '' };
			const error = new BadRequestException('Invalid email');
			authService.createUser.mockRejectedValue(error);

			const mockRequest = {
				login: jest.fn(),
			} as unknown as Request;

			await expect(controller.createUser(invalidCommand, mockRequest)).rejects.toThrow(error);
		});

		it('should handle missing password in command', async () => {
			const invalidCommand = { ...validCommand, password: '' };
			const error = new BadRequestException('Invalid password');
			authService.createUser.mockRejectedValue(error);

			const mockRequest = {
				login: jest.fn(),
			} as unknown as Request;

			await expect(controller.createUser(invalidCommand, mockRequest)).rejects.toThrow(error);
		});

		it('should handle missing name in command', async () => {
			const invalidCommand = { ...validCommand, name: '' };
			const error = new BadRequestException('Invalid name');
			authService.createUser.mockRejectedValue(error);

			const mockRequest = {
				login: jest.fn(),
			} as unknown as Request;

			await expect(controller.createUser(invalidCommand, mockRequest)).rejects.toThrow(error);
		});

		it('should return the created user object', async () => {
			authService.createUser.mockResolvedValue(mockUser);

			const mockRequest = {
				login: jest.fn((user, callback) => callback()),
			} as unknown as Request;

			const result = await controller.createUser(validCommand, mockRequest);

			expect(result).toHaveProperty('id');
			expect(result).toHaveProperty('email');
			expect(result).toHaveProperty('name');
		});

		it('should reject if login fails', async () => {
			authService.createUser.mockResolvedValue(mockUser);

			const loginError = new Error('Login failed');
			const mockRequest = {
				login: jest.fn((user, callback) => callback(loginError)),
			} as unknown as Request;

			await expect(controller.createUser(validCommand, mockRequest)).rejects.toThrow(
				'Login failed',
			);
		});
	});
});
