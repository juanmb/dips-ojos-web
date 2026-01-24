# Dips OjOs Web

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
- **Plot Generator**: Python + Batman transit model

## Quick Start

```bash
# Initialize environment (creates directories and .env)
make setup

# Copy your light curve CSV files to data/
cp /path/to/your/*.csv data/

# Generate transit plots
make plots

# Build and start the application
make docker-build
make docker-up

# Access at http://localhost:8080
```

## Make Targets

```
make setup          Initialize development environment
make plots          Generate transit plots from data/ to plots/
make plots-force    Regenerate all plots (even existing ones)
make plots-test     Run plotter tests
make docker-build   Build Docker image
make docker-up      Start application with Docker Compose
make docker-down    Stop application
make docker-logs    Show application logs
make dev-backend    Run backend in development mode
make dev-frontend   Run frontend in development mode
make clean          Remove generated files
```

## Docker Deployment

### Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# Required: Admin credentials (created on first startup)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Required: JWT secret (use a random string in production)
JWT_SECRET=your-secret-key

# Required for Traefik: Hostname for SSL certificates
HOSTNAME=your-domain.com
```

### Build and Run

```bash
# Build the Docker image
make docker-build

# Start the application
make docker-up

# View logs
make docker-logs

# Stop the application
make docker-down
```

The application will be available at `http://localhost:8087` (or via Traefik at your configured hostname).

### Volumes

The compose file mounts:
- `./plots:/plots:ro` - Transit plot images (read-only)
- `./db:/db` - SQLite database (persistent)

## Development

Run backend and frontend in separate terminals:

```bash
# Terminal 1: Backend
make dev-backend

# Terminal 2: Frontend
make dev-frontend
```

### Environment Variables

- `ADMIN_USERNAME`: Admin user name (default: `admin`)
- `ADMIN_PASSWORD`: Admin user password (default: `admin`)
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: `8080`)
- `DATABASE_PATH`: SQLite database path (default: `../db/transit_analysis.db`)
- `TRANSITS_CSV_PATH`: Transits CSV (default: `../plots/transits.csv`)
- `CURVES_CSV_PATH`: Curves CSV (default: `../plots/curves.csv`)
- `PLOTS_DIR`: Plot images directory (default: `../plots`)
- `FRONTEND_DIR`: Built frontend assets (empty = dev mode with Vite proxy)

## Data Format

### Input CSV Files

Place CSV files in `data/`. Each file should contain:

1. **Header metadata** with orbital parameters:
   - `Orbit Period (days)`
   - `Transit Epoch (BJD)`
   - `Planet Radius (R_planet/R_star)`
   - `Planet Semi-major Axis (a/R_star)`
   - Limb darkening coefficients, inclination, etc.

2. **Data columns**:
   - `Tiempo [BJDS]`: Time in BJD
   - `Flujo`: Normalized flux

### Output Files

The plot generator creates in `plots/`:
- `*.png`: Individual transit plot images
- `transits.csv`: Transit metadata for all processed files
- `curves.csv`: Light curve metadata for all processed files

## User Management

```bash
sqlite3 db/transit_analysis.db

INSERT INTO Usuarios (username, password, fullname)
VALUES ('user', '<bcrypt-hash>', 'Full Name');
```

Generate bcrypt hash:
```python
import bcrypt
print(bcrypt.hashpw(b"password", bcrypt.gensalt()).decode())
```

## Classification Fields

- **Morfología Normal/Anómala**: Transit shape classification
- **Asimetría Izquierda/Derecha**: Left/Right asymmetry
- **Aumento/Disminución Flujo Interior**: Flux variation during transit
- **TDV Marcada**: Marked Transit Duration Variation
- **Notas**: Free-form notes

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `A` | Previous transit |
| `→` / `D` | Next transit |
| `↑` / `W` | Previous curve |
| `↓` / `S` | Next curve |
| `?` | Show help |

## License

MIT
