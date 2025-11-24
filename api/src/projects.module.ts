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
import { ProjectMemberService } from './core/services/projects/project-member.service';
import { ProjectMemberController } from './adapters/in/web/projects/project-member.controller';
import { PROJECT_MEMBER_PORT } from './core/ports/out/projects/project-member.port';
import { PostgreSQLProjectMemberAdapter } from './adapters/out/postgresql/projects/postgresql-project-member.adapter';
import { ProjectMemberEntity } from './adapters/out/postgresql/projects/entities/project-member.entity';
import { AuthModule } from './auth.module';
import { ProjectMemberGuard } from './adapters/in/web/projects/guards/project-member.guard';
import { TaskCommentEntity } from './adapters/out/postgresql/projects/entities/task-comment.entity';

@Module({
	controllers: [ProjectController, ProjectMemberController],
	imports: [
		TypeOrmModule.forFeature([
			ProjectEntity,
			TaskEntity,
			TaskCommentEntity,
			ProjectMemberEntity,
			UserEntity,
		]),
		AuthModule,
	],
	providers: [
		ProjectService,
		TaskService,
		ProjectMemberService,
		ProjectMemberGuard,
		{
			provide: PROJECT_PORT,
			useClass: PostgreSQLProjectAdapter,
		},
		{
			provide: TASK_PORT,
			useClass: PostgreSQLTaskAdapter,
		},
		{
			provide: PROJECT_MEMBER_PORT,
			useClass: PostgreSQLProjectMemberAdapter,
		},
	],
	exports: [PROJECT_PORT, TASK_PORT, PROJECT_MEMBER_PORT],
})
export class ProjectsModule {}
