import { Entity, Column, PrimaryColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Project } from 'src/core/models/projects/project.model';

@Entity('projects')
export class ProjectEntity extends BaseEntity {
	@PrimaryColumn()
	id!: string;

	@Column()
	name!: string;

	@Column()
	description?: string;

	toProject(): Project {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			createdAt: this.createdAt,
			lastUpdatedAt: this.lastUpdatedAt,
			createdBy: this.createdBy.id,
			lastUpdatedBy: this.lastUpdatedBy.id,
		};
	}
}
