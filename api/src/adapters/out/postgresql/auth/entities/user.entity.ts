import { Entity, Column, PrimaryColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
	@PrimaryColumn()
	id!: string;

	@Column()
	email!: string;

	@Column()
	password!: string;

	@Column()
	name!: string;
}
