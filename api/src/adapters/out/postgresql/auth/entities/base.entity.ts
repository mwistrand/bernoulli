import { Entity, Column, PrimaryColumn } from 'typeorm';

export class BaseEntity {
	@Column()
	createdAt!: Date;

	@Column()
	lastUpdatedAt!: Date;
}
