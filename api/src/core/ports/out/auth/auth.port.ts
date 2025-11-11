import { CreateUserCommand } from 'src/core/commands/create-user.command';
import { User } from '../../../models/auth/user.model';

export const AUTH_ADAPTER = 'AUTH_ADAPTER';

export interface AuthPort {
	authenticate(username: string, password: string): Promise<User>;

	createUser(id: string, command: CreateUserCommand): Promise<User>;
}
