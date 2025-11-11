import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { CreateUserCommand } from 'src/core/commands/create-user.command';
import { SessionData } from './session.decorator';
import { Session } from './session.types';

@Controller('users')
export class UsersController {
	constructor(private readonly authService: AuthService) {}

	@Post()
	async createUser(@Body() command: CreateUserCommand, @SessionData() session: Session) {
		const user = await this.authService.createUser(command);

		// Automatically log in the user after signup
		session.userId = user.id;
		session.email = user.email;
		session.name = user.name;

		return user;
	}
}
