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

## Useful Commands
- Build Angular UI: `npm run build --prefix ui`
- Build Nest.js API: `npm run build --prefix api`

---
For further customization, see the README files in `api/` and `ui/`.
