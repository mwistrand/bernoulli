export interface CreateTaskCommand {
	userId: string;
	projectId: string;
	title: string;
	summary?: string;
	description: string;
}

export interface UpdateTaskCommand {
	userId: string;
	taskId: string;
	projectId: string;
	title?: string;
	summary?: string | null;
	description?: string;
}

export interface DeleteTaskCommand {
	userId: string;
	taskId: string;
	projectId: string;
}
