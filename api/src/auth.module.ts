import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './core/services/auth/auth.service';
import { AuthController } from './adapters/in/web/auth/auth.controller';
import { PostgreSQLAuthAdapter } from './adapters/out/postgresql/auth/postgresql-auth.adapter';
import { AUTH_PORT } from './core/ports/out/auth/auth.port';
import { UserEntity } from './adapters/out/postgresql/auth/entities/user.entity';
import { UserController } from './adapters/in/web/auth/user.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './adapters/in/web/auth/strategies/local.strategy';
import { SessionSerializer } from './adapters/in/web/auth/serializers/session.serializer';

@Module({
	controllers: [AuthController, UserController],
	imports: [PassportModule.register({ session: true }), TypeOrmModule.forFeature([UserEntity])],
	providers: [
		AuthService,
		LocalStrategy,
		SessionSerializer,
		{
			provide: AUTH_PORT,
			useClass: PostgreSQLAuthAdapter,
		},
	],
})
export class AuthModule {}
