#!/usr/bin/env python
"""Generate Figures 4 (SSCEs) and 5 (flares) of the DIPS-OjOs I paper.

Generation runs in two steps so that plot styles can be iterated on without refitting:

    compute: fit each transit and save its data and model to CSV files (slow)
    plot:    render each figure as a single PDF from those CSV files (fast)
"""

import logging
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import click
import numpy as np
import pandas as pd

from transit_plotter.data_loader import load_light_curve
from transit_plotter.generator import fit_transit
from transit_plotter.plotter import PaperPanel, PaperStyle, find_flare_peak, plot_paper_figure
from transit_plotter.transit_model import calculate_expected_transit_times

BKJD_OFFSET = 2454833.0
INDEX_FILENAME = "index.csv"

# (planet as in the data filenames, event time in BKJD as in the figure captions)
FIGURE_4_SSCES = [
    ("Kepler468_b", 305.756),
    ("KOI00130_01", 394.671),
    ("Kepler468_b", 459.661),
    ("KOI00130_01", 497.226),
    ("Kepler468_b", 498.142),
    ("KOI00130_01", 531.418),
    ("Kepler289_c", 865.920),
    ("Kepler419_b", 893.353),
    ("Kepler411_c", 1044.013),
    ("Kepler411_c", 1051.825),
    ("Kepler411_c", 1083.166),
    ("Kepler396_c", 1156.297),
    ("Kepler468_b", 1190.816),
    ("Kepler468_b", 1229.303),
    ("Kepler468_b", 1267.693),
    ("Kepler396_b", 1323.333),  # Captioned as Kepler-396 c, but only a 396 b transit exists here
    ("Kepler396_c", 1333.349),
    ("Kepler289_c", 1369.499),
    ("Kepler539_b", 1383.969),
    ("Kepler396_c", 1421.786),
    ("Kepler289_c", 1495.264),
    ("Kepler539_b", 1509.551),
    ("Kepler396_c", 1510.285),
    ("Kepler89_d", 1518.032),
]

FIGURE_5_FLARES = [
    ("Kepler411_b", 1077.718),
    ("Kepler396_b", 1108.319),
    ("Kepler411_b", 1351.207),
    ("Kepler411_c", 1420.058),
    ("Kepler411_b", 1468.390),
    ("Kepler411_b", 1564.552),
    ("Kepler411_b", 1579.579),
]

# SSCE-like events of Table 2 of the paper: (planet as in the data filenames, center time in BKJD)
TABLE_2_SSCES = [
    ("Kepler89_d", 1518.032),
    ("Kepler289_c", 865.920),
    ("Kepler289_c", 1369.499),
    ("Kepler289_c", 1495.264),
    ("Kepler396_b", 1323.334),
    ("Kepler396_c", 1156.298),
    ("Kepler396_c", 1333.349),
    ("Kepler396_c", 1421.786),
    ("Kepler396_c", 1510.286),
    ("Kepler411_c", 1044.013),
    ("Kepler411_c", 1051.825),
    ("Kepler411_c", 1051.857),
    ("Kepler411_c", 1083.167),
    ("Kepler419_b", 893.353),
    ("Kepler468_b", 305.757),
    ("Kepler468_b", 459.662),
    ("Kepler468_b", 459.706),
    ("Kepler468_b", 498.142),
    ("Kepler468_b", 1190.816),
    ("Kepler468_b", 1229.303),
    ("Kepler468_b", 1267.694),
    ("Kepler539_b", 1383.969),
    ("Kepler539_b", 1509.552),
    ("KOI00130_01", 394.671),
    ("KOI00130_01", 497.227),
    ("KOI00130_01", 531.418),
]

# Panel time labels for transits containing more than one event, shown on a separate line
TIME_LABELS = {
    ("Kepler468_b", 459.661): "459.661 & .706",
    ("Kepler411_c", 1051.825): "1051.825 & .857",
}


@dataclass
class FigureSpec:
    name: str
    transits: list[tuple[str, float]]
    mark_flare: bool
    columns: int
    center_last_row: bool
    # Events to mark, in the panels of the same planet whose time window contains them
    events: list[tuple[str, float]] = field(default_factory=list)


