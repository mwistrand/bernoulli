export interface TaskComment {
	id: string;
	taskId: string;
	comment: string;
	createdAt: Date;
	createdBy: string;
	createdByName: string;
	lastUpdatedAt: Date;
	lastUpdatedBy: string;
	lastUpdatedByName: string;
}

export interface Task {
	id: string;
	projectId: string;
	title: string;
	summary?: string;
	description: string;
	comments?: TaskComment[];
	createdAt: Date;
	createdBy: string;
	lastUpdatedAt: Date;
	lastUpdatedBy: string;
}
