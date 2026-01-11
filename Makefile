.PHONY: help setup plots plots-force docker-build docker-up docker-down docker-logs dev-backend dev-frontend dev clean

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  setup         Initialize development environment"
	@echo "  plots         Generate transit plots from data/ to plots/"
	@echo "  plots-force   Regenerate all plots (even existing ones)"
	@echo "  docker-build  Build Docker image"
	@echo "  docker-up     Start application with Docker Compose"
	@echo "  docker-down   Stop application"
	@echo "  docker-logs   Show application logs"
	@echo "  dev-backend   Run backend in development mode"
	@echo "  dev-frontend  Run frontend in development mode"
	@echo "  dev           Run both backend and frontend (requires 2 terminals)"
	@echo "  clean         Remove generated files"

# Setup
setup:
	@mkdir -p data plots db
	@test -f .env || cp .env.example .env
	@echo "Created directories: data/ plots/ db/"
	@echo "Environment file: .env"

# Plot generation
plots:
	cd plotter && uv sync && uv run python generate_plots.py -i ../data -o ../plots -v

plots-force:
	cd plotter && uv sync && uv run python generate_plots.py -i ../data -o ../plots -v --force

# Docker
docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# Development
dev-backend:
	cd backend && go run .

dev-frontend:
	cd frontend && pnpm install && pnpm run dev

dev:
	@echo "Run in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

# Cleanup
clean:
	rm -rf plots/*.png plots/transit_summary.csv
	rm -rf frontend/dist
	rm -rf backend/emoons-web backend/tmp
	rm -rf plotter/.venv
