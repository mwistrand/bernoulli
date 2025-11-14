import { Test, TestingModule } from '@nestjs/testing';
import { SessionSerializer } from './session.serializer';
import { User } from '../../../../../core/models/auth/user.model';

describe('SessionSerializer', () => {
	let serializer: SessionSerializer;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [SessionSerializer],
		}).compile();

		serializer = module.get<SessionSerializer>(SessionSerializer);
	});

	describe('serializeUser', () => {
		it('should serialize user to minimal session data', done => {
			const mockUser: User = {
				id: '123',
				email: 'test@example.com',
				name: 'Test User',
				passwordHash: 'hashed_password',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			serializer.serializeUser(mockUser, (err, sessionData) => {
				expect(err).toBeNull();
				expect(sessionData).toEqual({
					userId: '123',
					email: 'test@example.com',
					name: 'Test User',
				});
				// Ensure sensitive data is not stored in session
				expect(sessionData).not.toHaveProperty('passwordHash');
				expect(sessionData).not.toHaveProperty('createdAt');
				expect(sessionData).not.toHaveProperty('updatedAt');
				done();
			});
		});

		it('should handle user with missing optional fields', done => {
			const mockUser: Partial<User> = {
				id: '123',
				email: 'test@example.com',
				name: 'Test User',
			};

			serializer.serializeUser(mockUser as User, (err, sessionData) => {
				expect(err).toBeNull();
				expect(sessionData).toEqual({
					userId: '123',
					email: 'test@example.com',
					name: 'Test User',
				});
				done();
			});
		});
	});

	describe('deserializeUser', () => {
		it('should deserialize session data back to user payload', done => {
			const sessionPayload = {
				userId: '123',
				email: 'test@example.com',
				name: 'Test User',
			};

			serializer.deserializeUser(sessionPayload, (err, user) => {
				expect(err).toBeNull();
				expect(user).toEqual(sessionPayload);
				done();
			});
		});

		it('should handle minimal session payload', done => {
			const sessionPayload = {
				userId: '123',
			};

			serializer.deserializeUser(sessionPayload, (err, user) => {
				expect(err).toBeNull();
				expect(user).toEqual(sessionPayload);
				done();
			});
		});

		it('should pass through the payload without modification', done => {
			const sessionPayload = {
				userId: '456',
				email: 'another@example.com',
				name: 'Another User',
				customField: 'custom value',
			};

			serializer.deserializeUser(sessionPayload, (err, user) => {
				expect(err).toBeNull();
				expect(user).toBe(sessionPayload);
				done();
			});
		});
	});
});
