import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { CreateUserCommand } from '../../../../core/commands/create-user.command';

@Controller('users')
export class UsersController {
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
}
