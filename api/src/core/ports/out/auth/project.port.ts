import { CreateProjectCommand } from 'src/core/commands/project.command';
import { Project } from 'src/core/models/projects/project.model';

export const PROJECT_ADAPTER = 'PROJECT_ADAPTER';

export interface ProjectPort {
	createProject(id: string, command: CreateProjectCommand): Promise<Project>;
}
