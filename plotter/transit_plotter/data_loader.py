"""Data loading utilities for transit light curve CSV files."""

import warnings
from pathlib import Path
from typing import Callable

import numpy as np
import pandas as pd

from transit_plotter.types import (
    DEFAULT_ECC,
    DEFAULT_EXP_TIME,
    DEFAULT_INC,
    DEFAULT_SUPERSAMPLE,
    DEFAULT_U1,
    DEFAULT_U2,
    DEFAULT_W,
    TransitParams,
)

ENCODINGS = ("utf-8", "latin-1")

# Parameter mappings: header key pattern -> (param_name, converter)
_COMMON_PARAMS: dict[str, tuple[str, Callable]] = {
    "Orbit Period (days)": ("Periodo_orbital_d", float),
    "Transit Epoch (BJD)": ("Epoca_BJDS", float),
    "Star Radius (R_star/R_solar)": ("R_star_R_sol", float),
    "Planet Radius (R_planet/R_star)": ("Radio_Planeta_R_star", float),
    "Orbital Eccentricity": ("ecc", float),
    "Longitude of Periastron (deg)": ("w_deg", float),
    "Exposure Time (days)": ("exp_time", float),
    "Supersample Factor": ("supersample_factor", int),
    "Type": ("Tipo_Datos", str),
}

_SIMULATED_PARAMS: dict[str, tuple[str, Callable]] = {
    **_COMMON_PARAMS,
    "Calculated Transit Duration (days)": ("Duracion_d", float),
    "Planet Semi-major Axis (a/R_star)": ("Semieje_a_R_star", float),
    "Limb Darkening Coeff (u1)": ("Coeficiente_LD_u1", float),
    "Limb Darkening Coeff (u2)": ("Coeficiente_LD_u2", float),
    "Planet Inclination (deg)": ("Inc_planeta_deg", float),
    "Noise Sigma": ("Ruido_Sigma", float),
    # Ground truth parameters
    "Number of Spots": ("gt_n_manchas", int),
    "Spot Size Min (R_star)": ("gt_tamano_min_mancha", float),
    "Spot Size Max (R_star)": ("gt_tamano_max_mancha", float),
    "Spot Contrast": ("gt_contraste_mancha", float),
    "Satellite Radius (R_satellite/R_star)": ("gt_radio_exoluna", float),
    "Satellite Orbital Period (days)": ("gt_periodo_exoluna", float),
    "Satellite Semi-major Axis (a_sat/R_star)": ("gt_semieje_exoluna", float),
    "TTV Amplitude (days)": ("gt_amplitud_ttv_dias", float),
    "TTV Period (planet orbits)": ("gt_periodo_ttv_orbitas", float),
    "TTV Phase (radians)": ("gt_fase_ttv_rad", float),
}

_REAL_PARAMS: dict[str, tuple[str, Callable]] = {
    **_COMMON_PARAMS,
    "Transit Duration (days)": ("Duracion_d", float),
    "Semi-major Axis (a/R_star)": ("Semieje_a_R_star", float),
    "Limb Darkening Coefficient u1": ("Coeficiente_LD_u1", float),
    "Limb Darkening Coefficient u2": ("Coeficiente_LD_u2", float),
    "Orbital Inclination (deg)": ("Inc_planeta_deg", float),
    "Planet Name": ("Nombre_Objeto", str),
    "Star Teff (K)": ("Teff_star", float),
    "Star logg": ("logg_star", float),
}

_SIMULATED_DEFAULTS: dict[str, float | int] = {
    "ecc": DEFAULT_ECC,
    "w_deg": DEFAULT_W,
}

_REAL_DEFAULTS: dict[str, float | int] = {
    "ecc": DEFAULT_ECC,
    "w_deg": DEFAULT_W,
    "exp_time": DEFAULT_EXP_TIME,
    "supersample_factor": DEFAULT_SUPERSAMPLE,
    "Coeficiente_LD_u1": DEFAULT_U1,
    "Coeficiente_LD_u2": DEFAULT_U2,
    "Inc_planeta_deg": DEFAULT_INC,
}


def _read_with_encoding_fallback(filepath: Path) -> list[str]:
    """Read file lines trying multiple encodings."""
    for encoding in ENCODINGS:
        try:
            with open(filepath, encoding=encoding) as f:
                return f.readlines()
        except UnicodeDecodeError:
            if encoding == ENCODINGS[-1]:
                raise
            warnings.warn(f"{encoding.upper()} decode error in '{filepath}', trying next encoding")
    raise IOError(f"Could not read file '{filepath}'")


