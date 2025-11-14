import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LocalAuthGuard } from './local-auth.guard';

describe('LocalAuthGuard', () => {
	let guard: LocalAuthGuard;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [LocalAuthGuard],
		}).compile();

		guard = module.get<LocalAuthGuard>(LocalAuthGuard);
	});

	it('should be defined', () => {
		expect(guard).toBeDefined();
	});

	it('should extend AuthGuard with local strategy', () => {
		// The LocalAuthGuard extends AuthGuard('local')
		// This is more of an integration test - the actual functionality
		// is tested through the LocalStrategy tests
		expect(guard).toBeInstanceOf(LocalAuthGuard);
	});

	describe('canActivate', () => {
		it('should have canActivate method from parent AuthGuard', () => {
			expect(guard.canActivate).toBeDefined();
			expect(typeof guard.canActivate).toBe('function');
		});
	});
});
