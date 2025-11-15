import { Controller, Post, Get, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthenticatedGuard } from './guards/authenticated.guard';

export interface AuthDto {
	email?: string | null;
	password?: string | null;
}

@Controller('auth')
export class AuthController {
	@Post('login')
	@HttpCode(HttpStatus.OK)
	@UseGuards(LocalAuthGuard)
	async authenticate(@Req() req: Request) {
		// The LocalAuthGuard validates credentials and sets req.user,
		// but we need to explicitly establish the session
		await new Promise<void>((resolve, reject) => {
			req.login(req.user!, err => {
				if (err) reject(err);
				else resolve();
			});
		});
		return req.user;
	}

	@Post('logout')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthenticatedGuard)
	async logout(@Req() request: Request): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			request.logout(err => {
				if (err) {
					reject(err);
					return;
				}
				// Destroy the session completely to prevent stale session issues
				request.session.destroy(sessionErr => {
					if (sessionErr) reject(sessionErr);
					else resolve();
				});
			});
		});
	}

	@Get('me')
	@UseGuards(AuthenticatedGuard)
	async getCurrentUser(@Req() request: Request) {
		return request.user;
	}
}
