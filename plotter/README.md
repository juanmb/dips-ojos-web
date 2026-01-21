# Transit Plotter

Python tool for processing exoplanet transit light curves and generating transit plots with fitted models.

## Features

- Load light curve data from CSV files with orbital parameters in headers
- Detect and extract individual transits based on ephemeris
- Fit transit models using the Batman package
- Generate publication-quality plots with data, model, and residuals
- Export transit summary and light curve metadata to CSV

## Installation

```bash
uv sync
```

## Usage

### Generate Plots

```bash
# Process all CSV files in data/ and output to plots/
uv run python generate_plots.py -i ../data -o ../plots -v

# Force regeneration of existing plots
uv run python generate_plots.py -i ../data -o ../plots -v --force

# Skip model fitting (faster, uses initial parameters)
uv run python generate_plots.py -i ../data -o ../plots -v --skip-fitting

# Dry run (show what would be processed)
uv run python generate_plots.py -i ../data -o ../plots --dry-run
```

### Output Files

The tool generates:
- `*.png`: Individual transit plots with data, model, and residuals
- `transits.csv`: Per-transit metadata (fitted parameters, TTV, etc.)
- `curves.csv`: Per-file metadata (time range, transit count, etc.)

## Development

### Run Tests

```bash
make test        # Run all tests
make test-cov    # Run with coverage report
```

### Code Quality

```bash
make lint        # Run ruff linter
make format      # Format code with ruff
```

## Project Structure

```
plotter/
├── generate_plots.py      # CLI entry point
├── transit_plotter/       # Main package
│   ├── data_loader.py     # CSV loading and parsing
│   ├── exporter.py        # CSV export functions
│   ├── generator.py       # Transit processing and fitting
│   ├── plotter.py         # Plot generation
│   └── types.py           # Type definitions
├── tests/                 # Test suite
│   ├── data/              # Test data files
│   ├── test_data_loader.py
│   ├── test_exporter.py
│   └── test_generator.py
└── pyproject.toml
```

## Input Data Format

CSV files must include header metadata with orbital parameters:

```
# Orbit Period (days): 2.36
# Transit Epoch (BJD): 2454833.59
# Planet Radius (R_planet/R_star): 0.1
# Planet Semi-major Axis (a/R_star): 8.0
# ...
Tiempo [BJDS],Flujo
2454833.0,1.0001
2454833.1,0.9998
...
```

## Dependencies

- batman-package: Transit light curve models
- matplotlib: Plotting
- numpy/pandas: Data processing
- scipy: Model fitting
