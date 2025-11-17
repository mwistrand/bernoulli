import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { AUTH_PORT, AuthPort } from '../../ports/out/auth/auth.port';
import { User } from '../../models/auth/user.model';
import { CreateUserCommand } from '../../commands/user.command';
import { LoggerService } from '../../../common/logging/logger.service';
import { TracingService } from '../../../common/tracing/tracing.service';
import { MetricsService } from '../../../common/metrics/metrics.service';

describe(AuthService.name, () => {
	let service: AuthService;
	let authPort: jest.Mocked<AuthPort>;
	let logger: jest.Mocked<LoggerService>;
	let tracing: jest.Mocked<TracingService>;
	let metrics: jest.Mocked<MetricsService>;

	const mockUser: User = {
		id: '123',
		email: 'test@example.com',
		name: 'Test User',
	};

	beforeEach(async () => {
		const mockAuthPort: jest.Mocked<AuthPort> = {
			authenticate: jest.fn(),
			createUser: jest.fn(),
			findById: jest.fn(),
			findAllUsers: jest.fn(),
			deleteUser: jest.fn(),
		};

		const mockLogger = {
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			security: jest.fn(),
		};

		const mockTracing = {
			traceOperation: jest.fn((name, fn) => fn({ setAttribute: jest.fn() })),
			addEvent: jest.fn(),
			setAttributes: jest.fn(),
			recordException: jest.fn(),
		};

		const mockMetrics = {
			trackAuthEvent: jest.fn(),
			trackBusinessOperation: jest.fn(),
			trackAuthorizationFailure: jest.fn(),
			trackError: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: AUTH_PORT,
					useValue: mockAuthPort,
				},
				{
					provide: LoggerService,
					useValue: mockLogger,
				},
				{
					provide: TracingService,
					useValue: mockTracing,
				},
				{
					provide: MetricsService,
					useValue: mockMetrics,
				},
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		authPort = module.get(AUTH_PORT);
		logger = module.get(LoggerService);
		tracing = module.get(TracingService);
		metrics = module.get(MetricsService);
	});

	describe('authenticate', () => {
		it('should authenticate a user successfully', async () => {
			authPort.authenticate.mockResolvedValue(mockUser);

			const result = await service.authenticate('test@example.com', 'password123');

			expect(result).toEqual(mockUser);
			expect(authPort.authenticate).toHaveBeenCalledWith('test@example.com', 'password123');
		});

		it('should normalize email to lowercase', async () => {
			authPort.authenticate.mockResolvedValue(mockUser);

			await service.authenticate('Test@Example.COM', 'password123');

			expect(authPort.authenticate).toHaveBeenCalledWith('test@example.com', 'password123');
		});

		it('should trim email whitespace', async () => {
			authPort.authenticate.mockResolvedValue(mockUser);

			await service.authenticate('  test@example.com  ', 'password123');

			expect(authPort.authenticate).toHaveBeenCalledWith('test@example.com', 'password123');
		});

		it('should reject invalid email', async () => {
			await expect(service.authenticate('', 'password123')).rejects.toThrow(
				BadRequestException,
			);
			await expect(service.authenticate(null, 'password123')).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should reject invalid password', async () => {
			await expect(service.authenticate('test@example.com', '')).rejects.toThrow(
				BadRequestException,
			);
			await expect(service.authenticate('test@example.com', null)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe('createUser', () => {
		const validCommand: CreateUserCommand = {
			email: 'newuser@example.com',
			password: 'securePassword123',
			name: 'New User',
		};

		beforeEach(() => {
			jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid-123');
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('should create a user successfully', async () => {
			authPort.createUser.mockResolvedValue(mockUser);

			const result = await service.createUser(validCommand);

			expect(result).toEqual(mockUser);
			expect(authPort.createUser).toHaveBeenCalledWith('mock-uuid-123', {
				...validCommand,
				email: 'newuser@example.com',
			});
		});

		it('should normalize and trim email', async () => {
			authPort.createUser.mockResolvedValue(mockUser);

			const command = { ...validCommand, email: '  NewUser@EXAMPLE.COM  ' };
			await service.createUser(command);

			expect(authPort.createUser).toHaveBeenCalledWith('mock-uuid-123', {
				...command,
				email: 'newuser@example.com',
			});
		});

		it('should reject missing or invalid command', async () => {
			await expect(service.createUser(null as any)).rejects.toThrow(BadRequestException);
			await expect(service.createUser(undefined as any)).rejects.toThrow(BadRequestException);
		});

		it('should reject invalid email', async () => {
			await expect(service.createUser({ ...validCommand, email: '' })).rejects.toThrow(
				BadRequestException,
			);
			await expect(
				service.createUser({ ...validCommand, email: 'notanemail' }),
			).rejects.toThrow(BadRequestException);
		});

		it('should reject invalid password', async () => {
			await expect(service.createUser({ ...validCommand, password: '' })).rejects.toThrow(
				BadRequestException,
			);
			await expect(
				service.createUser({ ...validCommand, password: 'short' }),
			).rejects.toThrow(BadRequestException);
		});

		it('should accept password with exactly 8 characters', async () => {
			authPort.createUser.mockResolvedValue(mockUser);

			await service.createUser({ ...validCommand, password: '12345678' });

			expect(authPort.createUser).toHaveBeenCalled();
		});

		it('should reject invalid name', async () => {
			await expect(service.createUser({ ...validCommand, name: '' })).rejects.toThrow(
				BadRequestException,
			);
			await expect(service.createUser({ ...validCommand, name: '   ' })).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should generate unique UUIDs for each user', async () => {
			authPort.createUser.mockResolvedValue(mockUser);

			const uuidSpy = jest
				.spyOn(crypto, 'randomUUID')
				.mockReturnValueOnce('uuid-1')
				.mockReturnValueOnce('uuid-2');

			await service.createUser(validCommand);
			expect(authPort.createUser).toHaveBeenCalledWith('uuid-1', expect.any(Object));

			await service.createUser(validCommand);
			expect(authPort.createUser).toHaveBeenCalledWith('uuid-2', expect.any(Object));

			expect(uuidSpy).toHaveBeenCalledTimes(2);
		});
	});

	describe('deleteUser', () => {
		it('should delete a user successfully', async () => {
			authPort.deleteUser.mockResolvedValue(undefined);

			await service.deleteUser('user-123');

			expect(authPort.deleteUser).toHaveBeenCalledWith('user-123');
		});

		it('should reject invalid user ID', async () => {
			await expect(service.deleteUser('')).rejects.toThrow(BadRequestException);
			await expect(service.deleteUser('   ')).rejects.toThrow(BadRequestException);
		});

		it('should reject null or undefined user ID', async () => {
			await expect(service.deleteUser(null as any)).rejects.toThrow(BadRequestException);
			await expect(service.deleteUser(undefined as any)).rejects.toThrow(BadRequestException);
		});
	});
});
