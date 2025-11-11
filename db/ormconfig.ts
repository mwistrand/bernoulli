import { DataSource } from 'typeorm';
import * as path from 'path';

// Load environment variables from root .env file
// This is handled by dotenv-cli in package.json scripts

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432', 10),
  username: process.env['DB_USER'] || 'bernoulli',
  password: process.env['DB_PASS'] || 'bernoulli',
  database: process.env['DB_NAME'] || 'bernoulli',

  // Path to entities in the API project
  entities: [path.join(__dirname, '../api/src/**/*.entity.{ts,js}')],

  // Migrations configuration
  migrations: [path.join(__dirname, 'migrations/*.{ts,js}')],
  migrationsTableName: 'migrations',

  // Logging
  logging: process.env['NODE_ENV'] !== 'production',

  // Never use synchronize in migrations
  synchronize: false,
});

