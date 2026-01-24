"""Transit plot generation orchestration."""

import json
import logging
from dataclasses import dataclass
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

logger = logging.getLogger(__name__)

FAILED_TRANSITS_FILE = "_failed_transits.json"


@dataclass
class ModelParams:
    """Model parameters extracted from transit params with defaults applied."""

    exp_time: float
    supersample: int
    inc: float
    u1: float
    u2: float
    ecc: float
    w: float
    rp: float
    a: float

    @classmethod
    def from_transit_params(cls, params: TransitParams) -> "ModelParams":
        return cls(
            exp_time=params.get("exp_time", DEFAULT_EXP_TIME),
            supersample=int(params.get("supersample_factor", DEFAULT_SUPERSAMPLE)),
            inc=params.get("Inc_planeta_deg", DEFAULT_INC),
            u1=params.get("Coeficiente_LD_u1", DEFAULT_U1),
            u2=params.get("Coeficiente_LD_u2", DEFAULT_U2),
            ecc=params.get("ecc", DEFAULT_ECC),
            w=params.get("w_deg", DEFAULT_W),
            rp=params.get("Radio_Planeta_R_star", 0.1),
            a=params.get("Semieje_a_R_star", 8.0),
        )


@dataclass
class TransitFitResult:
    """Result of fitting and plotting a single transit."""

    t0_fitted: float | None
    ttv_minutes: float | None
    rms_residuals: float | None


def _load_failed_transits(output_dir: Path) -> dict[str, list[int]]:
    """Load the list of failed transits from JSON file."""
    failed_file = output_dir / FAILED_TRANSITS_FILE
    if not failed_file.exists():
        return {}
    try:
        with open(failed_file) as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def _save_failed_transits(output_dir: Path, failed: dict[str, list[int]]) -> None:
    """Save the list of failed transits to JSON file."""
    failed_file = output_dir / FAILED_TRANSITS_FILE
    with open(failed_file, "w") as f:
        json.dump(failed, f, indent=2)


def _find_initial_t0(time: np.ndarray, flux: np.ndarray) -> float:
    """Find initial t0 guess using smoothed flux minimum."""
    try:
        smoothed = pd.Series(flux).rolling(window=5, center=True, min_periods=1).median()
        min_idx = np.nanargmin(smoothed)
        return time[min_idx]
    except (ValueError, IndexError):
        return time[np.argmin(flux)]


