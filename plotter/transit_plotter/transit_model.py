"""Transit model fitting using Batman package."""

import warnings
from typing import Any

import batman as bm
import numpy as np
import pandas as pd
from scipy.optimize import curve_fit, minimize

from transit_plotter.types import (
    DEFAULT_ECC,
    DEFAULT_EXP_TIME,
    DEFAULT_INC,
    DEFAULT_SUPERSAMPLE,
    DEFAULT_U1,
    DEFAULT_U2,
    DEFAULT_W,
    FittedTransit,
    TransitParams,
)


def batman_model(
    time: np.ndarray,
    t0: float,
    period: float,
    rp: float,
    a: float,
    inc: float,
    u1: float,
    u2: float,
    ecc: float,
    w: float,
    exp_time: float,
    supersample_factor: int,
) -> np.ndarray:
    """
    Generate a transit light curve model using Batman.

    Args:
        time: Time array in BJDS.
        t0: Transit center time.
        period: Orbital period in days.
        rp: Planet radius ratio (Rp/R*).
        a: Semi-major axis ratio (a/R*).
        inc: Orbital inclination in degrees.
        u1, u2: Quadratic limb darkening coefficients.
        ecc: Orbital eccentricity.
        w: Argument of periastron in degrees.
        exp_time: Exposure time in days.
        supersample_factor: Supersampling factor for exposure time integration.

    Returns:
        Model flux array.
    """
    params = bm.TransitParams()
    params.t0 = t0
    params.per = period
    params.rp = rp
    params.a = a
    params.inc = inc
    params.ecc = ecc
    params.w = w
    params.limb_dark = "quadratic"
    params.u = [u1, u2]

    model = bm.TransitModel(params, time, exp_time=exp_time, supersample_factor=int(supersample_factor))
    return model.light_curve(params)


def calculate_expected_transit_times(
    time_data: np.ndarray, t0: float, period: float
) -> np.ndarray:
    """
    Calculate expected transit times within the data time range.

    Args:
        time_data: Time array from observations.
        t0: Reference transit epoch.
        period: Orbital period in days.

    Returns:
        Array of expected transit times.
    """
    if time_data is None or t0 is None or period is None or len(time_data) == 0:
        return np.array([])

    min_time, max_time = np.min(time_data), np.max(time_data)
    start_epoch = (min_time - t0) / period
    end_epoch = (max_time - t0) / period

    n_start = int(np.floor(start_epoch))
    n_end = int(np.ceil(end_epoch))
    epochs = np.arange(n_start, n_end + 1)

    all_expected = t0 + epochs * period
    time_step = np.mean(np.diff(time_data)) if len(time_data) > 1 else period / 100
    margin = time_step * 2

    filtered = all_expected[(all_expected >= min_time - margin) & (all_expected <= max_time + margin)]
    return np.sort(filtered)


def _get_param(params: TransitParams, key: str, default: Any) -> Any:
    """Get parameter value with default fallback."""
    return params.get(key, default)


def fit_global_parameters(
    time: np.ndarray,
    flux: np.ndarray,
    params: TransitParams,
    expected_t0s: np.ndarray,
) -> tuple[float, float]:
    """
    Fit global planet radius and semi-major axis across all transits.

    Args:
        time: Full time array.
        flux: Full flux array.
        params: Transit parameters dictionary.
        expected_t0s: Array of expected transit center times.

    Returns:
        Tuple of (fitted_rp, fitted_a).
    """
    rp_initial = _get_param(params, "Radio_Planeta_R_star", 0.1)
    a_initial = _get_param(params, "Semieje_a_R_star", 8.0)

    # Set bounds
    rp_lower = max(rp_initial * 0.85, 1e-4)
    rp_upper = min(rp_initial * 1.15, 1.0)
    a_lower = max(a_initial * 0.85, 1.0)
    a_upper = a_initial * 1.15
    bounds = [(rp_lower, rp_upper), (a_lower, a_upper)]

    # Fixed parameters for optimization
    period = _get_param(params, "Periodo_orbital_d", 2.36)
    inc = _get_param(params, "Inc_planeta_deg", DEFAULT_INC)
    u1 = _get_param(params, "Coeficiente_LD_u1", DEFAULT_U1)
    u2 = _get_param(params, "Coeficiente_LD_u2", DEFAULT_U2)
    ecc = _get_param(params, "ecc", DEFAULT_ECC)
    w = _get_param(params, "w_deg", DEFAULT_W)
    exp_time = _get_param(params, "exp_time", DEFAULT_EXP_TIME)
    supersample = int(_get_param(params, "supersample_factor", DEFAULT_SUPERSAMPLE))
    duration = _get_param(params, "Duracion_d", 0.2)

    def chi2_optimizer(opt_params: np.ndarray) -> float:
        rp_opt, a_opt = opt_params
        total_chi2 = 0.0

        for t_cent in expected_t0s:
            search_window = max(duration * 1.5, 0.5)
            idx = np.where(np.abs(time - t_cent) < search_window)[0]

            if len(idx) <= 5:
                continue

            transit_time = time[idx]
            transit_flux = flux[idx]

            # Find initial t0 guess using smoothed minimum
            try:
                smoothed = pd.Series(transit_flux).rolling(window=5, center=True, min_periods=1).median()
                t0_guess = transit_time[np.nanargmin(smoothed)]
            except (ValueError, IndexError):
                t0_guess = transit_time[np.argmin(transit_flux)]

            # Inner optimization for t0
            def chi2_t0(t0_arr: np.ndarray) -> float:
                model_flux = batman_model(
                    transit_time, t0_arr[0], period, rp_opt, a_opt, inc, u1, u2, ecc, w, exp_time, supersample
                )
                return float(np.sum((transit_flux - model_flux) ** 2))

            t0_margin = duration / 2.0 + 0.1
            t0_bounds = [(t_cent - t0_margin, t_cent + t0_margin)]

            try:
                result = minimize(chi2_t0, [t0_guess], method="L-BFGS-B", bounds=t0_bounds)
                if result.success:
                    t0_opt = result.x[0]
                    model_flux = batman_model(
                        transit_time, t0_opt, period, rp_opt, a_opt, inc, u1, u2, ecc, w, exp_time, supersample
                    )
                    total_chi2 += np.sum((transit_flux - model_flux) ** 2)
                else:
                    total_chi2 += 1e20
            except Exception:
                total_chi2 += 1e20

        return total_chi2

    try:
        result = minimize(
            chi2_optimizer,
            [rp_initial, a_initial],
            method="L-BFGS-B",
            bounds=bounds,
            options={"maxiter": 1000},
        )
        if result.success:
            return float(result.x[0]), float(result.x[1])
    except Exception as e:
        warnings.warn(f"Global fit failed: {e}")

    return rp_initial, a_initial


