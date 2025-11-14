import { Column, OneToOne } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity';

export class BaseEntity {
	@OneToOne(() => UserEntity, user => user.id)
	createdBy!: UserEntity;

	@OneToOne(() => UserEntity, user => user.id)
	lastUpdatedBy!: UserEntity;

	@Column()
	createdAt!: Date;

	@Column()
	lastUpdatedAt!: Date;
}
