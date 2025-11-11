# Bernoulli Monorepo

This project contains:

- **api/**: Nest.js backend (TypeORM, PostgreSQL)
- **ui/**: Angular frontend
- **db/**: TypeORM database migrations (separate from API code)

## Prerequisites

- Node.js (v18+ recommended)
- npm
- PostgreSQL (for API)

## Setup

### 1. Install dependencies

```bash
npm install --prefix api
npm install --prefix ui
npm install --prefix db
```

### 2. Configure environment variables

Copy the example file and edit as needed:

```bash
cp .env.example .env.local
```

Edit `.env.local` to match your PostgreSQL setup. This file is shared by both the API and database migrations to avoid duplication.

### 3. Start the API server

```
npm run start --prefix api
```

### 4. Start the UI (Angular) server

```
npm start --prefix ui
```

## Database Migrations

This project uses TypeORM migrations kept separate from the API code in the `db/` directory.

### Run pending migrations

```bash
cd db
npm run migration:run
```

### Create a new migration

```bash
cd db
npm run migration:create migrations/YourMigrationName
```

### Generate a migration from entity changes

```bash
cd db
npm run migration:generate migrations/YourMigrationName
```

For more details, see [db/README.md](db/README.md).

## Running Tests

### API (Nest.js)

```
npm test --prefix api
```

### UI (Angular)

```
npm test --prefix ui
```

## Notes

- The top-level `.gitignore` covers all files that should be ignored in all subdirectories.
- No subdirectory is a git repo; only the top-level project should be versioned.
- The API is preconfigured for PostgreSQL via environment variables.
- Database configuration is shared via root-level `.env.local` file (used by both `api/` and `db/`).
- Database migrations are kept in `db/` directory, separate from API code for better organization.

## Running the stack (Make)

Use the provided `Makefile` to start and stop the project's Docker services. Make sure Docker and Docker Compose (or the Docker CLI "compose" plugin) are installed on your machine.

Start the full stack (detached, rebuild images):

```
make up
```

Stop and remove containers and networks:

```
make down
```

Restart the stack (down then up):

```
make restart
```

View live logs (follow):

```
docker compose logs -f db api ui
```

Notes:

- Exposed ports: `db` -> `5432`, `api` -> `3000`, `ui` -> `1234`.
- The `docker-compose.yml` contains the DB credentials used by the stack. To change them edit `docker-compose.yml` or provide alternate values via an environment file for docker-compose.
- The `api` service depends on the `db` healthcheck; on first run Postgres may take a short while to initialize.
- You can still use the Docker CLI directly with `docker compose` or `docker-compose` if you prefer.
- To run only a specific service, append the service name: `docker compose up api`.

## Useful Commands

- Build Angular UI: `npm run build --prefix ui`
- Build Nest.js API: `npm run build --prefix api`

---

For further customization, see the README files in `api/` and `ui/`.
