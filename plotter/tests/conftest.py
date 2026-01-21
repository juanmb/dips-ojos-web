"""Shared fixtures for transit plotter tests."""

from pathlib import Path

import pytest

# Paths relative to the tests directory
TESTS_DIR = Path(__file__).parent
TEST_DATA_DIR = TESTS_DIR / "data"


@pytest.fixture
def data_dir() -> Path:
    """Path to the test data directory with input CSV files."""
    return TEST_DATA_DIR


@pytest.fixture
def sample_simulated_file(data_dir: Path) -> Path:
    """Path to a sample simulated data file."""
    return data_dir / "Corot1b.csv"


@pytest.fixture
def sample_simulated_file_2(data_dir: Path) -> Path:
    """Path to another sample simulated data file."""
    return data_dir / "kepler2002b.csv"


@pytest.fixture
def transit_summary_csv(data_dir: Path) -> Path:
    """Path to the reference transits.csv."""
    return data_dir / "reference_transits.csv"


@pytest.fixture
def light_curves_csv(data_dir: Path) -> Path:
    """Path to the reference curves.csv."""
    return data_dir / "reference_curves.csv"
