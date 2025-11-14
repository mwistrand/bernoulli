export interface CreateTaskCommand {
	userId: string;
	projectId: string;
	title: string;
	summary?: string;
	description: string;
}
