"""CSV export utilities for transit summary data."""

from dataclasses import dataclass, fields
from pathlib import Path
from typing import Any

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
    """Data record for a light curve file, used for CSV export."""

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


def _format_value(value: Any) -> Any:
    """Format a value for CSV export."""
    if value is None:
        return ""
    if isinstance(value, float):
        return f"{value:.10g}"
    return value


def _dataclass_to_row(record: Any) -> dict[str, Any]:
    """Convert a dataclass instance to a dictionary with formatted values."""
    return {f.name: _format_value(getattr(record, f.name)) for f in fields(record)}


def _save_records_csv(
    records: list[Any],
    output_path: Path,
    key_cols: list[str],
    read_csv_kwargs: dict[str, Any] | None = None,
) -> None:
    """
    Save dataclass records to a CSV file, merging with existing data.

    New records update existing ones based on key columns.
    Existing records not in the new batch are preserved.
    """
    if not records:
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)
    new_df = pd.DataFrame([_dataclass_to_row(r) for r in records])

    if output_path.exists():
        existing_df = pd.read_csv(output_path, **(read_csv_kwargs or {}))
        merged_df = (
            pd.concat([existing_df, new_df])
            .drop_duplicates(subset=key_cols, keep="last")
            .sort_values(key_cols)
            .reset_index(drop=True)
        )
    else:
        merged_df = new_df

    merged_df.to_csv(output_path, index=False)


def save_summary_csv(records: list[TransitRecord], output_path: Path) -> None:
    """
    Save transit records to a CSV file, merging with existing data.

    New records update existing ones based on (file, transit_index) key.
    Existing records not in the new batch are preserved.
    """
    _save_records_csv(
        records,
        output_path,
        key_cols=["file", "transit_index"],
        read_csv_kwargs={"dtype": {"transit_index": int}},
    )


def save_light_curves_csv(records: list[LightCurveRecord], output_path: Path) -> None:
    """
    Save light curve records to a CSV file, merging with existing data.

    New records update existing ones based on file key.
    Existing records not in the new batch are preserved.
    """
    _save_records_csv(records, output_path, key_cols=["file"])
