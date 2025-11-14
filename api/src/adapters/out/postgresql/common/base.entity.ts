import { Column, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity';

export abstract class BaseEntity {
	@ManyToOne(() => UserEntity, { nullable: false })
	@JoinColumn({ name: 'createdBy' })
	createdBy!: UserEntity;

	@ManyToOne(() => UserEntity, { nullable: false })
	@JoinColumn({ name: 'lastUpdatedBy' })
	lastUpdatedBy!: UserEntity;

	@Column()
	createdAt!: Date;

	@Column()
	lastUpdatedAt!: Date;
}
