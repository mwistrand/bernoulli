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
- Optional variables for observability: OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME

**Authentication:**

- Session-based auth using express-session with PostgreSQL store (connect-pg-simple)
- Passport.js with local strategy
- Sessions stored in database (table created automatically)
- CORS enabled for `http://localhost:1234` with credentials
- User role included in session data

**Authorization & RBAC:**

The application implements Role-Based Access Control (RBAC) with two levels:

**User Roles** (system-level):

- `ADMIN`: Can create/delete projects, manage all project members
- `USER`: Can manage tasks within projects they're assigned to (default for new users)

**Project Roles** (project-level):

- `ADMIN`: Can add/remove members, change member roles, manage project settings
- `USER`: Can create/edit/delete tasks within the project

**Access Control Rules:**

- Projects are visible only to members (membership-based access)
- Tasks inherit access control from parent project
- Project creators automatically become project ADMIN members
- First user account in system is granted ADMIN role
- Project creators cannot be removed or demoted from ADMIN role

**Implementation:**

- `UserEntity` has `role` enum field (ADMIN, USER)
- `ProjectMemberEntity` tracks project membership with project-level roles
- Unique constraint on (projectId, userId) prevents duplicate memberships
- Services validate both user role and project membership before operations
- `ProjectMemberService` handles member management with authorization checks
- `ProjectService` and `TaskService` require membership validation

**Security:**

- Helmet middleware with CSP headers
- Global ValidationPipe with whitelist and transform enabled
- httpOnly cookies, sameSite: 'lax'
- secure cookies in production
- bcrypt for password hashing
- All project/task operations require membership verification
- Role-based authorization enforced at service layer

**Module Structure:**

- Feature modules register their own TypeORM entities
- Providers use dependency injection tokens for ports (e.g., PROJECT_PORT, TASK_PORT, PROJECT_MEMBER_PORT)
- All routes prefixed with `/api`
- AuthModule exports AUTH_PORT for use by other modules

**API Endpoints:**

_Authentication:_

- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get authenticated user session

_Users:_

- `POST /api/users` - Create new user (auto-login after signup)
- `GET /api/users` - Get all users (authenticated)
- `GET /api/users/me` - Get current user details

_Projects:_

- `POST /api/projects` - Create project (ADMIN role required)
- `GET /api/projects` - Get all projects (membership-based)
- `GET /api/projects/:id` - Get project details (requires membership)

_Tasks:_

- `POST /api/projects/:id/tasks` - Create task (requires membership)
- `GET /api/projects/:id/tasks` - Get project tasks (requires membership)
- `PATCH /api/projects/:projectId/tasks/:taskId` - Update task (requires membership)
- `DELETE /api/projects/:projectId/tasks/:taskId` - Delete task (requires membership)

_Project Members:_

- `GET /api/projects/:projectId/members` - Get project members (requires membership)
- `POST /api/projects/:projectId/members` - Add member (project ADMIN only)
- `DELETE /api/projects/:projectId/members/:userId` - Remove member (project ADMIN only)
- `PATCH /api/projects/:projectId/members/:userId/role` - Update member role (project ADMIN only)

**Key Entities:**

- UserEntity: User accounts with role field (ADMIN/USER)
- ProjectEntity: Projects with creator tracking (extends BaseEntity)
- TaskEntity: Tasks associated with projects (extends BaseEntity)
- ProjectMemberEntity: Project membership with project-level roles (ADMIN/USER)
- BaseEntity: Shared fields (createdBy, lastUpdatedBy, createdAt, lastUpdatedAt)

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

**Internationalization (i18n):**

- Uses `@ngx-translate/core` for translations
- Translation files: `public/assets/i18n/en.json` and `es.json`
- **Templates**: Use the `translate` pipe: `{{ 'key.path' | translate }}`
- **Component code**: Inject `TranslateService` as `#translate` and use `this.#translate.instant('key.path')` or `this.#translate.instant('key.path', { param: value })` for parameterized translations
- All components using translations must import `TranslateModule` in their imports array
- Translation keys follow a hierarchical structure:
    - `auth.*` - Authentication related strings
    - `projects.*` - Project management strings
    - `tasks.*` - Task management strings
    - `common.*` - Shared/common strings
- **Never hard-code user-facing text** - always use translation keys
- When adding new features, add corresponding translation keys to both `en.json` and `es.json`

### Database

**Configuration:**

- TypeORM with migrations managed separately from API
- `synchronize: false` enforced (migrations only)
- Entities auto-loaded from API code
- Migration files stored in `db/migrations/`

## Testing Requirements

**IMPORTANT: All code changes must include corresponding tests.**

### Test Coverage Expectations

When making any changes to the codebase, you must add or update tests to cover:

- New components, services, resolvers, guards, pipes, and directives
- New business logic in API services and adapters
- Modified functionality (update existing tests to reflect changes)
- Edge cases and error handling scenarios
- Permission checks and authorization logic

### API Testing (NestJS)

