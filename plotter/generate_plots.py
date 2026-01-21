#!/usr/bin/env python
"""CLI for generating transit light curve plots from CSV data files."""

import logging
import sys
from pathlib import Path

import click

from transit_plotter.generator import generate_all


def setup_logging(verbose: bool) -> None:
    """Configure logging based on verbosity level."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(levelname)s: %(message)s",
        stream=sys.stderr,
    )


@click.command()
@click.option(
    "-i",
    "--input-dir",
    type=click.Path(exists=True, file_okay=False, path_type=Path),
    default="data",
    help="Input directory with CSV files.",
)
@click.option(
    "-o",
    "--output-dir",
    type=click.Path(file_okay=False, path_type=Path),
    default="plots",
    help="Output directory for PNG files and summary CSV.",
)
@click.option(
    "-f",
    "--file",
    "files",
    multiple=True,
    help="Process specific file(s) only. Can be specified multiple times.",
)
@click.option(
    "--dpi",
    type=int,
    default=150,
    help="Plot resolution in DPI.",
)
@click.option(
    "--skip-fitting",
    is_flag=True,
    help="Skip model fitting, plot data only.",
)
@click.option(
    "--force",
    is_flag=True,
    help="Regenerate plots even if they already exist.",
)
@click.option(
    "-v",
    "--verbose",
    is_flag=True,
    help="Enable verbose output.",
)
@click.option(
    "--dry-run",
    is_flag=True,
    help="List files to process without generating plots.",
)
def main(
    input_dir: Path,
    output_dir: Path,
    files: tuple[str, ...],
    dpi: int,
    skip_fitting: bool,
    force: bool,
    verbose: bool,
    dry_run: bool,
) -> None:
    """Generate transit light curve plots from CSV data files.

    Processes all CSV files in the input directory (or specific files if -f is used),
    generates PNG plots for each transit, and creates a summary CSV with transit data.

    Examples:

        # Process all files in data/ and output to plots/
        uv run python generate_plots.py

        # Process specific file with verbose output
        uv run python generate_plots.py -f Corot1b.csv -v

        # Dry run to see which files would be processed
        uv run python generate_plots.py --dry-run

        # Custom directories and DPI
        uv run python generate_plots.py -i my_data -o my_plots --dpi 300
    """
    setup_logging(verbose)
    logger = logging.getLogger(__name__)

    if dry_run:
        click.echo(f"Files that would be processed from {input_dir}:")

    file_list = list(files) if files else None

    records = generate_all(
        data_dir=input_dir,
        output_dir=output_dir,
        files=file_list,
        dpi=dpi,
        skip_fitting=skip_fitting,
        dry_run=dry_run,
        force=force,
    )

    if not dry_run:
        click.echo(f"\nGenerated {len(records)} transit plots in {output_dir}")
        if records:
            click.echo(f"Summary saved to {output_dir / 'transits.csv'}")


if __name__ == "__main__":
    main()
