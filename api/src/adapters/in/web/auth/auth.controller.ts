import { Body, Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { SessionData } from './session.decorator';
import { Session } from './session.types';

export interface AuthDto {
	email?: string | null;
	password?: string | null;
}

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	async authenticate(@Body() authDto: AuthDto, @SessionData() session: Session) {
		const user = await this.authService.authenticate(authDto?.email, authDto?.password);

		// Store user information in session
		session.userId = user.id;
		session.email = user.email;
		session.name = user.name;

		return user;
	}

	@Post('logout')
	@HttpCode(HttpStatus.OK)
	async logout(@SessionData() session: Session) {
		return new Promise<void>((resolve, reject) => {
			session.destroy((err: Error) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	@Get('me')
	async getCurrentUser(@SessionData() session: Session) {
		if (!session.userId) {
			return null;
		}

		return {
			id: session.userId,
			email: session.email,
			name: session.name,
		};
	}
}
