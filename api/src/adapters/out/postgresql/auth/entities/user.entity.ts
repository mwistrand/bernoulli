import { Entity, Column, PrimaryColumn } from 'typeorm';

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

	@Column()
	createdAt!: Date;

	@Column()
	lastUpdatedAt!: Date;
}