- **Unit tests**: Test individual services, controllers, and adapters in isolation
- **Integration tests**: Test module interactions and database operations
- **E2E tests**: Test complete API workflows from HTTP request to response
- Minimum coverage expectations: 80% for new code
- Use Jest for all API testing

### UI Testing (Angular)

- **Component tests**: Test component logic, data binding, and user interactions
- **Service tests**: Test HTTP services, state management, and business logic
- **Resolver tests**: Test route resolvers including success, error, and edge cases
- **Guard tests**: Test authentication and authorization guards
- Minimum coverage expectations: 80% for new code
- Use Jasmine/Karma for unit tests
- Puppeteer available for E2E testing

### Test File Naming

- API: `*.spec.ts` for unit tests, `*.e2e-spec.ts` for E2E tests
- UI: `*.spec.ts` for all tests
- Place test files adjacent to the code they test

### Running Tests

See "Common Commands > Testing" section for test commands.

### Before Committing

Always run tests before committing code:

```bash
# API tests
npm test --prefix api

# UI tests
npm run test:headless:single --prefix ui
```

## Docker Configuration

- **db**: PostgreSQL 15 Alpine, port 5432, health checks enabled
- **api**: Port 3000, depends on db health
- **ui**: Port 1234, depends on api
- **jaeger**: Jaeger all-in-one for distributed tracing, port 16686 (UI), 4318 (OTLP HTTP)
- Data persisted in `db-data` volume

## Observability & Distributed Tracing

The application uses **OpenTelemetry** for distributed tracing with **Jaeger** as the backend.

### Architecture

**OpenTelemetry Integration:**

- Automatic instrumentation for HTTP requests, Express middleware, and PostgreSQL queries
- Traces are exported to Jaeger via OTLP (OpenTelemetry Protocol) over HTTP
- Service name: `bernoulli-api`
- Initialization happens in `api/src/tracing.ts` (imported first in `main.ts`)

**Instrumentation Packages:**

- `@opentelemetry/sdk-node`: Core SDK for Node.js
- `@opentelemetry/instrumentation-http`: HTTP request/response tracing
- `@opentelemetry/instrumentation-express`: Express middleware and route tracing
- `@opentelemetry/instrumentation-pg`: PostgreSQL query tracing
- `@opentelemetry/exporter-trace-otlp-http`: OTLP HTTP exporter for Jaeger

**Environment Variables:**

```bash
# In docker-compose.yml or .env
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318  # Jaeger collector endpoint
OTEL_SERVICE_NAME=bernoulli-api                  # Service identifier in traces
```

### Accessing Jaeger UI

**Docker environment:**

- Jaeger UI: http://localhost:16686
- Select service: `bernoulli-api`
- View traces with full span details including:
    - HTTP request/response information
    - Express middleware execution
    - PostgreSQL query statements and timing
    - Parent-child span relationships

**Local development without Docker:**

- Start Jaeger: `docker run -d --name jaeger -p 16686:16686 -p 4318:4318 -e COLLECTOR_OTLP_ENABLED=true jaegertracing/all-in-one:1.53`
- Update `.env`: `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`

### How It Works

1. **Initialization** (`api/src/tracing.ts`):
    - Imported FIRST in `main.ts` before any other code
    - Creates NodeSDK with specific instrumentations
    - Configures OTLP exporter with Jaeger endpoint
    - Sets service resource attributes
    - Disables tracing in test environment (`NODE_ENV=test`)

2. **Automatic Tracing**:
    - **HTTP Layer**: Captures all incoming HTTP requests
    - **Express Layer**: Traces middleware execution (CORS, session, Helmet, etc.)
    - **Database Layer**: Captures PostgreSQL queries with statements
    - No code changes required in controllers or services

3. **Trace Export**:
    - Spans are batched and sent to Jaeger via HTTP
    - Default endpoint: `http://jaeger:4318/v1/traces`
    - Graceful shutdown on `SIGTERM`

### Adding Custom Spans

To add custom instrumentation (manual spans):

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');

async myFunction() {
  const span = tracer.startSpan('my-operation');
  try {
    // Your code here
    span.setAttribute('custom.attribute', 'value');
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

### Troubleshooting

**No traces appearing in Jaeger:**

1. Check API logs: `docker compose logs api | grep -i "tracing\|exporter"`
2. Verify Jaeger is running: `docker compose ps jaeger`
3. Check environment variables: `docker compose exec api env | grep OTEL`
4. Ensure requests are being made to the API
5. Wait 5-10 seconds for trace export batch

**Testing locally without Docker:**

```bash
cd api
npm run build
npm start
# Make requests to http://localhost:3000/api/*
# View traces at http://localhost:16686
```

## Important Conventions

- Never use `synchronize: true` in TypeORM - always use migrations
- Keep migrations in `db/` directory separate from API code
- Environment config shared via root `.env` file (referenced by api/ and db/)
- Use port interfaces for dependency injection in hexagonal architecture
- Feature modules should export their port tokens for use by other modules
- Use `lucide-angular` for icons in the ui, not SVG.
