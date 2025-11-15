import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nModule, QueryResolver, AcceptLanguageResolver, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path';
import { AuthModule } from './auth.module';
import { ProjectsModule } from './projects.module';
import { TaskService } from './core/services/projects/task.service';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: [`.env.${process.env['NODE_ENV'] || 'prod'}`, '../.env', '.env'],
		}),
		I18nModule.forRoot({
			fallbackLanguage: 'en',
			loaderOptions: {
				path: path.join(__dirname, '/i18n/'),
				watch: true,
			},
			resolvers: [
				{ use: QueryResolver, options: ['lang'] },
				AcceptLanguageResolver,
				new HeaderResolver(['x-lang']),
			],
		}),
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env['DB_HOST'] || 'localhost',
			port: parseInt(process.env['DB_PORT'] ?? '', 10) || 5432,
			username: process.env['DB_USER'] || 'bernoulli',
			password: process.env['DB_PASS'] || 'bernoulli',
			database: process.env['DB_NAME'] || 'bernoulli',
			autoLoadEntities: true,
			synchronize: false,
		}),
		AuthModule,
		ProjectsModule,
	],
	providers: [TaskService],
})
export class AppModule {}
