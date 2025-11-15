import { CreateUserCommand } from '../../../commands/user.command';
import { User } from '../../../models/auth/user.model';

export const AUTH_PORT = 'AUTH_PORT';

export interface AuthPort {
	authenticate(username: string, password: string): Promise<User>;

	createUser(id: string, command: CreateUserCommand): Promise<User>;

	findById(id: string): Promise<User>;

	findAllUsers(): Promise<User[]>;
}
