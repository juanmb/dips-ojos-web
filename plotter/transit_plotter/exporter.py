"""CSV export utilities for transit summary data."""

from dataclasses import dataclass, fields
from pathlib import Path

import pandas as pd


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


@dataclass
class LightCurveRecord:
    """Data record for a light curve file, used for CSV export to populate CurvasDeLuz table."""

    file: str
    time_min: float
    time_max: float
    expected_transits: int
    found_transits: int
    data_type: str
    period: float
    epoch: float
    duration: float | None
    rp: float
    a: float
    inc: float
    u1: float
    u2: float


def save_summary_csv(records: list[TransitRecord], output_path: Path) -> None:
    """
    Save transit records to a CSV file, merging with existing data.

    New records update existing ones based on (file, transit_index) key.
    Existing records not in the new batch are preserved.

    Args:
        records: List of TransitRecord objects.
        output_path: Path for the output CSV file.
    """
    if not records:
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)
    field_names = [f.name for f in fields(TransitRecord)]

    new_rows = []
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
        new_rows.append(row)

    new_df = pd.DataFrame(new_rows)

    if output_path.exists():
        existing_df = pd.read_csv(output_path, dtype={"transit_index": int})
        key_cols = ["file", "transit_index"]
        merged_df = pd.concat([existing_df, new_df]).drop_duplicates(
            subset=key_cols, keep="last"
        )
        merged_df = merged_df.sort_values(key_cols).reset_index(drop=True)
    else:
        merged_df = new_df

    merged_df.to_csv(output_path, index=False)


def save_light_curves_csv(records: list[LightCurveRecord], output_path: Path) -> None:
    """
    Save light curve records to a CSV file, merging with existing data.

    New records update existing ones based on file key.
    Existing records not in the new batch are preserved.

    Args:
        records: List of LightCurveRecord objects.
        output_path: Path for the output CSV file.
    """
    if not records:
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)
    field_names = [f.name for f in fields(LightCurveRecord)]

    new_rows = []
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
        new_rows.append(row)

    new_df = pd.DataFrame(new_rows)

    if output_path.exists():
        existing_df = pd.read_csv(output_path)
        merged_df = pd.concat([existing_df, new_df]).drop_duplicates(
            subset=["file"], keep="last"
        )
        merged_df = merged_df.sort_values("file").reset_index(drop=True)
    else:
        merged_df = new_df

    merged_df.to_csv(output_path, index=False)
