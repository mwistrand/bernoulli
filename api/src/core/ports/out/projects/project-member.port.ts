import { ProjectMember, ProjectMemberCreate } from '../../../models/projects/project-member.model';

export const PROJECT_MEMBER_PORT = 'PROJECT_MEMBER_PORT';

export interface ProjectMemberPort {
	create(member: ProjectMemberCreate): Promise<ProjectMember>;
	findByProjectId(projectId: string): Promise<ProjectMember[]>;
	findByUserId(userId: string): Promise<ProjectMember[]>;
	findByProjectAndUser(projectId: string, userId: string): Promise<ProjectMember | null>;
	delete(id: string): Promise<void>;
	deleteByProjectAndUser(projectId: string, userId: string): Promise<void>;
}
