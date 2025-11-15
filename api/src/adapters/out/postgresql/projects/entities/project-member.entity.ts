import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { UserEntity } from '../../auth/entities/user.entity';
import { ProjectMember } from '../../../../../core/models/projects/project-member.model';

export enum ProjectRole {
	ADMIN = 'ADMIN',
	USER = 'USER',
}

@Entity('project_members')
@Unique(['projectId', 'userId'])
export class ProjectMemberEntity {
	@PrimaryColumn()
	id!: string;

	@Column()
	projectId!: string;

	@Column()
	userId!: string;

	@Column({
		type: 'enum',
		enum: ProjectRole,
		default: ProjectRole.USER,
	})
	role!: ProjectRole;

	@ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'projectId' })
	project!: ProjectEntity;

	@ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user!: UserEntity;

	@Column()
	createdAt!: Date;

	@Column()
	lastUpdatedAt!: Date;

	toProjectMember(): ProjectMember {
		return {
			id: this.id,
			projectId: this.projectId,
			userId: this.userId,
			role: this.role,
			userName: this.user?.name || '',
			userEmail: this.user?.email || '',
			createdAt: this.createdAt,
			lastUpdatedAt: this.lastUpdatedAt,
		};
	}
}
