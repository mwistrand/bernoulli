import { Entity, Column, PrimaryColumn } from 'typeorm';

export enum UserRole {
	ADMIN = 'ADMIN',
	USER = 'USER',
}

@Entity('users')
export class UserEntity {
	@PrimaryColumn()
	id!: string;

	@Column()
	email!: string;

	@Column({ select: false })
	password!: string;

	@Column()
	name!: string;

	@Column({
		type: 'enum',
		enum: UserRole,
		default: UserRole.USER,
	})
	role!: UserRole;

	@Column()
	createdAt!: Date;

	@Column()
	lastUpdatedAt!: Date;
}
