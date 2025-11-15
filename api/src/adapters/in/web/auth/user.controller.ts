import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { CreateUserCommand } from '../../../../core/commands/user.command';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';

@Controller('users')
export class UserController {
	constructor(private readonly authService: AuthService) {}

	@Post()
	async createUser(@Body() command: CreateUserCommand, @Req() req: Request) {
		const user = await this.authService.createUser(command);

		// Automatically log in the user after signup using Passport
		await new Promise((resolve, reject) => {
			req.login(user, err => {
				if (err) reject(err);
				else resolve(undefined);
			});
		});

		return user;
	}

	@Get()
	@UseGuards(AuthenticatedGuard)
	getAllUsers() {
		return this.authService.findAllUsers();
	}

	@Get('me')
	@UseGuards(AuthenticatedGuard)
	getCurrentUser(@Req() req: Request) {
		const userId = (req.user! as any).userId as string;
		return this.authService.findById(userId);
	}
}
