# Bernoulli Monorepo

This project contains:

- **api/**: Nest.js backend (TypeORM, PostgreSQL)
- **ui/**: Angular frontend

## Prerequisites

- Node.js (v18+ recommended)
- npm
- PostgreSQL (for API)

## Setup

### 1. Install dependencies

```
npm install --prefix api
npm install --prefix ui
```

### 2. Configure environment variables for API

Copy the example file and edit as needed:

```
cp api/.env.example api/.env
```

Edit `api/.env` to match your PostgreSQL setup.

### 3. Start the API server

```
npm run start --prefix api
```

### 4. Start the UI (Angular) server

```
npm start --prefix ui
```

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

- The top-level `.gitignore` covers all files that should be ignored in both `api/` and `ui/`.
- No subdirectory is a git repo; only the top-level project should be versioned.
- The API is preconfigured for PostgreSQL via environment variables.

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
