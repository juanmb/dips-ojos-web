"""Transit plot generation orchestration."""

import json
import logging
from pathlib import Path

import numpy as np
import pandas as pd

from transit_plotter.data_loader import load_light_curve
from transit_plotter.exporter import (
    LightCurveRecord,
    TransitRecord,
    save_light_curves_csv,
    save_summary_csv,
)
from transit_plotter.plotter import plot_transit
from transit_plotter.transit_model import (
    batman_model,
    calculate_expected_transit_times,
    fit_global_parameters,
    fit_transit_t0,
)
from transit_plotter.types import DEFAULT_EXP_TIME, DEFAULT_SUPERSAMPLE, TransitParams

logger = logging.getLogger(__name__)

FAILED_TRANSITS_FILE = "failed_transits.json"


def _load_failed_transits(output_dir: Path) -> dict[str, list[int]]:
    """Load the list of failed transits from JSON file."""
    failed_file = output_dir / FAILED_TRANSITS_FILE
    if failed_file.exists():
        try:
            with open(failed_file) as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def _save_failed_transits(output_dir: Path, failed: dict[str, list[int]]) -> None:
    """Save the list of failed transits to JSON file."""
    failed_file = output_dir / FAILED_TRANSITS_FILE
    with open(failed_file, "w") as f:
        json.dump(failed, f, indent=2)


def _get_param(params: TransitParams, key: str, default):
    """Get parameter value with default fallback."""
    return params.get(key, default)


def process_file(
    filepath: Path,
    output_dir: Path,
    dpi: int = 150,
    skip_fitting: bool = False,
    force: bool = False,
) -> tuple[list[TransitRecord], LightCurveRecord | None]:
    """
    Process a single light curve file and generate transit plots.

    Args:
        filepath: Path to the input CSV file.
        output_dir: Directory for output PNG files.
        dpi: Plot resolution.
        skip_fitting: If True, skip model fitting and only plot data.
        force: If True, regenerate plots even if they already exist.

    Returns:
        Tuple of (transit_records, light_curve_record).
    """
    basename = filepath.stem
    logger.info(f"Processing {filepath.name}")

    try:
        time, flux, params, data_type = load_light_curve(filepath)
    except Exception as e:
        logger.error(f"Failed to load {filepath}: {e}")
        return [], None

    # Get parameters
    period = _get_param(params, "Periodo_orbital_d", None)
    t0_epoch = _get_param(params, "Epoca_BJDS", None)
    duration = _get_param(params, "Duracion_d", 0.2)

    if period is None or t0_epoch is None:
        logger.error(f"Missing period or epoch in {filepath}")
        return [], None

    # Calculate expected transit times
    expected_t0s = calculate_expected_transit_times(time, t0_epoch, period)
    if len(expected_t0s) == 0:
        logger.warning(f"No transits found in data range for {filepath}")
        return [], None

    logger.info(f"Found {len(expected_t0s)} expected transits")

    # Load failed transits list
    all_failed = _load_failed_transits(output_dir)
    failed_for_file = set(all_failed.get(filepath.name, []))
    new_failed = []

    # Check which plots already exist or have failed previously
    missing_transits = []
    for i in range(len(expected_t0s)):
        transit_num = i + 1
        plot_filename = f"{basename}_transit_{transit_num:03d}.png"
        plot_path = output_dir / plot_filename
        if not force and plot_path.exists():
            continue
        if not force and transit_num in failed_for_file:
            logger.debug(f"Transit {transit_num}: previously failed, skipping")
            continue
        missing_transits.append(i)

    # Extract parameters (needed for LightCurveRecord even if skipping transit processing)
    exp_time = _get_param(params, "exp_time", DEFAULT_EXP_TIME)
    supersample = int(_get_param(params, "supersample_factor", DEFAULT_SUPERSAMPLE))
    inc = _get_param(params, "Inc_planeta_deg", 89.0)
    u1 = _get_param(params, "Coeficiente_LD_u1", 0.65)
    u2 = _get_param(params, "Coeficiente_LD_u2", 0.08)
    ecc = _get_param(params, "ecc", 0.0)
    w = _get_param(params, "w_deg", 90.0)
    rp_param = _get_param(params, "Radio_Planeta_R_star", 0.1)
    a_param = _get_param(params, "Semieje_a_R_star", 8.0)

    def _make_curve_record(found: int, rp: float, a: float) -> LightCurveRecord:
        return LightCurveRecord(
            file=filepath.name,
            time_min=float(time.min()),
            time_max=float(time.max()),
            expected_transits=len(expected_t0s),
            found_transits=found,
            data_type=data_type,
            period=period,
            epoch=t0_epoch,
            duration=duration,
            rp=rp,
            a=a,
            inc=inc,
            u1=u1,
            u2=u2,
        )

    if not missing_transits:
        logger.info(f"All {len(expected_t0s)} plots already exist or failed, skipping {filepath.name}")
        return [], _make_curve_record(0, rp_param, a_param)

    logger.info(f"{len(missing_transits)} of {len(expected_t0s)} plots need to be generated")

    # Global fit
    if not skip_fitting:
        logger.info("Performing global parameter fit...")
        rp_global, a_global = fit_global_parameters(time, flux, params, expected_t0s)
        logger.info(f"Global fit: rp={rp_global:.6f}, a={a_global:.6f}")
    else:
        rp_global = rp_param
        a_global = a_param

    records = []

    for i, t0_expected in enumerate(expected_t0s):
        transit_num = i + 1
        plot_filename = f"{basename}_transit_{transit_num:03d}.png"
        plot_path = output_dir / plot_filename

        # Skip if plot already exists (unless force is set)
        if not force and plot_path.exists():
            logger.debug(f"Transit {transit_num}: plot exists, skipping")
            continue

        logger.debug(f"Processing transit {transit_num}/{len(expected_t0s)}")

        # Extract transit window for search
        search_window = max(duration * 2.0, 0.5)
        search_mask = np.abs(time - t0_expected) < search_window
        transit_time_search = time[search_mask]
        transit_flux_search = flux[search_mask]

        if len(transit_time_search) < 10:
            logger.warning(f"Transit {transit_num}: insufficient data points")
            new_failed.append(transit_num)
            continue

        # Find initial t0 guess
        try:
            smoothed = pd.Series(transit_flux_search).rolling(window=5, center=True, min_periods=1).median()
            min_idx = np.nanargmin(smoothed)
            t0_initial = transit_time_search[min_idx]
        except (ValueError, IndexError):
            t0_initial = transit_time_search[np.argmin(transit_flux_search)]

        # Fit individual transit
        t0_fitted = None
        model_flux_plot = None
        ttv_minutes = None
        rms_residuals = None

        if not skip_fitting:
            fitted = fit_transit_t0(
                transit_time_search, transit_flux_search, params, rp_global, a_global, t0_initial
            )
            if fitted is not None:
                t0_fitted = fitted.t0

        # Prepare plot window
        time_center = t0_fitted if t0_fitted is not None else t0_expected
        plot_window = duration * 1.25
        plot_mask = (time >= time_center - plot_window) & (time <= time_center + plot_window)
        transit_time_plot = time[plot_mask]
        transit_flux_plot = flux[plot_mask]

        if len(transit_time_plot) == 0:
            logger.warning(f"Transit {transit_num}: no data in plot window")
            new_failed.append(transit_num)
            continue

        # Generate model for plot
        if t0_fitted is not None:
            model_flux_plot = batman_model(
                transit_time_plot,
                t0_fitted,
                period,
                rp_global,
                a_global,
                inc,
                u1,
                u2,
                ecc,
                w,
                exp_time,
                supersample,
            )
            residuals = transit_flux_plot - model_flux_plot
            rms_residuals = float(np.sqrt(np.mean(residuals**2)))
            ttv_minutes = (t0_fitted - t0_expected) * 24 * 60

        # Generate plot
        plot_transit(
            time=transit_time_plot,
            flux=transit_flux_plot,
            model_flux=model_flux_plot,
            t0_fitted=t0_fitted,
            t0_expected=t0_expected,
            ttv_minutes=ttv_minutes,
            rms_residuals=rms_residuals,
            output_path=plot_path,
            dpi=dpi,
            transit_index=transit_num,
        )

        logger.debug(f"Saved {plot_filename}")

        # Create record
        record = TransitRecord(
            file=filepath.name,
            transit_index=transit_num,
            t0_expected=t0_expected,
            t0_fitted=t0_fitted,
            ttv_minutes=ttv_minutes,
            rp_fitted=rp_global,
            a_fitted=a_global,
            rms_residuals=rms_residuals,
            period=period,
            duration=duration,
            inc=inc,
            u1=u1,
            u2=u2,
            plot_file=plot_filename,
        )
        records.append(record)

    # Update failed transits list
    if new_failed:
        all_failed[filepath.name] = sorted(set(failed_for_file) | set(new_failed))
        _save_failed_transits(output_dir, all_failed)
        logger.info(f"Marked {len(new_failed)} transits as failed for {filepath.name}")

    logger.info(f"Generated {len(records)} plots for {filepath.name}")

    return records, _make_curve_record(len(records), rp_global, a_global)


