"""Data loading utilities for transit light curve CSV files."""

import warnings
from pathlib import Path

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


def get_file_type(filepath: Path) -> str | None:
    """Determine file type (simulated/real) from header 'Type' field."""
    for encoding in ("utf-8", "latin-1"):
        try:
            with open(filepath, encoding=encoding) as f:
                for _ in range(40):
                    line = f.readline()
                    if not line:
                        break
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
            break
        except UnicodeDecodeError:
            continue
    return None


def _read_file_lines(filepath: Path) -> list[str]:
    """Read file lines with encoding fallback."""
    for encoding in ("utf-8", "latin-1"):
        try:
            with open(filepath, encoding=encoding) as f:
                return f.readlines()
        except UnicodeDecodeError:
            if encoding == "utf-8":
                warnings.warn(f"UTF-8 decode error in '{filepath}', trying latin-1")
                continue
            raise
    raise IOError(f"Could not read file '{filepath}'")


def _find_data_start(lines: list[str]) -> int:
    """Find the line index where data starts (after 'Tiempo [BJDS],Flujo' header)."""
    for i, line in enumerate(lines):
        cleaned = line.strip().strip('"')
        if "Tiempo [BJDS],Flujo" in cleaned or "Tiempo [BJDS]\tFlujo" in cleaned:
            return i + 1
    return -1


def _find_matching_param(key: str, param_mapping: dict) -> tuple | None:
    """Find a parameter mapping using substring matching (like app.py does)."""
    for pattern, value in param_mapping.items():
        if pattern in key:
            return value
    return None


def _parse_simulated_header(lines: list[str], filepath: Path) -> TransitParams:
    """Parse header parameters from simulated data file."""
    params: TransitParams = {}

    param_mapping = {
        "Orbit Period (days)": ("Periodo_orbital_d", float),
        "Transit Epoch (BJD)": ("Epoca_BJDS", float),
        "Calculated Transit Duration (days)": ("Duracion_d", float),
        "Star Radius (R_star/R_solar)": ("R_star_R_sol", float),
        "Planet Radius (R_planet/R_star)": ("Radio_Planeta_R_star", float),
        "Planet Semi-major Axis (a/R_star)": ("Semieje_a_R_star", float),
        "Limb Darkening Coeff (u1)": ("Coeficiente_LD_u1", float),
        "Limb Darkening Coeff (u2)": ("Coeficiente_LD_u2", float),
        "Planet Inclination (deg)": ("Inc_planeta_deg", float),
        "Orbital Eccentricity": ("ecc", float),
        "Longitude of Periastron (deg)": ("w_deg", float),
        "Exposure Time (days)": ("exp_time", float),
        "Supersample Factor": ("supersample_factor", int),
        "Noise Sigma": ("Ruido_Sigma", float),
        "Type": ("Tipo_Datos", str),
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
                params[param_name] = converter(value_str)
        except (ValueError, IndexError):
            warnings.warn(f"Could not convert '{key}': '{value_str}' in '{filepath}'")

    # Set defaults
    params.setdefault("ecc", DEFAULT_ECC)
    params.setdefault("w_deg", DEFAULT_W)

    return params


def _parse_real_header(lines: list[str], filepath: Path) -> TransitParams:
    """Parse header parameters from real data file."""
    params: TransitParams = {}

    param_mapping = {
        "Orbit Period (days)": ("Periodo_orbital_d", float),
        "Transit Duration (days)": ("Duracion_d", float),
        "Transit Epoch (BJD)": ("Epoca_BJDS", float),
        "Star Radius (R_star/R_solar)": ("R_star_R_sol", float),
        "Planet Radius (R_planet/R_star)": ("Radio_Planeta_R_star", float),
        "Semi-major Axis (a/R_star)": ("Semieje_a_R_star", float),
        "Limb Darkening Coefficient u1": ("Coeficiente_LD_u1", float),
        "Limb Darkening Coefficient u2": ("Coeficiente_LD_u2", float),
        "Orbital Inclination (deg)": ("Inc_planeta_deg", float),
        "Type": ("Tipo_Datos", str),
        "Planet Name": ("Nombre_Objeto", str),
        "Star Teff (K)": ("Teff_star", float),
        "Star logg": ("logg_star", float),
        "Orbital Eccentricity": ("ecc", float),
        "Longitude of Periastron (deg)": ("w_deg", float),
        "Exposure Time (days)": ("exp_time", float),
        "Supersample Factor": ("supersample_factor", int),
    }

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
            elif converter == int:
                params[param_name] = int(value_str.split()[0])
            else:
                params[param_name] = float(value_str.split()[0])
        except (ValueError, IndexError):
            warnings.warn(f"Could not convert '{key}': '{value_str}' in '{filepath}'")

    # Set defaults for real data
    params.setdefault("ecc", DEFAULT_ECC)
    params.setdefault("w_deg", DEFAULT_W)
    params.setdefault("exp_time", DEFAULT_EXP_TIME)
    params.setdefault("supersample_factor", DEFAULT_SUPERSAMPLE)
    params.setdefault("Coeficiente_LD_u1", DEFAULT_U1)
    params.setdefault("Coeficiente_LD_u2", DEFAULT_U2)
    params.setdefault("Inc_planeta_deg", DEFAULT_INC)

    return params


def load_light_curve(filepath: Path) -> tuple[np.ndarray, np.ndarray, TransitParams, str]:
    """
    Load light curve data from a CSV file.

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
    lines = _read_file_lines(filepath)

    data_start = _find_data_start(lines)
    if data_start == -1:
        raise ValueError(f"No data header ('Tiempo [BJDS],Flujo') found in '{filepath}'")

    file_type = get_file_type(filepath)
    if file_type == "simulated":
        params = _parse_simulated_header(lines, filepath)
    else:
        params = _parse_real_header(lines, filepath)
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
