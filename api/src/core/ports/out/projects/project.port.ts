import { CreateProjectCommand } from 'src/core/commands/project.command';
import { Project } from 'src/core/models/projects/project.model';

export const PROJECT_PORT = 'PROJECT_PORT';

export interface ProjectPort {
	createProject(id: string, command: CreateProjectCommand): Promise<Project>;
	findById(id: string): Promise<Project | undefined>;
	findAllProjects(userId: string): Promise<Project[]>;
}