def get_file_type(filepath: Path) -> str | None:
    """Determine file type (simulated/real) from header 'Type' field."""
    try:
        lines = _read_with_encoding_fallback(filepath)
    except (IOError, UnicodeDecodeError):
        return None

    for line in lines[:40]:
        cleaned = line.strip().strip('"')
        if ":" not in cleaned:
            continue
        key, value = cleaned.split(":", 1)
        if key.strip() != "Type":
            continue
        value = value.strip().strip('"').lower()
        if "simulacion" in value:
            return "simulated"
        if "real" in value:
            return "real"
    return None


def _find_data_start(lines: list[str]) -> int:
    """Find the line index where data starts (after 'Tiempo [BJDS],Flujo' header)."""
    for i, line in enumerate(lines):
        cleaned = line.strip().strip('"')
        if "Tiempo [BJDS],Flujo" in cleaned or "Tiempo [BJDS]\tFlujo" in cleaned:
            return i + 1
    return -1


def _parse_header(
    lines: list[str],
    filepath: Path,
    param_mapping: dict[str, tuple[str, Callable]],
    defaults: dict[str, float | int],
    extract_first_token: bool = False,
) -> TransitParams:
    """Parse header parameters from a data file.

    Args:
        lines: File lines to parse.
        filepath: Path to file (for error messages).
        param_mapping: Dict mapping header patterns to (param_name, converter).
        defaults: Default values to apply after parsing.
        extract_first_token: If True, extract first whitespace-separated token
            before converting (used for real data with units).
    """
    params: TransitParams = {}

    for line in lines:
        cleaned = line.strip().strip('"')
        if "Tiempo [BJDS]" in cleaned:
            break
        if ":" not in cleaned:
            continue

        key, value_str = cleaned.split(":", 1)
        key = key.strip()
        value_str = value_str.strip().strip('"')

        match = _find_matching_param(key, param_mapping)
        if match is None:
            continue

        param_name, converter = match
        try:
            if converter == str:
                params[param_name] = value_str
            else:
                raw = value_str.split()[0] if extract_first_token else value_str
                params[param_name] = converter(raw)
        except (ValueError, IndexError):
            warnings.warn(f"Could not convert '{key}': '{value_str}' in '{filepath}'")

    for key, value in defaults.items():
        params.setdefault(key, value)

    return params


def _find_matching_param(
    key: str, param_mapping: dict[str, tuple[str, Callable]]
) -> tuple[str, Callable] | None:
    """Find a parameter mapping using substring matching."""
    for pattern, value in param_mapping.items():
        if pattern in key:
            return value
    return None


def load_light_curve(filepath: Path) -> tuple[np.ndarray, np.ndarray, TransitParams, str]:
    """Load light curve data from a CSV file.

    Args:
        filepath: Path to the CSV file.

    Returns:
        Tuple of (time_array, flux_array, parameters_dict, data_type).
        data_type is either "simulated" or "real".

    Raises:
        ValueError: If the file format is invalid.
        IOError: If the file cannot be read.
    """
    filepath = Path(filepath)
    lines = _read_with_encoding_fallback(filepath)

    data_start = _find_data_start(lines)
    if data_start == -1:
        raise ValueError(f"No data header ('Tiempo [BJDS],Flujo') found in '{filepath}'")

    file_type = get_file_type(filepath)
    if file_type == "simulated":
        params = _parse_header(lines, filepath, _SIMULATED_PARAMS, _SIMULATED_DEFAULTS)
    else:
        params = _parse_header(
            lines, filepath, _REAL_PARAMS, _REAL_DEFAULTS, extract_first_token=True
        )
        file_type = "real"

    try:
        df = pd.read_csv(
            filepath,
            sep=",",
            skiprows=data_start,
            names=["Tiempo [BJDS]", "Flujo"],
            encoding="utf-8",
            comment="#",
            skipinitialspace=True,
        )
        time = df["Tiempo [BJDS]"].to_numpy()
        flux = df["Flujo"].to_numpy()
    except Exception as e:
        raise ValueError(f"Error loading data from '{filepath}': {e}") from e

    return time, flux, params, file_type
