import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { UsersController } from './users.controller';
import { AuthService } from '../../../../core/services/auth/auth.service';
import type { CreateUserCommand } from '../../../../core/commands/create-user.command';
import type { User } from '../../../../core/models/auth/user.model';
import type { Session } from './session.types';

describe('UsersController', () => {
	let controller: UsersController;
	let authService: jest.Mocked<AuthService>;

	const mockUser: User = {
		id: 'user-123',
		email: 'test@example.com',
		name: 'Test User',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(async () => {
		const mockAuthService = {
			createUser: jest.fn(),
			authenticate: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [UsersController],
			providers: [
				{
					provide: AuthService,
					useValue: mockAuthService,
				},
			],
		}).compile();

		controller = module.get<UsersController>(UsersController);
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

		let mockSession: Session;

		beforeEach(() => {
			mockSession = {
				userId: undefined,
				email: undefined,
				name: undefined,
			} as Session;
		});

		it('should create a user successfully', async () => {
			authService.createUser.mockResolvedValue(mockUser);

			const result = await controller.createUser(validCommand, mockSession);

			expect(result).toEqual(mockUser);
			expect(authService.createUser).toHaveBeenCalledWith(validCommand);
		});

		it('should automatically log in the user after signup', async () => {
			authService.createUser.mockResolvedValue(mockUser);

			await controller.createUser(validCommand, mockSession);

			expect(mockSession.userId).toBe(mockUser.id);
			expect(mockSession.email).toBe(mockUser.email);
			expect(mockSession.name).toBe(mockUser.name);
		});

		it('should set session properties correctly', async () => {
			const customUser: User = {
				id: 'custom-id-456',
				email: 'custom@example.com',
				name: 'Custom User',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			authService.createUser.mockResolvedValue(customUser);

			await controller.createUser(validCommand, mockSession);

			expect(mockSession.userId).toBe('custom-id-456');
			expect(mockSession.email).toBe('custom@example.com');
			expect(mockSession.name).toBe('Custom User');
		});

		it('should propagate validation errors from AuthService', async () => {
			const error = new BadRequestException('Invalid email format');
			authService.createUser.mockRejectedValue(error);

			await expect(controller.createUser(validCommand, mockSession)).rejects.toThrow(error);
		});

		it('should not modify session if user creation fails', async () => {
			const error = new BadRequestException('Invalid email format');
			authService.createUser.mockRejectedValue(error);

			const originalSession = { ...mockSession };

			try {
				await controller.createUser(validCommand, mockSession);
			} catch {
				// Expected to throw
			}

			expect(mockSession).toEqual(originalSession);
		});

		it('should handle missing email in command', async () => {
			const invalidCommand = { ...validCommand, email: '' };
			const error = new BadRequestException('Invalid email');
			authService.createUser.mockRejectedValue(error);

			await expect(controller.createUser(invalidCommand, mockSession)).rejects.toThrow(error);
		});

		it('should handle missing password in command', async () => {
			const invalidCommand = { ...validCommand, password: '' };
			const error = new BadRequestException('Invalid password');
			authService.createUser.mockRejectedValue(error);

			await expect(controller.createUser(invalidCommand, mockSession)).rejects.toThrow(error);
		});

		it('should handle missing name in command', async () => {
			const invalidCommand = { ...validCommand, name: '' };
			const error = new BadRequestException('Invalid name');
			authService.createUser.mockRejectedValue(error);

			await expect(controller.createUser(invalidCommand, mockSession)).rejects.toThrow(error);
		});

		it('should return the created user object', async () => {
			authService.createUser.mockResolvedValue(mockUser);

			const result = await controller.createUser(validCommand, mockSession);

			expect(result).toHaveProperty('id');
			expect(result).toHaveProperty('email');
			expect(result).toHaveProperty('name');
			expect(result).toHaveProperty('createdAt');
			expect(result).toHaveProperty('updatedAt');
		});
	});
});
