import { Entity, Column, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Task } from '../../../../../core/models/projects/task.model';

@Entity('tasks')
export class TaskEntity extends BaseEntity {
	@PrimaryColumn()
	id!: string;

	@Column()
	projectId!: string;

	@Column()
	title!: string;

	@Column()
	description!: string;

	@Column({ type: 'varchar', nullable: true })
	summary?: string | null;

	toTask(): Task {
		return {
			id: this.id,
			projectId: this.projectId,
			title: this.title,
			description: this.description,
			summary: this.summary ?? undefined,
			createdAt: this.createdAt,
			lastUpdatedAt: this.lastUpdatedAt,
			createdBy: this.createdBy.id,
			lastUpdatedBy: this.lastUpdatedBy.id,
		};
	}
}
