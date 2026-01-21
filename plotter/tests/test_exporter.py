"""Tests for exporter module."""

from pathlib import Path

import pandas as pd
import pytest

from transit_plotter.exporter import (
    LightCurveRecord,
    TransitRecord,
    save_light_curves_csv,
    save_summary_csv,
)

# Default values for record creation
_TRANSIT_DEFAULTS = {
    "t0_expected": 100.0,
    "t0_fitted": 100.1,
    "ttv_minutes": 1.0,
    "rp_fitted": 0.1,
    "a_fitted": 8.0,
    "rms_residuals": 0.001,
    "period": 2.0,
    "duration": 0.1,
    "inc": 90.0,
    "u1": 0.6,
    "u2": 0.2,
}

_LIGHT_CURVE_DEFAULTS = {
    "time_min": 100.0,
    "time_max": 200.0,
    "expected_transits": 2,
    "found_transits": 2,
    "data_type": "simulated",
    "period": 2.0,
    "epoch": 100.0,
    "duration": 0.1,
    "rp": 0.1,
    "a": 8.0,
    "inc": 90.0,
    "u1": 0.6,
    "u2": 0.2,
}


def make_transit_record(
    file: str = "test.csv",
    transit_index: int = 1,
    plot_file: str | None = None,
    **overrides,
) -> TransitRecord:
    """Create a TransitRecord with sensible defaults."""
    return TransitRecord(
        file=file,
        transit_index=transit_index,
        plot_file=plot_file or f"{file.replace('.csv', '')}_transit_{transit_index:03d}.png",
        **{**_TRANSIT_DEFAULTS, **overrides},
    )


def make_light_curve_record(file: str = "test.csv", **overrides) -> LightCurveRecord:
    """Create a LightCurveRecord with sensible defaults."""
    return LightCurveRecord(file=file, **{**_LIGHT_CURVE_DEFAULTS, **overrides})


class TestSaveSummaryCsv:
    def test_creates_file_with_correct_content(self, tmp_path: Path):
        output_path = tmp_path / "transits.csv"
        record = make_transit_record(period=2.36)

        save_summary_csv([record], output_path)

        assert output_path.exists()
        df = pd.read_csv(output_path)
        assert len(df) == 1
        assert df.iloc[0]["file"] == "test.csv"
        assert df.iloc[0]["transit_index"] == 1
        assert df.iloc[0]["period"] == pytest.approx(2.36, rel=1e-6)

    def test_merges_different_transits(self, tmp_path: Path):
        output_path = tmp_path / "transits.csv"
        record1 = make_transit_record(transit_index=1, plot_file="t1.png")
        record2 = make_transit_record(transit_index=2, plot_file="t2.png")

        save_summary_csv([record1], output_path)
        save_summary_csv([record2], output_path)

        df = pd.read_csv(output_path)
        assert len(df) == 2

    def test_updates_existing_record_by_key(self, tmp_path: Path):
        output_path = tmp_path / "transits.csv"
        record_v1 = make_transit_record(t0_fitted=100.1, plot_file="t1.png")
        record_v2 = make_transit_record(t0_fitted=100.2, plot_file="t1.png")

        save_summary_csv([record_v1], output_path)
        save_summary_csv([record_v2], output_path)

        df = pd.read_csv(output_path)
        assert len(df) == 1
        assert df.iloc[0]["t0_fitted"] == pytest.approx(100.2, rel=1e-6)

    def test_empty_records_does_not_create_file(self, tmp_path: Path):
        output_path = tmp_path / "transits.csv"

        save_summary_csv([], output_path)

        assert not output_path.exists()


class TestSaveLightCurvesCsv:
    def test_creates_file_with_correct_content(self, tmp_path: Path):
        output_path = tmp_path / "curves.csv"
        record = make_light_curve_record(expected_transits=4, data_type="simulated")

        save_light_curves_csv([record], output_path)

        assert output_path.exists()
        df = pd.read_csv(output_path)
        assert len(df) == 1
        assert df.iloc[0]["file"] == "test.csv"
        assert df.iloc[0]["expected_transits"] == 4
        assert df.iloc[0]["data_type"] == "simulated"

    def test_merges_different_files(self, tmp_path: Path):
        output_path = tmp_path / "curves.csv"
        record1 = make_light_curve_record(file="file1.csv")
        record2 = make_light_curve_record(file="file2.csv", period=3.0, expected_transits=3)

        save_light_curves_csv([record1], output_path)
        save_light_curves_csv([record2], output_path)

        df = pd.read_csv(output_path)
        assert len(df) == 2

    def test_empty_records_does_not_create_file(self, tmp_path: Path):
        output_path = tmp_path / "curves.csv"

        save_light_curves_csv([], output_path)

        assert not output_path.exists()


class TestReferenceData:
    """Tests that verify reference data format and content."""

    TRANSIT_SUMMARY_COLUMNS = [
        "file",
        "transit_index",
        "t0_expected",
        "t0_fitted",
        "ttv_minutes",
        "rp_fitted",
        "a_fitted",
        "rms_residuals",
        "period",
        "duration",
        "inc",
        "u1",
        "u2",
        "plot_file",
    ]

    LIGHT_CURVES_COLUMNS = [
        "file",
        "time_min",
        "time_max",
        "expected_transits",
        "found_transits",
        "data_type",
        "period",
        "epoch",
        "duration",
        "rp",
        "a",
        "inc",
        "u1",
        "u2",
    ]

    @pytest.mark.parametrize(
        ("fixture_name", "expected_cols"),
        [
            ("transit_summary_csv", TRANSIT_SUMMARY_COLUMNS),
            ("light_curves_csv", LIGHT_CURVES_COLUMNS),
        ],
        ids=["transit_summary", "light_curves"],
    )
    def test_csv_column_format(self, fixture_name: str, expected_cols: list[str], request):
        csv_path: Path = request.getfixturevalue(fixture_name)
        if not csv_path.exists():
            pytest.skip(f"Reference {csv_path.name} not found")

        df = pd.read_csv(csv_path)

        assert list(df.columns) == expected_cols

    def test_corot1b_transit_data(self, transit_summary_csv: Path):
        if not transit_summary_csv.exists():
            pytest.skip("Reference transits.csv not found")

        df = pd.read_csv(transit_summary_csv)
        corot = df[df["file"] == "Corot1b.csv"]

        assert len(corot) == 4
        assert corot["period"].iloc[0] == pytest.approx(2.36, rel=1e-3)
        assert corot["rp_fitted"].iloc[0] == pytest.approx(0.1108, rel=1e-2)