def fit_transit_t0(
    time: np.ndarray,
    flux: np.ndarray,
    params: TransitParams,
    rp: float,
    a: float,
    t0_initial: float,
) -> FittedTransit | None:
    """
    Fit the transit center time (t0) for a single transit window.

    Args:
        time: Time array for the transit window.
        flux: Flux array for the transit window.
        params: Transit parameters dictionary.
        rp: Planet radius ratio (from global fit).
        a: Semi-major axis ratio (from global fit).
        t0_initial: Initial guess for transit center.

    Returns:
        FittedTransit object or None if fitting fails.
    """
    period = _get_param(params, "Periodo_orbital_d", 2.36)
    inc = _get_param(params, "Inc_planeta_deg", DEFAULT_INC)
    u1 = _get_param(params, "Coeficiente_LD_u1", DEFAULT_U1)
    u2 = _get_param(params, "Coeficiente_LD_u2", DEFAULT_U2)
    ecc = _get_param(params, "ecc", DEFAULT_ECC)
    w = _get_param(params, "w_deg", DEFAULT_W)
    exp_time = _get_param(params, "exp_time", DEFAULT_EXP_TIME)
    supersample = int(_get_param(params, "supersample_factor", DEFAULT_SUPERSAMPLE))
    duration = _get_param(params, "Duracion_d", 0.2)
    max_ttv = _get_param(params, "Amplitud_TTV_d", 2.0)

    # Check for constant flux
    if np.all(flux == flux[0]):
        warnings.warn("Constant flux in transit window, cannot fit")
        return None

    # Search margin for t0
    t0_search_margin = (duration / 2.0) + (max_ttv * 3) + 0.02
    lower_bound = t0_initial - t0_search_margin
    upper_bound = t0_initial + t0_search_margin

    # Multiple initial guesses
    offsets = np.array([-0.0075, -0.003, 0.0, 0.003, 0.0075])
    valid_starts = [t0_initial + off for off in offsets if lower_bound <= t0_initial + off <= upper_bound]

    if not valid_starts:
        warnings.warn("No valid initial points for t0 fit")
        return None

    best_t0 = None
    min_chi2 = np.inf

    def model_func(t: np.ndarray, t0: float) -> np.ndarray:
        return batman_model(t, t0, period, rp, a, inc, u1, u2, ecc, w, exp_time, supersample)

    for start_t0 in valid_starts:
        local_lower = max(lower_bound, start_t0 - t0_search_margin / 2.0)
        local_upper = min(upper_bound, start_t0 + t0_search_margin / 2.0)

        if local_lower >= local_upper:
            continue

        try:
            popt, _ = curve_fit(
                model_func,
                time,
                flux,
                p0=[start_t0],
                bounds=([local_lower], [local_upper]),
                maxfev=10000,
                method="trf",
                ftol=1e-10,
                xtol=1e-10,
                gtol=1e-10,
            )

            fitted_t0 = popt[0]
            model_flux = model_func(time, fitted_t0)
            chi2 = np.sum((flux - model_flux) ** 2)

            if chi2 < min_chi2:
                min_chi2 = chi2
                best_t0 = fitted_t0

        except (RuntimeError, ValueError):
            continue

    if best_t0 is None:
        warnings.warn("All t0 fit attempts failed")
        return None

    return FittedTransit(
        t0=best_t0,
        rp=rp,
        a=a,
        period=period,
        inc=inc,
        u1=u1,
        u2=u2,
        ecc=ecc,
        w=w,
        exp_time=exp_time,
        supersample_factor=supersample,
    )
