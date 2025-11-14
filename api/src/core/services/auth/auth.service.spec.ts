import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { AUTH_ADAPTER, AuthPort } from '../../ports/out/auth/auth.port';
import { User } from '../../models/auth/user.model';
import { CreateUserCommand } from '../../commands/create-user.command';

describe('AuthService', () => {
	let service: AuthService;
	let authPort: jest.Mocked<AuthPort>;

	const mockUser: User = {
		id: '123',
		email: 'test@example.com',
		name: 'Test User',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(async () => {
		const mockAuthPort: jest.Mocked<AuthPort> = {
			authenticate: jest.fn(),
			createUser: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: AUTH_ADAPTER,
					useValue: mockAuthPort,
				},
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		authPort = module.get(AUTH_ADAPTER);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
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

		it('should throw BadRequestException when email is null', async () => {
			await expect(service.authenticate(null, 'password123')).rejects.toThrow(
				new BadRequestException('You must provide an email'),
			);
		});

		it('should throw BadRequestException when email is undefined', async () => {
			await expect(service.authenticate(undefined, 'password123')).rejects.toThrow(
				new BadRequestException('You must provide an email'),
			);
		});

		it('should throw BadRequestException when email is empty string', async () => {
			await expect(service.authenticate('', 'password123')).rejects.toThrow(
				new BadRequestException('You must provide an email'),
			);
		});

		it('should throw BadRequestException when email is only whitespace', async () => {
			await expect(service.authenticate('   ', 'password123')).rejects.toThrow(
				new BadRequestException('You must provide an email'),
			);
		});

		it('should throw BadRequestException when password is null', async () => {
			await expect(service.authenticate('test@example.com', null)).rejects.toThrow(
				new BadRequestException('You must provide a password'),
			);
		});

		it('should throw BadRequestException when password is undefined', async () => {
			await expect(service.authenticate('test@example.com', undefined)).rejects.toThrow(
				new BadRequestException('You must provide a password'),
			);
		});

		it('should throw BadRequestException when password is empty string', async () => {
			await expect(service.authenticate('test@example.com', '')).rejects.toThrow(
				new BadRequestException('You must provide a password'),
			);
		});

		it('should throw BadRequestException when password is only whitespace', async () => {
			await expect(service.authenticate('test@example.com', '   ')).rejects.toThrow(
				new BadRequestException('You must provide a password'),
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
			// Mock crypto.randomUUID
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

		it('should normalize email to lowercase', async () => {
			authPort.createUser.mockResolvedValue(mockUser);

			const command = { ...validCommand, email: 'NewUser@EXAMPLE.COM' };
			await service.createUser(command);

			expect(authPort.createUser).toHaveBeenCalledWith('mock-uuid-123', {
				...command,
				email: 'newuser@example.com',
			});
		});

		it('should trim email whitespace', async () => {
			authPort.createUser.mockResolvedValue(mockUser);

			const command = { ...validCommand, email: '  newuser@example.com  ' };
			await service.createUser(command);

			expect(authPort.createUser).toHaveBeenCalledWith('mock-uuid-123', {
				...command,
				email: 'newuser@example.com',
			});
		});

		it('should throw BadRequestException when command is null', async () => {
			await expect(service.createUser(null as any)).rejects.toThrow(
				new BadRequestException('Missing email, password, and name.'),
			);
		});

		it('should throw BadRequestException when command is undefined', async () => {
			await expect(service.createUser(undefined as any)).rejects.toThrow(
				new BadRequestException('Missing email, password, and name.'),
			);
		});

		it('should throw BadRequestException when email is missing', async () => {
			const command = { ...validCommand, email: undefined as any };
			await expect(service.createUser(command)).rejects.toThrow(
				new BadRequestException('Invalid email'),
			);
		});

		it('should throw BadRequestException when email is empty string', async () => {
			const command = { ...validCommand, email: '' };
			await expect(service.createUser(command)).rejects.toThrow(
				new BadRequestException('Invalid email'),
			);
		});

		it('should throw BadRequestException when email is only whitespace', async () => {
			const command = { ...validCommand, email: '   ' };
			await expect(service.createUser(command)).rejects.toThrow(
				new BadRequestException('Invalid email'),
			);
		});

		it('should throw BadRequestException when email format is invalid', async () => {
			const invalidEmails = [
				'notanemail',
				'missing@domain',
				'@example.com',
				'user@',
				'user @example.com',
				'user@example',
			];

			for (const email of invalidEmails) {
				const command = { ...validCommand, email };
				await expect(service.createUser(command)).rejects.toThrow(
					new BadRequestException('Invalid email format'),
				);
			}
		});

		it('should throw BadRequestException when password is missing', async () => {
			const command = { ...validCommand, password: undefined as any };
			await expect(service.createUser(command)).rejects.toThrow(
				new BadRequestException('Invalid password'),
			);
		});

		it('should throw BadRequestException when password is empty string', async () => {
			const command = { ...validCommand, password: '' };
			await expect(service.createUser(command)).rejects.toThrow(
				new BadRequestException('Invalid password'),
			);
		});

		it('should throw BadRequestException when password is only whitespace', async () => {
			const command = { ...validCommand, password: '   ' };
			await expect(service.createUser(command)).rejects.toThrow(
				new BadRequestException('Invalid password'),
			);
		});

		it('should throw BadRequestException when password is too short', async () => {
			const command = { ...validCommand, password: 'short' };
			await expect(service.createUser(command)).rejects.toThrow(
				new BadRequestException('Password must be at least 8 characters long'),
			);
		});

		it('should accept password with exactly 8 characters', async () => {
			authPort.createUser.mockResolvedValue(mockUser);

			const command = { ...validCommand, password: '12345678' };
			await service.createUser(command);

			expect(authPort.createUser).toHaveBeenCalled();
		});

		it('should throw BadRequestException when name is missing', async () => {
			const command = { ...validCommand, name: undefined as any };
			await expect(service.createUser(command)).rejects.toThrow(
				new BadRequestException('Invalid name'),
			);
		});

		it('should throw BadRequestException when name is empty string', async () => {
			const command = { ...validCommand, name: '' };
			await expect(service.createUser(command)).rejects.toThrow(
				new BadRequestException('Invalid name'),
			);
		});

		it('should throw BadRequestException when name is only whitespace', async () => {
			const command = { ...validCommand, name: '   ' };
			await expect(service.createUser(command)).rejects.toThrow(
				new BadRequestException('Invalid name'),
			);
		});

		it('should generate a unique UUID for each user', async () => {
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
});
