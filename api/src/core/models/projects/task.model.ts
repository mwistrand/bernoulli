export interface Task {
	id: string;
	projectId: string;
	title: string;
	summary?: string;
	description: string;
	createdAt: Date;
	createdBy: string;
	lastUpdatedAt: Date;
	lastUpdatedBy: string;
}
