# Database Migrations

This directory contains TypeORM migrations for the Bernoulli project, kept separate from the API code.

## Setup

1. Install dependencies:

    ```bash
    cd db
    npm install
    ```

2. Ensure your root `.env.local` file has the correct database credentials.

## Usage

All migration commands should be run from the `db/` directory:

### Create a new migration (manually)

```bash
npm run migration:create migrations/YourMigrationName
```

### Generate a migration from entity changes

```bash
npm run migration:generate migrations/YourMigrationName
```

### Run pending migrations

```bash
npm run migration:run
```

### Revert the last migration

```bash
npm run migration:revert
```

### Show migration status

```bash
npm run migration:show
```

## Configuration

- **Environment variables**: Loaded from `../.env.local` (root level)
- **Entities**: References entities from `../api/src/**/*.entity.ts`
- **Migrations**: Stored in `./migrations/`
- **TypeORM config**: See `ormconfig.ts`

## Environment Variables

The following variables are required in `../.env.local`:

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database user (default: bernoulli)
- `DB_PASS` - Database password
- `DB_NAME` - Database name (default: bernoulli)

## Notes

- Migrations are kept separate from API code for independence
- Environment configuration is shared via root-level `.env` files to avoid duplication
- The `db/` project can reference API entities via TypeScript path mapping
- Never use `synchronize: true` in production - always use migrations