def generate_all(
    data_dir: Path,
    output_dir: Path,
    files: list[str] | None = None,
    dpi: int = 150,
    skip_fitting: bool = False,
    dry_run: bool = False,
    force: bool = False,
) -> list[TransitRecord]:
    """
    Generate transit plots for all CSV files in a directory.

    Args:
        data_dir: Directory containing input CSV files.
        output_dir: Directory for output files.
        files: Optional list of specific filenames to process.
        dpi: Plot resolution.
        skip_fitting: If True, skip model fitting.
        dry_run: If True, only list files without processing.
        force: If True, regenerate plots even if they already exist.

    Returns:
        List of all TransitRecord objects.
    """
    data_dir = Path(data_dir)
    output_dir = Path(output_dir)

    # Find CSV files
    if files:
        csv_files = [data_dir / f for f in files]
        csv_files = [f for f in csv_files if f.exists()]
    else:
        csv_files = sorted(data_dir.glob("*.csv"))

    if not csv_files:
        logger.warning(f"No CSV files found in {data_dir}")
        return []

    logger.info(f"Found {len(csv_files)} CSV files to process")

    if dry_run:
        for f in csv_files:
            print(f"  {f.name}")
        return []

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    all_transit_records = []
    all_curve_records = []
    for filepath in csv_files:
        try:
            transit_records, curve_record = process_file(
                filepath, output_dir, dpi=dpi, skip_fitting=skip_fitting, force=force
            )
            all_transit_records.extend(transit_records)
            if curve_record is not None:
                all_curve_records.append(curve_record)
        except Exception as e:
            logger.error(f"Error processing {filepath}: {e}")

    # Save transit summary CSV
    if all_transit_records:
        csv_path = output_dir / "transit_summary.csv"
        save_summary_csv(all_transit_records, csv_path)
        logger.info(f"Saved transit summary to {csv_path}")

    # Save light curves CSV
    if all_curve_records:
        csv_path = output_dir / "light_curves.csv"
        save_light_curves_csv(all_curve_records, csv_path)
        logger.info(f"Saved light curves to {csv_path}")

    return all_transit_records