FIGURES = [
    FigureSpec(
        "fig4", FIGURE_4_SSCES, mark_flare=False, columns=5, center_last_row=False, events=TABLE_2_SSCES
    ),
    FigureSpec("fig5", FIGURE_5_FLARES, mark_flare=True, columns=4, center_last_row=True),
]

logger = logging.getLogger(__name__)


def find_transit(data_dir: Path, planet: str, bkjd: float) -> tuple[Path, int]:
    """Return the data file and 1-indexed transit number whose expected center is closest to bkjd."""
    best = None
    for filepath in sorted(data_dir.glob(f"processed_data_{planet}_Segment*.csv")):
        time, _, params, _ = load_light_curve(filepath)
        t0s = calculate_expected_transit_times(time, params["Epoca_BJDS"], params["Periodo_orbital_d"])
        if len(t0s) == 0:
            continue
        idx = int(np.argmin(np.abs(t0s - BKJD_OFFSET - bkjd)))
        distance = abs(t0s[idx] - BKJD_OFFSET - bkjd)
        if best is None or distance < best[0]:
            best = (distance, filepath, idx + 1, params["Periodo_orbital_d"] / 2)
    if best is None or best[0] > best[3]:
        raise click.ClickException(f"No transit of {planet} found at BKJD {bkjd}")
    return best[1], best[2]


def compute_panel(data_dir: Path, panel_path: Path, planet: str, bkjd: float, mark_flare: bool) -> dict:
    """Fit one transit, save its data and model to panel_path, and return its index record."""
    filepath, transit_num = find_transit(data_dir, planet, bkjd)
    fit = fit_transit(filepath, transit_num)
    if fit is None or fit.model_flux is None:
        raise click.ClickException(f"Fit failed for {filepath.name} transit {transit_num}")

    flare_bkjd = None
    if mark_flare:
        flare_bkjd = find_flare_peak(fit.time, fit.flux - fit.model_flux) - BKJD_OFFSET
        logger.info(f"{planet} {bkjd}: flare peak at BKJD {flare_bkjd:.3f}")

    panel_path.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(
        {"time_bkjd": fit.time - BKJD_OFFSET, "flux": fit.flux, "model_flux": fit.model_flux}
    ).to_csv(panel_path, index=False, float_format="%.8f")
    logger.info(f"{planet} {bkjd}: {filepath.name} transit {transit_num} -> {panel_path.name}")

    return {
        "source_file": filepath.name,
        "transit_num": transit_num,
        "t0_fitted_bkjd": fit.t0_fitted - BKJD_OFFSET,
        "flare_bkjd": flare_bkjd,
    }


def planet_display_name(planet: str) -> str:
    """Convert a planet name as in the data filenames (Kepler468_b, KOI00130_01) to its usual form."""
    if match := re.fullmatch(r"Kepler(\d+)_(\w+)", planet):
        return f"Kepler-{match[1]} {match[2]}"
    if match := re.fullmatch(r"KOI0*(\d+)_(\d+)", planet):
        return f"KOI-{match[1]}.{match[2]}"
    return planet


def load_panel(data_dir: Path, record: pd.Series, events: list[tuple[str, float]]) -> PaperPanel:
    """
    Load a panel's data as hours from mid-transit and flux in ppt relative to the model baseline.

    The flare peak, if any, and the events of the panel's planet within its time window are marked.
    """
    data = pd.read_csv(data_dir / record["data_file"])
    baseline = data["model_flux"].max()
    time_bkjd = data["time_bkjd"]
    event_bkjds = [
        bkjd
        for planet, bkjd in events
        if planet == record["planet"] and time_bkjd.min() <= bkjd <= time_bkjd.max()
    ]
    if pd.notna(record["flare_bkjd"]):
        event_bkjds.append(record["flare_bkjd"])
    name = planet_display_name(record["planet"])
    if time_label := TIME_LABELS.get((record["planet"], record["bkjd"])):
        title = f"{name}\n({time_label})"
    else:
        title = f"{name} ({record['bkjd']:.3f})"
    return PaperPanel(
        title=title,
        hours=(time_bkjd.to_numpy() - record["t0_fitted_bkjd"]) * 24,
        flux_ppt=(data["flux"].to_numpy() / baseline - 1) * 1e3,
        model_ppt=(data["model_flux"].to_numpy() / baseline - 1) * 1e3,
        event_hours=[(bkjd - record["t0_fitted_bkjd"]) * 24 for bkjd in event_bkjds],
    )