def _process_single_transit(
    time: np.ndarray,
    flux: np.ndarray,
    t0_expected: float,
    transit_num: int,
    params: TransitParams,
    model_params: ModelParams,
    rp_global: float,
    a_global: float,
    period: float,
    duration: float,
    output_path: Path,
    dpi: int,
    skip_fitting: bool,
) -> TransitFitResult | None:
    """
    Process a single transit and generate its plot.

    Returns TransitFitResult on success, None on failure.
    """
    search_window = max(duration * 2.0, 0.5)
    search_mask = np.abs(time - t0_expected) < search_window
    time_search = time[search_mask]
    flux_search = flux[search_mask]

    if len(time_search) < 10:
        logger.warning(f"Transit {transit_num}: insufficient data points")
        return None

    t0_initial = _find_initial_t0(time_search, flux_search)

    t0_fitted = None
    model_flux = None
    ttv_minutes = None
    rms_residuals = None

    if not skip_fitting:
        fitted = fit_transit_t0(time_search, flux_search, params, rp_global, a_global, t0_initial)
        if fitted is not None:
            t0_fitted = fitted.t0

    time_center = t0_fitted if t0_fitted is not None else t0_expected
    plot_window = duration * 1.25
    plot_mask = (time >= time_center - plot_window) & (time <= time_center + plot_window)
    time_plot = time[plot_mask]
    flux_plot = flux[plot_mask]

    if len(time_plot) == 0:
        logger.warning(f"Transit {transit_num}: no data in plot window")
        return None

    if t0_fitted is not None:
        model_flux = batman_model(
            time_plot,
            t0_fitted,
            period,
            rp_global,
            a_global,
            model_params.inc,
            model_params.u1,
            model_params.u2,
            model_params.ecc,
            model_params.w,
            model_params.exp_time,
            model_params.supersample,
        )
        residuals = flux_plot - model_flux
        rms_residuals = float(np.sqrt(np.mean(residuals**2)))
        ttv_minutes = (t0_fitted - t0_expected) * 24 * 60

    plot_transit(
        time=time_plot,
        flux=flux_plot,
        model_flux=model_flux,
        t0_fitted=t0_fitted,
        t0_expected=t0_expected,
        ttv_minutes=ttv_minutes,
        rms_residuals=rms_residuals,
        output_path=output_path,
        dpi=dpi,
        transit_index=transit_num,
    )

    logger.debug(f"Saved {output_path.name}")

    return TransitFitResult(
        t0_fitted=t0_fitted,
        ttv_minutes=ttv_minutes,
        rms_residuals=rms_residuals,
    )


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

    period = params.get("Periodo_orbital_d")
    t0_epoch = params.get("Epoca_BJDS")
    duration = params.get("Duracion_d", 0.2)

    if period is None or t0_epoch is None:
        logger.error(f"Missing period or epoch in {filepath}")
        return [], None

    expected_t0s = calculate_expected_transit_times(time, t0_epoch, period)
    if len(expected_t0s) == 0:
        logger.warning(f"No transits found in data range for {filepath}")
        return [], None

    logger.info(f"Found {len(expected_t0s)} expected transits")

    model_params = ModelParams.from_transit_params(params)

    def make_curve_record(found: int, rp: float, a: float) -> LightCurveRecord:
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
            inc=model_params.inc,
            u1=model_params.u1,
            u2=model_params.u2,
        )

    all_failed = _load_failed_transits(output_dir)
    failed_for_file = set(all_failed.get(filepath.name, []))

    transits_to_process = []
    skipped_failed = []
    for i, t0 in enumerate(expected_t0s):
        transit_num = i + 1
        plot_path = output_dir / f"{basename}_transit_{transit_num:03d}.png"

        if not force:
            if plot_path.exists():
                continue
            if transit_num in failed_for_file:
                logger.debug(f"Transit {transit_num}: previously failed, skipping")
                skipped_failed.append((transit_num, t0))
                continue

        transits_to_process.append((transit_num, t0, plot_path))

    if not transits_to_process and not skipped_failed:
        logger.info(f"All {len(expected_t0s)} plots already exist, skipping {filepath.name}")
        return [], make_curve_record(0, model_params.rp, model_params.a)

    if transits_to_process:
        logger.info(f"{len(transits_to_process)} of {len(expected_t0s)} plots need to be generated")

    if not transits_to_process or skip_fitting:
        rp_global = model_params.rp
        a_global = model_params.a
    else:
        logger.info("Performing global parameter fit...")
        rp_global, a_global = fit_global_parameters(time, flux, params, expected_t0s)
        logger.info(f"Global fit: rp={rp_global:.6f}, a={a_global:.6f}")

    records = []
    new_failed = []

    for transit_num, t0_expected in skipped_failed:
        records.append(
            TransitRecord(
                file=filepath.name,
                transit_index=transit_num,
                t0_expected=t0_expected,
                t0_fitted=None,
                ttv_minutes=None,
                rp_fitted=rp_global,
                a_fitted=a_global,
                rms_residuals=None,
                period=period,
                duration=duration,
                inc=model_params.inc,
                u1=model_params.u1,
                u2=model_params.u2,
            )
        )

    for transit_num, t0_expected, plot_path in transits_to_process:
        logger.debug(f"Processing transit {transit_num}/{len(expected_t0s)}")

        fit_result = _process_single_transit(
            time=time,
            flux=flux,
            t0_expected=t0_expected,
            transit_num=transit_num,
            params=params,
            model_params=model_params,
            rp_global=rp_global,
            a_global=a_global,
            period=period,
            duration=duration,
            output_path=plot_path,
            dpi=dpi,
            skip_fitting=skip_fitting,
        )

        if fit_result is None:
            new_failed.append(transit_num)
            records.append(
                TransitRecord(
                    file=filepath.name,
                    transit_index=transit_num,
                    t0_expected=t0_expected,
                    t0_fitted=None,
                    ttv_minutes=None,
                    rp_fitted=rp_global,
                    a_fitted=a_global,
                    rms_residuals=None,
                    period=period,
                    duration=duration,
                    inc=model_params.inc,
                    u1=model_params.u1,
                    u2=model_params.u2,
                )
            )
            continue

        records.append(
            TransitRecord(
                file=filepath.name,
                transit_index=transit_num,
                t0_expected=t0_expected,
                t0_fitted=fit_result.t0_fitted,
                ttv_minutes=fit_result.ttv_minutes,
                rp_fitted=rp_global,
                a_fitted=a_global,
                rms_residuals=fit_result.rms_residuals,
                period=period,
                duration=duration,
                inc=model_params.inc,
                u1=model_params.u1,
                u2=model_params.u2,
                plot_file=plot_path.name,
            )
        )

    if new_failed:
        all_failed[filepath.name] = sorted(set(failed_for_file) | set(new_failed))
        _save_failed_transits(output_dir, all_failed)
        logger.info(f"Marked {len(new_failed)} transits as failed for {filepath.name}")

    logger.info(f"Generated {len(records)} plots for {filepath.name}")

    return records, make_curve_record(len(records), rp_global, a_global)


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

    if files:
        csv_files = [f for f in (data_dir / name for name in files) if f.exists()]
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

    if all_transit_records:
        csv_path = output_dir / "transits.csv"
        save_summary_csv(all_transit_records, csv_path)
        logger.info(f"Saved transit summary to {csv_path}")

    if all_curve_records:
        csv_path = output_dir / "curves.csv"
        save_light_curves_csv(all_curve_records, csv_path)
        logger.info(f"Saved light curves to {csv_path}")

    return all_transit_records
