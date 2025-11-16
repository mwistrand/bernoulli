import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { CreateUserCommand } from '../../../../core/commands/user.command';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('users')
export class UserController {
	constructor(private readonly authService: AuthService) {}

	@Post()
	async createUser(@Body() command: CreateUserCommand, @Req() req: Request) {
		const user = await this.authService.createUser(command);

		// Automatically log in the user after signup using Passport (only if not authenticated)
		if (!req.isAuthenticated()) {
			await new Promise((resolve, reject) => {
				req.login(user, err => {
					if (err) reject(err);
					else resolve(undefined);
				});
			});
		}

		return user;
	}

	@Post('admin')
	@UseGuards(AuthenticatedGuard, AdminGuard)
	async createUserAsAdmin(@Body() command: CreateUserCommand) {
		return this.authService.createUser(command);
	}

	@Get()
	@UseGuards(AuthenticatedGuard)
	getAllUsers() {
		return this.authService.findAllUsers();
	}

	@Get('me')
	@UseGuards(AuthenticatedGuard)
	getCurrentUser(@Req() req: Request) {
		const userId = (req.user! as any).id as string;
		return this.authService.findById(userId);
	}

	@Delete(':id')
	@UseGuards(AuthenticatedGuard, AdminGuard)
	async deleteUser(@Param('id') id: string) {
		await this.authService.deleteUser(id);
		return { message: 'User deleted successfully' };
	}
}
