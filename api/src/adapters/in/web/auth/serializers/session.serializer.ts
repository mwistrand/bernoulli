import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '../../../../../core/models/auth/user.model';

@Injectable()
export class SessionSerializer extends PassportSerializer {
	serializeUser(user: User, done: (err: Error | null, user: any) => void): void {
		// Store only minimal data in session
		done(null, {
			userId: user.id,
			email: user.email,
			name: user.name,
		});
	}

	deserializeUser(payload: any, done: (err: Error | null, user: any) => void): void {
		// Reconstruct user from session data
		done(null, payload);
	}
}
