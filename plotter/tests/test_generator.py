"""Tests for generator module."""

from pathlib import Path

import pandas as pd
import pytest

from transit_plotter.data_loader import load_light_curve
from transit_plotter.generator import ModelParams, generate_all, process_file


class TestModelParams:
    @pytest.mark.parametrize(
        ("param_name", "expected_value"),
        [
            ("inc", 90.0),
            ("u1", 0.6),
            ("u2", 0.2),
            ("rp", 0.1),
            ("a", 8.0),
        ],
    )
    def test_from_transit_params(
        self, sample_simulated_file: Path, param_name: str, expected_value: float
    ):
        _, _, params, _ = load_light_curve(sample_simulated_file)
        model_params = ModelParams.from_transit_params(params)

        assert getattr(model_params, param_name) == pytest.approx(expected_value, rel=1e-3)

    @pytest.mark.parametrize(
        ("param_name", "expected_default"),
        [
            ("inc", 89.0),
            ("u1", 0.65),
            ("u2", 0.08),
            ("ecc", 0.0),
            ("w", 90.0),
        ],
    )
    def test_defaults_applied(self, param_name: str, expected_default: float):
        model_params = ModelParams.from_transit_params({})

        assert getattr(model_params, param_name) == pytest.approx(expected_default, rel=1e-3)


class TestProcessFile:
    def test_returns_transit_records_and_curve(
        self, sample_simulated_file: Path, tmp_path: Path
    ):
        transit_records, curve_record = process_file(
            sample_simulated_file, tmp_path, skip_fitting=True
        )

        assert isinstance(transit_records, list)
        assert len(transit_records) > 0
        assert curve_record is not None
        assert curve_record.file == "Corot1b.csv"
        assert curve_record.expected_transits == 4
        assert curve_record.data_type == "simulated"

    def test_creates_plots(self, sample_simulated_file: Path, tmp_path: Path):
        process_file(sample_simulated_file, tmp_path, skip_fitting=True)

        plots = list(tmp_path.glob("*.png"))
        assert len(plots) > 0

    def test_skips_existing_plots(self, sample_simulated_file: Path, tmp_path: Path):
        process_file(sample_simulated_file, tmp_path, skip_fitting=True)
        records, curve = process_file(sample_simulated_file, tmp_path, skip_fitting=True)

        assert len(records) == 0
        assert curve is not None

    def test_force_regenerates_plots(self, sample_simulated_file: Path, tmp_path: Path):
        process_file(sample_simulated_file, tmp_path, skip_fitting=True)
        records, _ = process_file(
            sample_simulated_file, tmp_path, skip_fitting=True, force=True
        )

        assert len(records) > 0

    def test_invalid_file_returns_empty(self, tmp_path: Path):
        invalid_file = tmp_path / "invalid.csv"
        invalid_file.write_text("invalid content")

        transit_records, curve_record = process_file(invalid_file, tmp_path)

        assert transit_records == []
        assert curve_record is None


@pytest.fixture
def generate_all_with_file(data_dir: Path, tmp_path: Path):
    """Factory fixture to run generate_all with a specific file."""

    def _generate(filename: str = "Corot1b.csv", **kwargs):
        if not data_dir.exists():
            pytest.skip("Data directory not found")
        defaults = {"skip_fitting": True}
        defaults.update(kwargs)
        return generate_all(data_dir, tmp_path, files=[filename], **defaults)

    return _generate


class TestGenerateAll:
    def test_processes_multiple_files(self, data_dir: Path, tmp_path: Path):
        if not data_dir.exists():
            pytest.skip("Data directory not found")

        records = generate_all(
            data_dir,
            tmp_path,
            files=["Corot1b.csv", "kepler2002b.csv"],
            skip_fitting=True,
        )

        assert len(records) > 0

    @pytest.mark.parametrize(
        "expected_file",
        ["transits.csv", "curves.csv"],
    )
    def test_creates_output_csvs(
        self, generate_all_with_file, tmp_path: Path, expected_file: str
    ):
        generate_all_with_file()

        assert (tmp_path / expected_file).exists()

    def test_dry_run_creates_nothing(self, generate_all_with_file, tmp_path: Path):
        records = generate_all_with_file(dry_run=True)

        assert records == []
        assert not (tmp_path / "transits.csv").exists()

    def test_empty_directory_returns_empty(self, tmp_path: Path):
        empty_dir = tmp_path / "empty"
        empty_dir.mkdir()

        records = generate_all(empty_dir, tmp_path)

        assert records == []


class TestIntegrationWithReference:
    """Integration tests comparing against reference output."""

    @pytest.fixture
    def reference_data(
        self,
        data_dir: Path,
        tmp_path: Path,
        transit_summary_csv: Path,
        light_curves_csv: Path,
    ):
        """Generate output and load reference data for comparison."""
        if not data_dir.exists():
            pytest.skip("Data directory not found")
        if not transit_summary_csv.exists() or not light_curves_csv.exists():
            pytest.skip("Reference files not found")

        generate_all(data_dir, tmp_path, files=["Corot1b.csv"], skip_fitting=True)

        return {
            "ref_transits": pd.read_csv(transit_summary_csv),
            "ref_curves": pd.read_csv(light_curves_csv),
            "new_transits": pd.read_csv(tmp_path / "transits.csv"),
            "new_curves": pd.read_csv(tmp_path / "curves.csv"),
        }

    def _filter_corot1b(self, df: pd.DataFrame) -> pd.DataFrame:
        return df[df["file"] == "Corot1b.csv"]

    def test_transit_count_matches_reference(self, reference_data):
        ref_count = len(self._filter_corot1b(reference_data["ref_transits"]))
        new_count = len(self._filter_corot1b(reference_data["new_transits"]))

        assert new_count == ref_count

    def test_expected_transits_matches_reference(self, reference_data):
        ref_expected = self._filter_corot1b(reference_data["ref_curves"])[
            "expected_transits"
        ].iloc[0]
        new_expected = self._filter_corot1b(reference_data["new_curves"])[
            "expected_transits"
        ].iloc[0]

        assert new_expected == ref_expected

    def test_period_matches_reference(self, reference_data):
        ref_period = self._filter_corot1b(reference_data["ref_transits"])["period"].iloc[0]
        new_period = self._filter_corot1b(reference_data["new_transits"])["period"].iloc[0]

        assert new_period == pytest.approx(ref_period, rel=1e-6)
