import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectService } from './core/services/projects/project.service';
import { ProjectController } from './adapters/in/web/projects/project.controller';
import { PROJECT_PORT } from './core/ports/out/projects/project.port';
import { PostgreSQLProjectAdapter } from './adapters/out/postgresql/projects/postgresql-project.adapter';
import { ProjectEntity } from './adapters/out/postgresql/projects/entities/project.entity';
import { UserEntity } from './adapters/out/postgresql/auth/entities/user.entity';
import { TaskService } from './core/services/projects/task.service';
import { TASK_PORT } from './core/ports/out/projects/task.port';
import { TaskEntity } from './adapters/out/postgresql/projects/entities/task.entity';
import { PostgreSQLTaskAdapter } from './adapters/out/postgresql/projects/postgresql-task.adapter';

@Module({
	controllers: [ProjectController],
	imports: [TypeOrmModule.forFeature([ProjectEntity, TaskEntity, UserEntity])],
	providers: [
		ProjectService,
		TaskService,
		{
			provide: PROJECT_PORT,
			useClass: PostgreSQLProjectAdapter,
		},
		{
			provide: TASK_PORT,
			useClass: PostgreSQLTaskAdapter,
		},
	],
	exports: [PROJECT_PORT, TASK_PORT], // <-- Add this line
})
export class ProjectsModule {}
