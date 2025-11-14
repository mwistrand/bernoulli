import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../../../../../core/services/auth/auth.service';

describe('LocalStrategy', () => {
	let strategy: LocalStrategy;
	let authService: jest.Mocked<AuthService>;

	beforeEach(async () => {
		const mockAuthService = {
			authenticate: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LocalStrategy,
				{
					provide: AuthService,
					useValue: mockAuthService,
				},
			],
		}).compile();

		strategy = module.get<LocalStrategy>(LocalStrategy);
		authService = module.get(AuthService);
	});

	describe('validate', () => {
		it('should return user when credentials are valid', async () => {
			const mockUser = {
				id: '1',
				email: 'test@example.com',
				name: 'Test User',
			};

			authService.authenticate.mockResolvedValue(mockUser as any);

			const result = await strategy.validate('test@example.com', 'password123');

			expect(authService.authenticate).toHaveBeenCalledWith(
				'test@example.com',
				'password123',
			);
			expect(result).toEqual(mockUser);
		});

		it('should throw UnauthorizedException when credentials are invalid', async () => {
			authService.authenticate.mockRejectedValue(new Error('Invalid credentials'));

			await expect(strategy.validate('test@example.com', 'wrongpassword')).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(strategy.validate('test@example.com', 'wrongpassword')).rejects.toThrow(
				'Invalid credentials',
			);
		});

		it('should throw UnauthorizedException when authService throws any error', async () => {
			authService.authenticate.mockRejectedValue(new Error('Database connection failed'));

			await expect(strategy.validate('test@example.com', 'password123')).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('should handle empty credentials', async () => {
			authService.authenticate.mockRejectedValue(new Error('Email and password required'));

			await expect(strategy.validate('', '')).rejects.toThrow(UnauthorizedException);
		});
	});
});
