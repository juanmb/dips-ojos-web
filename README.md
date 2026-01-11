# EMoons Web

Web application for exoplanet transit light curve classification. Allows users to visually inspect transit plots and classify morphological features, asymmetries, and anomalies.

## Features

- Pre-generated transit plots from light curve CSV data
- User authentication with JWT tokens
- Transit classification with checkboxes and notes
- Keyboard navigation between transits and curves
- Progress tracking per curve

## Architecture

- **Backend**: Go + Gin + SQLite
- **Frontend**: Preact + DaisyUI + Vite
- **Plot Generator**: Python + Batman transit model (run locally before deployment)

## Quick Start

### 1. Generate Transit Plots

First, generate the transit plots from your light curve CSV files:

```bash
cd plotter

# Install Python dependencies
uv sync

# Generate all plots
uv run python generate_plots.py -i /path/to/csv/files -o ../plots

# Or with verbose output
uv run python generate_plots.py -i /path/to/csv/files -o ../plots -v
```

### 2. Deploy with Docker Compose

```bash
# Create database directory
mkdir -p db

# Start the application
docker compose up -d

# Access at http://localhost:8080
```

## Development Setup

### Backend

```bash
cd backend
go run .
```

Environment variables:
- `DATABASE_PATH`: Path to SQLite database (default: `../../transit_analysis.db`)
- `CSV_PATH`: Path to transit summary CSV (default: `../../plots/transit_summary.csv`)
- `PLOTS_DIR`: Directory containing plot images (default: `../../plots`)
- `FRONTEND_DIR`: Path to built frontend assets (empty = disabled, for dev with Vite proxy)
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: `8080`)

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

### Plot Generator

```bash
cd plotter

# Install dependencies
uv sync

# Generate all plots
uv run python generate_plots.py -i ../data -o ../plots

# Generate specific file with verbose output
uv run python generate_plots.py -f Corot1b.csv -v

# Force regeneration of existing plots
uv run python generate_plots.py --force

# Dry run (list files without processing)
uv run python generate_plots.py --dry-run
```

## Data Format

### Light Curve CSV Files

Each CSV file should contain:

1. **Header metadata** with orbital parameters:
   - `Orbit Period (days)`
   - `Transit Epoch (BJD)`
   - `Planet Radius (R_planet/R_star)`
   - `Planet Semi-major Axis (a/R_star)`
   - Limb darkening coefficients, inclination, etc.

2. **Data columns**:
   - `Tiempo [BJDS]`: Time in BJD
   - `Flujo`: Normalized flux

### Generated Files

The plot generator creates:
- `plots/*.png`: Individual transit plot images
- `plots/transit_summary.csv`: Transit metadata for all processed files

## User Management

Create users directly in the SQLite database:

```bash
sqlite3 db/transit_analysis.db

INSERT INTO Usuarios (username, password, fullname)
VALUES ('user', '<bcrypt-hash>', 'Full Name');
```

To generate a bcrypt hash:
```python
import bcrypt
print(bcrypt.hashpw(b"password", bcrypt.gensalt()).decode())
```

## Classification Fields

- **Morfología Normal**: Normal transit shape
- **Morfología Anómala**: Anomalous transit shape
- **Asimetría Izquierda/Derecha**: Left/Right asymmetry
- **Aumento/Disminución Flujo Interior**: Flux increase/decrease during transit
- **TDV Marcada**: Marked Transit Duration Variation
- **Notas**: Free-form notes

## Keyboard Shortcuts

- `←` / `A`: Previous transit
- `→` / `D`: Next transit
- `↑` / `W`: Previous curve
- `↓` / `S`: Next curve
- `?`: Show help

## License

MIT
