import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import * as path from 'path';

// Dynamically load .env file based on NODE_ENV from root directory
const env = process.env.NODE_ENV || 'prod';
const envFileName = `.env.${env}`;
const envFilePath = path.join(__dirname, '../../..', envFileName);

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath,
		}),
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.DB_HOST || 'localhost',
			port: parseInt(process.env.DB_PORT ?? '', 10) || 5432,
			username: process.env.DB_USER || 'bernoulli',
			password: process.env.DB_PASS || 'bernoulli',
			database: process.env.DB_NAME || 'bernoulli',
			autoLoadEntities: true,
			synchronize: false,
		}),
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
