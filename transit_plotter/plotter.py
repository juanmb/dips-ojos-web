"""Transit light curve plotting utilities."""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


def plot_transit(
    time: np.ndarray,
    flux: np.ndarray,
    model_flux: np.ndarray | None,
    t0_fitted: float | None,
    t0_expected: float,
    ttv_minutes: float | None,
    rms_residuals: float | None,
    output_path: Path,
    dpi: int = 150,
    transit_index: int | None = None,
) -> None:
    """
    Generate a transit light curve plot with residuals.

    Args:
        time: Time array for the transit window (BJDS).
        flux: Observed flux array.
        model_flux: Fitted model flux array (or None if fitting failed).
        t0_fitted: Fitted transit center time (or None).
        t0_expected: Expected transit center time.
        ttv_minutes: Transit timing variation in minutes (or None).
        rms_residuals: RMS of residuals (or None).
        output_path: Path to save the PNG file.
        dpi: Plot resolution.
        transit_index: Transit number for the title (1-indexed).
    """
    fig, (ax_main, ax_res) = plt.subplots(
        2, 1, figsize=(10, 8), sharex=True, gridspec_kw={"height_ratios": [3, 1]}
    )

    # Main transit plot
    if len(time) > 0:
        ax_main.plot(time, flux, "k.", markersize=4, label="Transit Data")

        if model_flux is not None and t0_fitted is not None:
            ax_main.plot(time, model_flux, "r-", linewidth=2, label="Fitted Model")

            # Residuals
            residuals = flux - model_flux
            ax_res.plot(time, residuals, "k.", markersize=3, label="Residuals")

            # Title with TTV
            if ttv_minutes is not None:
                title_text = f"TTV: {ttv_minutes:.3f} min"
            else:
                title_text = "Transit"
        else:
            title_text = "Fit failed"
            ax_res.set_title("Residuals (no fitted model)")
            residuals = None

        if transit_index is not None:
            title_text = f"Transit {transit_index} - {title_text}"

        ax_main.set_title(title_text)

        # Residuals reference line and formatting
        ax_res.axhline(0, color="gray", linestyle="--", linewidth=0.8)
        if residuals is not None and len(residuals) > 0:
            if rms_residuals is not None:
                ax_res.set_title(f"RMS Residuals: {rms_residuals:.4f}")
            max_abs_res = np.max(np.abs(residuals))
            ax_res.set_ylim(-max_abs_res * 1.2, max_abs_res * 1.2)
    else:
        if transit_index is not None:
            ax_main.set_title(f"Transit {transit_index} - No data")
        else:
            ax_main.set_title("No data")

    # Labels and formatting
    ax_main.set_ylabel("Normalized Flux")
    ax_main.legend()
    ax_main.grid(True)

    ax_res.set_xlabel("Time [BJDS]")
    ax_res.grid(True)

    plt.tight_layout()

    # Save and close
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=dpi, bbox_inches="tight")
    plt.close(fig)
