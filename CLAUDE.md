# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Exoplanet transit light curve classification web app. Users visually inspect transit plots and classify morphological features. Three components: Go backend, Preact frontend, Python plotter.

## Common Commands

### Development
```bash
make dev-backend        # Run Go backend (port 8080)
make dev-frontend       # Run Preact frontend via Vite (port 5173, proxies /api to backend)
```

### Plot Generation (Python)
```bash
make plots              # Generate transit plots from data/ to plots/
make plots-force        # Regenerate all plots
```

### Plotter Tests & Linting
```bash
make plots-test                                    # Run pytest
cd plotter && uv run pytest tests/test_generator.py  # Single test file
cd plotter && uv run pytest -k "test_name"           # Single test
cd plotter && uv run pytest --cov=transit_plotter --cov-report=term-missing  # Coverage
cd plotter && uv run ruff check .                    # Lint
cd plotter && uv run ruff format .                   # Format
```

### Docker
```bash
make docker-build       # Multi-stage build (Node + Go + Alpine runtime)
make docker-up          # Start container (port 8087 -> 8080)
make docker-down        # Stop container
```

### Secrets
```bash
make encrypt            # Encrypt .env -> .env.enc (sops)
make decrypt            # Decrypt .env.enc -> .env (sops)
```

## Architecture

### Data Flow
1. **Plotter** (offline): Reads CSV light curves from `data/`, fits Batman transit models, generates PNG plots and metadata CSVs into `plots/`
2. **Backend** (startup): Loads `plots/transits.csv` and `plots/curves.csv` into SQLite, creates admin user from env vars
3. **Frontend**: SPA that queries backend API, displays transit plots, collects user classifications

### Backend (Go 1.23 + Gin)
- `main.go` — Entry point, route setup, static file serving
- `db/` — SQLite connection, migration runner (5 migrations in `db/migrations/`)
- `models/` — Data access layer (User, Transit, Curve, Classification)
- `handlers/` — HTTP handlers (auth, transits, curves, classifications, admin)
- `middleware/` — JWT auth and admin role verification

Routes: `/api/auth/*`, `/api/curves`, `/api/transits`, `/api/classifications`, `/api/admin/*`, `/plots/*` (static)

### Frontend (Preact + Vite + DaisyUI)
- `src/app.jsx` — Router setup
- `src/api/client.js` — REST API client with JWT token handling
- `src/stores/auth.js` — Auth state via Preact Signals
- `src/components/` — UI components (CurveList, TransitViewer, ClassificationForm, AdminPanel)
- Package manager: **pnpm**

### Plotter (Python 3.12+ / uv)
- `generate_plots.py` — CLI entry point (Click)
- `transit_plotter/generator.py` — Orchestrates transit detection and processing
- `transit_plotter/transit_model.py` — Batman model fitting
- `transit_plotter/plotter.py` — Matplotlib plot generation
- `transit_plotter/data_loader.py` — CSV parsing
- `transit_plotter/exporter.py` — CSV output
- Ruff config: line-length 110, double quotes

### Database (SQLite)
Tables: `Users`, `Curves` (light curves), `Transits`, `Classifications`

### Production Deployment
Single Docker image (Alpine) with compiled Go binary serving the built Preact SPA. Traefik reverse proxy for SSL. Volumes: `./plots` (ro), `./db` (rw).

## Key Conventions

- JWT tokens expire after 24 hours; passwords use bcrypt
- Frontend dev server proxies `/api` and `/plots` to the backend
- Transit plot filenames encode the curve and transit index
- The `FRONTEND_DIR` env var controls whether the backend serves static files (production) or not (dev mode with Vite proxy)
