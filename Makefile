.PHONY: up down restart db api ui

# Start services (detached) and rebuild images
up:
	docker compose up -d --build

# Stop and remove containers and networks
down:
	docker compose down

# Restart the stack (down then up)
restart: down up

# Bring up the database (rebuild + start)
db:
	docker compose up -d --build --no-deps db

# Ensure db is running, then rebuild/start the API
api:
	# Start the db if it's not already running
	docker compose up -d db
	# Rebuild and start the api service
	docker compose up -d --build --no-deps api

# Rebuild and start the UI service
ui:
	docker compose up -d --build --no-deps ui