@click.group()
def cli() -> None:
    """Generate the transit panels of Figures 4 and 5 of the paper."""
    logging.basicConfig(level=logging.INFO, format="%(message)s", stream=sys.stderr)
    logging.getLogger("fontTools").setLevel(logging.ERROR)


@cli.command()
@click.option(
    "-i",
    "--input-dir",
    type=click.Path(exists=True, file_okay=False, path_type=Path),
    default="../data",
    help="Input directory with the light curve CSV files.",
)
@click.option(
    "-d",
    "--data-dir",
    type=click.Path(file_okay=False, path_type=Path),
    default="../paper_figures/data",
    help="Output directory for the precomputed panel data.",
)
def compute(input_dir: Path, data_dir: Path) -> None:
    """Fit every transit of Figures 4 and 5 and save the panel data to CSV files."""
    records = []
    for spec in FIGURES:
        for position, (planet, bkjd) in enumerate(spec.transits, start=1):
            data_file = f"{spec.name}/{position:02d}_{planet}_{bkjd:.3f}.csv"
            record = compute_panel(input_dir, data_dir / data_file, planet, bkjd, spec.mark_flare)
            records.append(
                {
                    "figure": spec.name,
                    "position": position,
                    "planet": planet,
                    "bkjd": bkjd,
                    "data_file": data_file,
                    **record,
                }
            )
    pd.DataFrame(records).to_csv(data_dir / INDEX_FILENAME, index=False)


@cli.command()
@click.option(
    "-d",
    "--data-dir",
    type=click.Path(exists=True, file_okay=False, path_type=Path),
    default="../paper_figures/data",
    help="Directory with the precomputed panel data.",
)
@click.option(
    "-o",
    "--output-dir",
    type=click.Path(file_okay=False, path_type=Path),
    default="../paper_figures",
    help="Output directory for the figures.",
)
@click.option(
    "--width",
    type=float,
    default=PaperStyle.width,
    show_default=True,
    help="Printed figure width, in inches.",
)
@click.option(
    "--panel-aspect",
    type=float,
    default=PaperStyle.panel_aspect,
    show_default=True,
    help="Panel height to width ratio.",
)
@click.option(
    "--font-size",
    type=float,
    default=PaperStyle.font_size,
    show_default=True,
    help="Tick label size, in points.",
)
@click.option(
    "--title-size",
    type=float,
    default=PaperStyle.title_size,
    show_default=True,
    help="Panel title size, in points.",
)
@click.option(
    "--marker-size",
    type=float,
    default=PaperStyle.marker_size,
    show_default=True,
    help="Data point size, in points.",
)
def plot(
    data_dir: Path,
    output_dir: Path,
    width: float,
    panel_aspect: float,
    font_size: float,
    title_size: float,
    marker_size: float,
) -> None:
    """Render each figure as a single PDF from the precomputed data."""
    style = PaperStyle(
        width=width,
        panel_aspect=panel_aspect,
        font_size=font_size,
        title_size=title_size,
        marker_size=marker_size,
    )
    index = pd.read_csv(data_dir / INDEX_FILENAME)
    for spec in FIGURES:
        records = index[index["figure"] == spec.name].sort_values("position")
        panels = [load_panel(data_dir, record, spec.events) for _, record in records.iterrows()]
        output_path = output_dir / f"{spec.name}.pdf"
        plot_paper_figure(panels, output_path, style, spec.columns, spec.center_last_row)
        logger.info(f"{spec.name}: {len(panels)} panels -> {output_path}")


if __name__ == "__main__":
    cli()
