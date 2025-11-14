import { Test, TestingModule } from '@nestjs/testing';
import { AuthController, AuthDto } from './adapters/in/web/auth/auth.controller';
import { AuthService } from './core/services/auth/auth.service';

// Mock AuthService
const mockAuthService = {
	authenticate: jest.fn(),
};

describe('AuthController', () => {
	let controller: AuthController;
	let authService: any;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [{ provide: AuthService, useValue: mockAuthService }],
		}).compile();

		controller = module.get<AuthController>(AuthController);
		authService = module.get<AuthService>(AuthService) as unknown as typeof mockAuthService;
		jest.clearAllMocks();
	});

	describe('authenticate', () => {
		it('should authenticate and set session data', async () => {
			const user = { id: '1', email: 'test@example.com', name: 'Test User' };
			authService.authenticate.mockResolvedValue(user);
			const session: any = {};
			const dto: AuthDto = { email: 'test@example.com', password: 'password' };
			const result = await controller.authenticate(dto, session);
			expect(result).toEqual(user);
			expect(session.userId).toBe(user.id);
			expect(session.email).toBe(user.email);
			expect(session.name).toBe(user.name);
		});
	});

	describe('logout', () => {
		it('should destroy session', async () => {
			const session: any = {
				destroy: jest.fn((cb: (err?: Error) => void) => cb()),
			};
			await expect(controller.logout(session)).resolves.toBeUndefined();
			expect(session.destroy).toHaveBeenCalled();
		});
		it('should reject if session destroy fails', async () => {
			const session: any = {
				destroy: jest.fn((cb: (err?: Error) => void) => cb(new Error('fail'))),
			};
			await expect(controller.logout(session)).rejects.toThrow('fail');
		});
	});

	describe('getCurrentUser', () => {
		it('should return null if no userId in session', async () => {
			const session: any = {};
			expect(await controller.getCurrentUser(session)).toBeNull();
		});
		it('should return user data from session', async () => {
			const session: any = {
				userId: '1',
				email: 'test@example.com',
				name: 'Test User',
			};
			expect(await controller.getCurrentUser(session)).toEqual({
				id: '1',
				email: 'test@example.com',
				name: 'Test User',
			});
		});
	});
});
