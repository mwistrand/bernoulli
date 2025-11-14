export interface Project {
	id: string;
	name: string;
	description?: string;
	createdAt: Date;
	createdBy: string;
	lastUpdatedAt: Date;
	lastUpdatedBy: string;
}
