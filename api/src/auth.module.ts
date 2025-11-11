import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './core/services/auth/auth.service';
import { AuthController } from './adapters/in/web/auth/auth.controller';
import { PostgreSQLAuthAdapter } from './adapters/out/postgresql/auth/postgresql-auth.adapter';
import { AUTH_ADAPTER } from './core/ports/out/auth/auth.port';
import { UserEntity } from './adapters/out/postgresql/auth/entities/user.entity';
import { UsersController } from './adapters/in/web/auth/users.controller';

@Module({
	controllers: [AuthController, UsersController],
	imports: [TypeOrmModule.forFeature([UserEntity])],
	providers: [
		AuthService,
		{
			provide: AUTH_ADAPTER,
			useClass: PostgreSQLAuthAdapter,
		},
	],
})
export class AuthModule {}
