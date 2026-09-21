.PHONY: help build up up-d up-build-d down restart logs ps pull rebuild \
        stop start clean rm-images prune fclean shell exec \
        log-postgres log-nginx log-backend log-frontend \
        exec-postgres exec-nginx exec-backend exec-frontend \
        restart-postgres restart-nginx restart-backend restart-frontend \
        rebuild-postgres rebuild-nginx rebuild-backend rebuild-frontend

# Docker Compose command
COMPOSE := docker compose

# Default target
.DEFAULT_GOAL := help

# ============================================================
#  HELP
# ============================================================
help:
	@echo "Available commands:"
	@echo ""
	@echo "  ── Lifecycle ──────────────────────────────────────────"
	@echo "    make build             Build containers"
	@echo "    make rebuild           Rebuild containers without cache"
	@echo "    make up                Start containers (foreground)"
	@echo "    make up-d              Start containers (detached)"
	@echo "    make up-build-d        Build and start containers (detached)"
	@echo "    make start             Start existing containers"
	@echo "    make stop              Stop containers"
	@echo "    make restart           Restart containers"
	@echo "    make down              Stop and remove containers"
	@echo ""
	@echo "  ── Inspection ─────────────────────────────────────────"
	@echo "    make logs              Follow logs of all containers"
	@echo "    make ps                Show running containers"
	@echo "    make pull              Pull latest images"
	@echo ""
	@echo "  ── Per-service logs ───────────────────────────────────"
	@echo "    make log-postgres      Follow postgres logs"
	@echo "    make log-nginx         Follow nginx logs"
	@echo "    make log-backend       Follow backend logs"
	@echo "    make log-frontend      Follow frontend logs"
	@echo ""
	@echo "  ── Per-service shells ─────────────────────────────────"
	@echo "    make exec-postgres     Open a bash shell in postgres"
	@echo "    make exec-nginx        Open a bash shell in nginx"
	@echo "    make exec-backend      Open a bash shell in backend"
	@echo "    make exec-frontend     Open a bash shell in frontend"
	@echo ""
	@echo "  ── Per-service restart ────────────────────────────────"
	@echo "    make restart-postgres  Restart postgres"
	@echo "    make restart-nginx     Restart nginx"
	@echo "    make restart-backend   Restart backend"
	@echo "    make restart-frontend  Restart frontend"
	@echo ""
	@echo "  ── Per-service rebuild ────────────────────────────────"
	@echo "    make rebuild-postgres  Rebuild & restart postgres (no deps)"
	@echo "    make rebuild-nginx     Rebuild & restart nginx (no deps)"
	@echo "    make rebuild-backend   Rebuild & restart backend (no deps)"
	@echo "    make rebuild-frontend  Rebuild & restart frontend (no deps)"
	@echo ""
	@echo "  ── Generic access ─────────────────────────────────────"
	@echo "    make shell SERVICE=name           Open a shell in a service"
	@echo "    make exec  SERVICE=name CMD=\"...\"  Run a command in a service"
	@echo ""
	@echo "  ── Cleanup ────────────────────────────────────────────"
	@echo "    make clean             Remove containers, networks and volumes"
	@echo "    make rm-images         Remove containers, volumes and images"
	@echo "    make prune             Remove unused Docker resources"
	@echo "    make fclean            Full clean (containers + images + volumes + prune)"

# ============================================================
#  LIFECYCLE
# ============================================================
build:
	$(COMPOSE) build

rebuild:
	$(COMPOSE) build --no-cache

up:
	$(COMPOSE) up

up-d:
	$(COMPOSE) up -d

up-build-d:
	$(COMPOSE) up --build -d

start:
	$(COMPOSE) start

stop:
	$(COMPOSE) stop

restart:
	$(COMPOSE) restart

down:
	$(COMPOSE) down

# ============================================================
#  INSPECTION
# ============================================================
logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

pull:
	$(COMPOSE) pull

# ============================================================
#  PER-SERVICE LOGS
# ============================================================
log-postgres:
	$(COMPOSE) logs -f postgres

log-nginx:
	$(COMPOSE) logs -f nginx

log-backend:
	$(COMPOSE) logs -f backend

log-frontend:
	$(COMPOSE) logs -f frontend

# ============================================================
#  PER-SERVICE SHELLS
# ============================================================
exec-postgres:
	$(COMPOSE) exec postgres bash

exec-nginx:
	$(COMPOSE) exec nginx bash

exec-backend:
	$(COMPOSE) exec backend bash

exec-frontend:
	$(COMPOSE) exec frontend bash

# ============================================================
#  PER-SERVICE RESTART
# ============================================================
restart-postgres:
	$(COMPOSE) restart postgres

restart-nginx:
	$(COMPOSE) restart nginx

restart-backend:
	$(COMPOSE) restart backend

restart-frontend:
	$(COMPOSE) restart frontend

# ============================================================
#  PER-SERVICE REBUILD
# ============================================================
rebuild-postgres:
	$(COMPOSE) up -d --build --no-deps postgres

rebuild-nginx:
	$(COMPOSE) up -d --build --no-deps nginx

rebuild-backend:
	$(COMPOSE) up -d --build --no-deps backend

rebuild-frontend:
	$(COMPOSE) up -d --build --no-deps frontend

# ============================================================
#  GENERIC ACCESS
# ============================================================
# Usage: make shell SERVICE=backend
shell:
	$(COMPOSE) exec $(SERVICE) sh

# Usage: make exec SERVICE=backend CMD="npm run migrate"
exec:
	$(COMPOSE) exec $(SERVICE) $(CMD)

# ============================================================
#  CLEANUP
# ============================================================
clean:
	$(COMPOSE) down --volumes --remove-orphans

rm-images:
	$(COMPOSE) down -v --rmi all --remove-orphans

prune:
	docker system prune -a --volumes -f

fclean: rm-images prune
	docker volume prune --all -f