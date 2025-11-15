export enum ProjectRole {
	ADMIN = 'ADMIN',
	USER = 'USER',
}

export interface ProjectMember {
	id: string;
	projectId: string;
	userId: string;
	role: ProjectRole;
	userName: string;
	userEmail: string;
	createdAt: Date;
	lastUpdatedAt: Date;
}

export interface ProjectMemberCreate {
	projectId: string;
	userId: string;
	role: ProjectRole;
}
