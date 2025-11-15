export enum UserRole {
	ADMIN = 'ADMIN',
	USER = 'USER',
}

export interface User {
	id: string;
	name: string;
	email: string;
	role: UserRole;
}
