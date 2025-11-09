.PHONY: up down restart

# Start services (detached) and rebuild images
up:
	docker compose up -d --build

# Stop and remove containers and networks
down:
	docker compose down

# Restart the stack (down then up)
restart: down up
