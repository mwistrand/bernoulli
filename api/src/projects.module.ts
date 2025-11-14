import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectService } from './core/services/projects/project.service';
import { ProjectController } from './adapters/in/web/projects/project.controller';
import { PROJECT_ADAPTER } from './core/ports/out/auth/project.port';
import { PostgreSQLProjectAdapter } from './adapters/out/postgresql/projects/postgresql-project.adapter';
import { ProjectEntity } from './adapters/out/postgresql/projects/entity/project.entity';
import { UserEntity } from './adapters/out/postgresql/auth/entities/user.entity';

@Module({
	controllers: [ProjectController],
	imports: [TypeOrmModule.forFeature([ProjectEntity, UserEntity])],
	providers: [
		ProjectService,
		{
			provide: PROJECT_ADAPTER,
			useClass: PostgreSQLProjectAdapter,
		},
	],
})
export class ProjectsModule {}
