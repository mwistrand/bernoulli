import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AuthController } from './auth.controller';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthenticatedGuard } from './guards/authenticated.guard';

describe(AuthController.name, () => {
	let app: INestApplication;

	const mockUser = {
		userId: '1',
		email: 'test@example.com',
		name: 'Test User',
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
		}).compile();

		app = module.createNestApplication();
		await app.init();
	});

	afterEach(async () => {
		await app.close();
	});

	describe('POST /auth/login', () => {
		it('should establish session and return user', async () => {
			const mockLocalAuthGuard = {
				canActivate: jest.fn(context => {
					const request = context.switchToHttp().getRequest();
					request.user = {
						id: '1',
						email: 'test@example.com',
						name: 'Test User',
					};
					request.login = jest.fn((user, callback) => callback());
					return true;
				}),
			};

			await app.close();
			const module = await Test.createTestingModule({
				controllers: [AuthController],
			})
				.overrideGuard(LocalAuthGuard)
				.useValue(mockLocalAuthGuard)
				.compile();

			app = module.createNestApplication();
			await app.init();

			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send({ email: 'test@example.com', password: 'password' })
				.expect(200);

			expect(response.body).toEqual({
				id: '1',
				email: 'test@example.com',
				name: 'Test User',
			});
		});

		it('should reject if session establishment fails', async () => {
			const mockError = new Error('Session error');
			const mockLocalAuthGuard = {
				canActivate: jest.fn((context: ExecutionContext) => {
					const request = context.switchToHttp().getRequest();
					request.user = {
						id: '1',
						email: 'test@example.com',
						name: 'Test User',
					};
					request.login = jest.fn((user, callback) => callback(mockError));
					return true;
				}),
			};

			await app.close();
			const module = await Test.createTestingModule({
				controllers: [AuthController],
			})
				.overrideGuard(LocalAuthGuard)
				.useValue(mockLocalAuthGuard)
				.compile();

			app = module.createNestApplication();
			await app.init();

			await request(app.getHttpServer())
				.post('/auth/login')
				.send({ email: 'test@example.com', password: 'password' })
				.expect(500);
		});

		it('should return 401 when credentials are invalid', async () => {
			const mockLocalAuthGuard = {
				canActivate: jest.fn(() => false),
			};

			await app.close();
			const module = await Test.createTestingModule({
				controllers: [AuthController],
			})
				.overrideGuard(LocalAuthGuard)
				.useValue(mockLocalAuthGuard)
				.compile();

			app = module.createNestApplication();
			await app.init();

			await request(app.getHttpServer())
				.post('/auth/login')
				.send({ email: 'wrong@example.com', password: 'wrongpassword' })
				.expect(403);
		});
	});

	describe('POST /auth/logout', () => {
		it('should call logout and return 200', async () => {
			const mockAuthGuard = {
				canActivate: jest.fn(context => {
					const request = context.switchToHttp().getRequest();
					request.user = mockUser;
					request.logout = jest.fn(callback => callback());
					request.session = {
						destroy: jest.fn(callback => callback()),
					};
					return true;
				}),
			};

			await app.close();
			const module = await Test.createTestingModule({
				controllers: [AuthController],
			})
				.overrideGuard(AuthenticatedGuard)
				.useValue(mockAuthGuard)
				.compile();

			app = module.createNestApplication();
			await app.init();

			await request(app.getHttpServer()).post('/auth/logout').expect(200);
		});

		it('should reject if logout fails', async () => {
			const mockError = new Error('Logout failed');
			const mockAuthGuard = {
				canActivate: jest.fn(context => {
					const request = context.switchToHttp().getRequest();
					request.user = mockUser;
					request.logout = jest.fn(callback => callback(mockError));
					request.session = {
						destroy: jest.fn(callback => callback()),
					};
					return true;
				}),
			};

			await app.close();
			const module = await Test.createTestingModule({
				controllers: [AuthController],
			})
				.overrideGuard(AuthenticatedGuard)
				.useValue(mockAuthGuard)
				.compile();

			app = module.createNestApplication();
			await app.init();

			await request(app.getHttpServer()).post('/auth/logout').expect(500);
		});
	});

	describe('GET /auth/me', () => {
		it('should return the current user from request', async () => {
			const mockAuthGuard = {
				canActivate: jest.fn(context => {
					const request = context.switchToHttp().getRequest();
					request.user = mockUser;
					return true;
				}),
			};

			await app.close();
			const module = await Test.createTestingModule({
				controllers: [AuthController],
			})
				.overrideGuard(AuthenticatedGuard)
				.useValue(mockAuthGuard)
				.compile();

			app = module.createNestApplication();
			await app.init();

			const response = await request(app.getHttpServer()).get('/auth/me').expect(200);

			expect(response.body).toEqual(mockUser);
		});

		it('should return 403 when not authenticated', async () => {
			const mockAuthGuard = {
				canActivate: jest.fn(() => false),
			};

			await app.close();
			const module = await Test.createTestingModule({
				controllers: [AuthController],
			})
				.overrideGuard(AuthenticatedGuard)
				.useValue(mockAuthGuard)
				.compile();

			app = module.createNestApplication();
			await app.init();

			await request(app.getHttpServer()).get('/auth/me').expect(403);
		});
	});
});
