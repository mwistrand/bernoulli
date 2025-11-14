import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as passport from 'passport';
import { Pool } from 'pg';
import { AppModule } from './app.module';

const session = require('express-session');
const pgSession = require('connect-pg-simple');

function getConnectionString() {
	const host = process.env['DB_HOST'];
	const port = process.env['DB_PORT'];
	const username = process.env['DB_USER'];
	const password = process.env['DB_PASS'] || process.env['DB_PASSWORD'];
	const database = process.env['DB_NAME'];
	return `postgresql://${username}:${password}@${host}:${port}/${database}`;
}

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS with credentials for session cookies
	app.enableCors({
		origin: 'http://localhost:1234',
		credentials: true,
	});

	// Setup PostgreSQL session store
	const pgPool = new Pool({
		connectionString: getConnectionString(),
	});

	const configService = app.get(ConfigService);

	// Get session secret from environment or config
	const sessionSecret =
		process.env['SESSION_SECRET'] ||
		configService.get('SESSION_SECRET') ||
		'dev-secret-change-me';

	if (sessionSecret === 'dev-secret-change-me') {
		console.warn(
			'WARNING: Using default session secret. Set SESSION_SECRET environment variable for production!',
		);
	}

	const PgStore = pgSession(session);
	app.use(
		session({
			store: new PgStore({
				pool: pgPool,
				createTableIfMissing: true,
			}),
			secret: sessionSecret,
			resave: false,
			saveUninitialized: false,
			cookie: {
				maxAge: 24 * 60 * 60 * 1000, // 24 hours
				httpOnly: true, // Prevent XSS attacks - JavaScript cannot access cookie
				secure: process.env['NODE_ENV'] === 'production', // Only send over HTTPS in production
				sameSite: 'lax', // Prevent CSRF attacks
			},
		}),
	);

	app.use(passport.initialize());
	app.use(passport.session());

	app.setGlobalPrefix('api'); // All routes will be prefixed with /api
	await app.listen(process.env['PORT'] ? Number(process.env['PORT']) : 3000);
}
bootstrap().catch(error => {
	console.error('Unable to bootstrap the API', error);
});
