import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nModule, QueryResolver, AcceptLanguageResolver, HeaderResolver } from 'nestjs-i18n';
import { APP_FILTER } from '@nestjs/core';
import * as path from 'path';
import { AuthModule } from './auth.module';
import { ProjectsModule } from './projects.module';
import { TaskService } from './core/services/projects/task.service';
import { CommonModule } from './common/common.module';
import { RequestTrackingMiddleware } from './common/middleware/request-tracking.middleware';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

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
		CommonModule,
		AuthModule,
		ProjectsModule,
	],
	providers: [
		TaskService,
		{
			provide: APP_FILTER,
			useClass: AllExceptionsFilter,
		},
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(RequestTrackingMiddleware).forRoutes('*');
	}
}
