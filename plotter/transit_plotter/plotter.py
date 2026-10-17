"""Transit light curve plotting utilities."""

import math
from dataclasses import dataclass, field
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.axes import Axes
from matplotlib.ticker import MaxNLocator


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


def find_flare_peak(time: np.ndarray, residuals: np.ndarray, smoothing_points: int = 3) -> float:
    """
    Return the time of the flare peak, taken as the maximum of the smoothed residuals.

    Smoothing with a short centered moving average prevents a single outlier from
    being picked instead of the flare, which spans several consecutive points.
    """
    kernel = np.ones(smoothing_points) / smoothing_points
    smoothed = np.convolve(residuals, kernel, mode="same")
    return float(time[np.argmax(smoothed)])


@dataclass
class PaperStyle:
    """Geometry and typography of a paper figure, in inches and points at its printed size."""

    width: float = 7.0
    panel_aspect: float = 0.8
    column_gap: float = 0.28
    row_gap: float = 0.4
    left_margin: float = 0.2
    bottom_margin: float = 0.28
    top_margin: float = 0.02
    right_margin: float = 0.04
    font_size: float = 6.0
    title_size: float = 7.0
    marker_size: float = 1.2
    line_width: float = 0.8
    x_ticks: int = 3
    y_ticks: int = 3


@dataclass
class PaperPanel:
    """A transit panel of a paper figure, in hours from mid-transit and ppt relative to the baseline."""

    title: str
    hours: np.ndarray
    flux_ppt: np.ndarray
    model_ppt: np.ndarray
    event_hours: list[float] = field(default_factory=list)


# Computer Modern as in the paper, using the font bundled with matplotlib so LaTeX is not required.
# cmr10 lacks a minus sign, so tick labels are rendered with mathtext, which has one.
PAPER_RC_PARAMS = {
    "font.family": "serif",
    "font.serif": ["cmr10"],
    "mathtext.fontset": "cm",
    "axes.formatter.use_mathtext": True,
    "axes.unicode_minus": True,
    "pdf.fonttype": 42,
    "ps.fonttype": 42,
}

# Opaque equivalent of translucent red, as EPS does not support transparency
EVENT_COLOR = "#ff8080"


def _round_down_to_nice(value: float) -> float:
    """Round a positive value down to the nearest 1, 2 or 5 times a power of ten."""
    magnitude = 10 ** math.floor(math.log10(value))
    return max(step * magnitude for step in (1, 2, 5) if step * magnitude <= value)


def draw_transit_paper(ax_main: Axes, ax_res: Axes, panel: PaperPanel, style: PaperStyle) -> None:
    """Draw a transit and its residuals on two stacked axes sharing the x axis, titled below."""
    residuals = panel.flux_ppt - panel.model_ppt
    for event_hour in panel.event_hours:
        for ax in (ax_main, ax_res):
            ax.axvline(event_hour, color=EVENT_COLOR, linewidth=style.line_width * 1.5)
    ax_main.plot(panel.hours, panel.flux_ppt, "k.", markersize=style.marker_size, markeredgewidth=0)
    ax_main.plot(panel.hours, panel.model_ppt, "r-", linewidth=style.line_width)
    ax_res.plot(panel.hours, residuals, "k.", markersize=style.marker_size * 0.8, markeredgewidth=0)
    ax_res.axhline(0, color="gray", linestyle="--", linewidth=style.line_width * 0.6)
    max_abs_res = np.max(np.abs(residuals))
    ax_res.set_ylim(-max_abs_res * 1.2, max_abs_res * 1.2)

    ax_main.xaxis.set_major_locator(MaxNLocator(nbins=style.x_ticks, integer=True))
    ax_main.yaxis.set_major_locator(MaxNLocator(nbins=style.y_ticks, steps=[1, 2, 5, 10]))
    residual_tick = _round_down_to_nice(max_abs_res)
    ax_res.set_yticks([-residual_tick, residual_tick])
    for ax in (ax_main, ax_res):
        ax.grid(True, linewidth=0.3)
        ax.tick_params(labelsize=style.font_size, length=2, width=0.5, pad=1.5)
        for spine in ax.spines.values():
            spine.set_linewidth(0.5)
    ax_main.tick_params(labelbottom=False)
    ax_main.set_xlim(panel.hours.min(), panel.hours.max())
    ax_res.set_xlabel(panel.title, fontsize=style.title_size, labelpad=2)


@plt.rc_context(PAPER_RC_PARAMS)
def plot_paper_figure(
    panels: list[PaperPanel],
    output_path: Path,
    style: PaperStyle,
    columns: int,
    center_last_row: bool = False,
) -> None:
    """
    Generate a paper figure tiling transit panels in a grid.

    The figure is created at its printed width, so font sizes are the actual printed sizes.
    Each panel spans two columns of an underlying grid, which allows centering an incomplete
    last row by shifting it one grid column. The format is inferred from the output_path extension.
    """
    rows = math.ceil(len(panels) / columns)
    panel_width = (
        style.width - style.left_margin - style.right_margin - (columns - 1) * style.column_gap
    ) / columns
    panel_height = panel_width * style.panel_aspect
    height = style.top_margin + style.bottom_margin + rows * panel_height + (rows - 1) * style.row_gap
    half_panel_width = (panel_width - style.column_gap) / 2

    fig = plt.figure(figsize=(style.width, height))
    grid = fig.add_gridspec(
        rows,
        2 * columns,
        left=style.left_margin / style.width,
        right=1 - style.right_margin / style.width,
        bottom=style.bottom_margin / height,
        top=1 - style.top_margin / height,
        wspace=style.column_gap / half_panel_width,
        hspace=style.row_gap / panel_height,
    )

    for index, panel in enumerate(panels):
        row, column = divmod(index, columns)
        shift = 1 if center_last_row and row == rows - 1 and len(panels) % columns else 0
        start = 2 * column + shift * (columns - len(panels) % columns)
        cell = grid[row, start : start + 2].subgridspec(2, 1, height_ratios=[3, 1], hspace=0.12)
        ax_main = fig.add_subplot(cell[0])
        ax_res = fig.add_subplot(cell[1], sharex=ax_main)
        draw_transit_paper(ax_main, ax_res, panel, style)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path)
    plt.close(fig)
