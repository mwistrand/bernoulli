import { Test, TestingModule } from '@nestjs/testing';
import { SessionSerializer } from './session.serializer';

describe('SessionSerializer', () => {
	let serializer: SessionSerializer;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [SessionSerializer],
		}).compile();

		serializer = module.get<SessionSerializer>(SessionSerializer);
	});

	it('should serialize user to minimal session data without sensitive fields', done => {
		const mockUser = {
			id: '123',
			email: 'test@example.com',
			name: 'Test User',
			role: 'USER',
			createdAt: new Date(),
			updatedAt: new Date(),
		} as any;

		serializer.serializeUser(mockUser, (err, sessionData) => {
			expect(err).toBeNull();
			expect(sessionData).toEqual({
				id: '123',
				email: 'test@example.com',
				name: 'Test User',
				role: 'USER',
			});
			expect(sessionData).not.toHaveProperty('passwordHash');
			expect(sessionData).not.toHaveProperty('createdAt');
			done();
		});
	});

	it('should deserialize session data back to user payload', done => {
		const sessionPayload = {
			id: '123',
			email: 'test@example.com',
			name: 'Test User',
		};

		serializer.deserializeUser(sessionPayload, (err, user) => {
			expect(err).toBeNull();
			expect(user).toEqual(sessionPayload);
			done();
		});
	});
});
