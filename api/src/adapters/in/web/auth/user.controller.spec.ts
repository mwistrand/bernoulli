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

		it('should propagate validation errors from AuthService', async () => {
			const error = new BadRequestException('Invalid email format');
			authService.createUser.mockRejectedValue(error);

			const mockRequest = {
				login: jest.fn(),
			} as unknown as Request;

			await expect(controller.createUser(validCommand, mockRequest)).rejects.toThrow(error);
			expect(mockRequest.login).not.toHaveBeenCalled();
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
