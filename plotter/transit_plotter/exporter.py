"""CSV export utilities for transit summary data."""

import csv
from dataclasses import dataclass, fields
from pathlib import Path


@dataclass
class TransitRecord:
    """Data record for a single transit, used for CSV export."""

    file: str
    transit_index: int
    t0_expected: float
    t0_fitted: float | None
    ttv_minutes: float | None
    rp_fitted: float
    a_fitted: float
    rms_residuals: float | None
    period: float
    duration: float | None
    inc: float
    u1: float
    u2: float
    plot_file: str


def save_summary_csv(records: list[TransitRecord], output_path: Path) -> None:
    """
    Save transit records to a CSV file.

    Args:
        records: List of TransitRecord objects.
        output_path: Path for the output CSV file.
    """
    if not records:
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)
    field_names = [f.name for f in fields(TransitRecord)]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=field_names)
        writer.writeheader()

        for record in records:
            row = {}
            for field_name in field_names:
                value = getattr(record, field_name)
                if value is None:
                    row[field_name] = ""
                elif isinstance(value, float):
                    row[field_name] = f"{value:.10g}"
                else:
                    row[field_name] = value
            writer.writerow(row)
