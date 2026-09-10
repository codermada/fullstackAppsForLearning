.PHONY: help build up down restart logs ps shell exec \
        pull rebuild stop start clean prune

# Docker Compose command
COMPOSE := docker compose

help:
	@echo "Available commands:"
	@echo "  make build      Build containers"
	@echo "  make up         Start containers"
	@echo "  make down       Stop and remove containers"
	@echo "  make restart    Restart containers"
	@echo "  make logs       Follow container logs"
	@echo "  make ps         Show running containers"
	@echo "  make pull       Pull latest images"
	@echo "  make rebuild    Rebuild containers without cache"
	@echo "  make stop       Stop containers"
	@echo "  make start      Start existing containers"
	@echo "  make clean      Remove containers, networks and volumes"
	@echo "  make prune      Remove unused Docker resources"

up-build-d:
	$(COMPOSE) up --build -d

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up

up-d:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

pull:
	$(COMPOSE) pull

rebuild:
	$(COMPOSE) build --no-cache

stop:
	$(COMPOSE) stop

start:
	$(COMPOSE) start

clean:
	$(COMPOSE) down --volumes --remove-orphans

prune:
	docker system prune -f

# Open a shell in a service:
# Usage: make shell SERVICE=app
shell:
	$(COMPOSE) exec $(SERVICE) sh

# Run an arbitrary command:
# Usage: make exec SERVICE=app CMD="python manage.py migrate"
exec:
	$(COMPOSE) exec $(SERVICE) $(CMD)
