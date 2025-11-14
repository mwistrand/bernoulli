import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { Request } from 'express';

describe('AuthController', () => {
	let controller: AuthController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
		}).compile();

		controller = module.get<AuthController>(AuthController);
	});

	describe('authenticate', () => {
		it('should establish session and return user', async () => {
			const mockUser = {
				id: '1',
				email: 'test@example.com',
				name: 'Test User',
			};

			const mockRequest = {
				user: mockUser,
				login: jest.fn((user, callback) => callback()),
			} as unknown as Request;

			const result = await controller.authenticate(mockRequest);

			expect(mockRequest.login).toHaveBeenCalledWith(mockUser, expect.any(Function));
			expect(result).toEqual(mockUser);
		});

		it('should reject if session establishment fails', async () => {
			const mockUser = {
				id: '1',
				email: 'test@example.com',
				name: 'Test User',
			};

			const mockError = new Error('Session error');
			const mockRequest = {
				user: mockUser,
				login: jest.fn((user, callback) => callback(mockError)),
			} as unknown as Request;

			await expect(controller.authenticate(mockRequest)).rejects.toThrow('Session error');
		});
	});

	describe('logout', () => {
		it('should call request.logout and resolve', async () => {
			const mockRequest = {
				logout: jest.fn(callback => callback()),
			} as unknown as Request;

			await expect(controller.logout(mockRequest)).resolves.toBeUndefined();
			expect(mockRequest.logout).toHaveBeenCalledWith(expect.any(Function));
		});

		it('should reject if logout fails', async () => {
			const mockError = new Error('Logout failed');
			const mockRequest = {
				logout: jest.fn(callback => callback(mockError)),
			} as unknown as Request;

			await expect(controller.logout(mockRequest)).rejects.toThrow('Logout failed');
			expect(mockRequest.logout).toHaveBeenCalledWith(expect.any(Function));
		});
	});

	describe('getCurrentUser', () => {
		it('should return the current user from request', async () => {
			const mockUser = {
				userId: '1',
				email: 'test@example.com',
				name: 'Test User',
			};

			const mockRequest = {
				user: mockUser,
			} as unknown as Request;

			const result = await controller.getCurrentUser(mockRequest);
			expect(result).toEqual(mockUser);
		});

		it('should return undefined if no user in session', async () => {
			const mockRequest = {} as Request;

			const result = await controller.getCurrentUser(mockRequest);
			expect(result).toBeUndefined();
		});
	});
});
