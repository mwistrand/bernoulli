import { Entity, Column, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { TaskComment } from '../../../../../core/models/projects/task.model';

@Entity('task_comments')
export class TaskCommentEntity extends BaseEntity {
	@PrimaryColumn()
	id!: string;

	@Column()
	taskId!: string;

	@Column()
	comment!: string;

	toComment(): TaskComment {
		return {
			id: this.id,
			taskId: this.taskId,
			comment: this.comment,
			createdAt: this.createdAt,
			lastUpdatedAt: this.lastUpdatedAt,
			createdBy: this.createdBy.id,
			createdByName: this.createdBy.name,
			lastUpdatedBy: this.lastUpdatedBy.id,
			lastUpdatedByName: this.lastUpdatedBy.name,
		};
	}
}
