# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bernoulli is a monorepo containing a full-stack application with:

- **api/**: NestJS backend using TypeORM and PostgreSQL
- **ui/**: Angular frontend (standalone components)
- **db/**: TypeORM database migrations (separate from API code)

The backend follows **Hexagonal Architecture** (Ports and Adapters pattern):

- **Core**: Business logic, domain models, and port interfaces (`api/src/core/`)
    - `services/`: Application services containing business logic
    - `models/`: Domain models
    - `commands/`: Command patterns for operations
    - `ports/out/`: Interfaces for outbound dependencies (e.g., database, external services)
- **Adapters In**: Web controllers (`api/src/adapters/in/web/`)
- **Adapters Out**: Infrastructure implementations (`api/src/adapters/out/postgresql/`)
    - Entity definitions in `entity/` subdirectories
    - Adapter implementations that implement port interfaces

When adding new features:

1. Define port interfaces in `core/ports/out/`
2. Implement business logic in `core/services/`
3. Create adapter implementations in `adapters/out/postgresql/`
4. Register providers in the feature module using the port token pattern
5. Create controllers in `adapters/in/web/`

## Common Commands

### Development Setup

```bash
# Install dependencies for all packages
npm install --prefix api
npm install --prefix ui
npm install --prefix db

# Copy and configure environment
cp .env.example .env
```

### Running the Application

**Docker (recommended):**

```bash
make up              # Start full stack with docker-compose
make down            # Stop and remove containers
make restart         # Restart the stack
docker compose logs -f db api ui  # View live logs
```

**Local development:**

```bash
# Start API (port 3000)
npm run start:dev --prefix api

# Start UI (port 1234)
npm start --prefix ui
```

### Database Migrations

**All migration commands run from `db/` directory:**

```bash
cd db
npm run migration:run                              # Run pending migrations
npm run migration:generate migrations/MigrationName  # Generate from entity changes
npm run migration:create migrations/MigrationName    # Create empty migration
npm run migration:revert                           # Revert last migration
npm run migration:show                             # Show migration status
```

Entities are defined in `api/src/adapters/out/postgresql/*/entity/*.entity.ts` and referenced by the db package via TypeScript path mapping.

### Testing

**API (NestJS):**

```bash
npm test --prefix api                    # Run unit tests
npm run test:watch --prefix api          # Watch mode
npm run test:cov --prefix api            # With coverage
npm run test:e2e --prefix api            # End-to-end tests
```

**UI (Angular):**

```bash
npm test --prefix ui                          # Run tests (interactive)
npm run test:headless --prefix ui             # Headless Chrome
npm run test:headless:single --prefix ui      # Single run (CI mode)
```

### Linting and Formatting

```bash
# Root-level eslint config covers both API and UI
npx eslint api/**/*.ts --fix
npx eslint ui/**/*.ts --fix

# Prettier (root level)
npm run prettier
```

### Building

```bash
npm run build --prefix api    # Build NestJS API
npm run build --prefix ui     # Build Angular UI
```

## Architecture Details

### Backend (NestJS)

**Environment Configuration:**

- Uses `.env` file in root directory (shared with db/)
- ConfigModule is global with cascading env file resolution
- Required variables: DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, SESSION_SECRET

**Authentication:**

- Session-based auth using express-session with PostgreSQL store (connect-pg-simple)
- Passport.js with local strategy
- Sessions stored in database (table created automatically)
- CORS enabled for `http://localhost:1234` with credentials

**Security:**

- Helmet middleware with CSP headers
- Global ValidationPipe with whitelist and transform enabled
- httpOnly cookies, sameSite: 'lax'
- secure cookies in production
- bcrypt for password hashing

**Module Structure:**

- Feature modules register their own TypeORM entities
- Providers use dependency injection tokens for ports (e.g., PROJECT_PORT, TASK_PORT)
- All routes prefixed with `/api`

**Key Entities:**

- UserEntity: User accounts
- ProjectEntity: Projects with owner relationships
- TaskEntity: Tasks associated with projects
- BaseEntity: Shared fields (id, createdAt, updatedAt, deletedAt)

### Frontend (Angular)

**Routing:**

- Lazy-loaded feature modules (e.g., dashboard)
- Auth routes: `/login`, `/signup`
- Main app redirects to `/dashboard`

**Structure:**

- `auth/`: Authentication components and services
- `dashboard/`: Main dashboard feature (lazy-loaded)
- `projects/`: Project management feature
- `tasks/`: Task management feature
- `shared/`: Shared components and utilities

**Services:**

- HTTP services for API communication
- Services communicate with backend at `http://localhost:3000/api`

### Database

**Configuration:**

- TypeORM with migrations managed separately from API
- `synchronize: false` enforced (migrations only)
- Entities auto-loaded from API code
- Migration files stored in `db/migrations/`

## Testing Notes

- API tests use Jest
- UI tests use Jasmine/Karma
- E2E test configuration in `api/test/jest-e2e.json`
- Puppeteer available for UI E2E testing

## Docker Configuration

- **db**: PostgreSQL 15 Alpine, port 5432, health checks enabled
- **api**: Port 3000, depends on db health
- **ui**: Port 1234, depends on api
- Data persisted in `db-data` volume

## Important Conventions

- Never use `synchronize: true` in TypeORM - always use migrations
- Keep migrations in `db/` directory separate from API code
- Environment config shared via root `.env` file (referenced by api/ and db/)
- Use port interfaces for dependency injection in hexagonal architecture
- Feature modules should export their port tokens for use by other modules
