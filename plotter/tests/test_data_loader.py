"""Tests for data_loader module."""

from pathlib import Path

import numpy as np
import pytest

from transit_plotter.data_loader import get_file_type, load_light_curve


class TestGetFileType:
    def test_simulated_file(self, sample_simulated_file: Path) -> None:
        assert get_file_type(sample_simulated_file) == "simulated"

    def test_nonexistent_file(self, tmp_path: Path) -> None:
        assert get_file_type(tmp_path / "nonexistent.csv") is None


class TestLoadLightCurve:
    def test_returns_valid_arrays(self, sample_simulated_file: Path) -> None:
        time, flux, params, data_type = load_light_curve(sample_simulated_file)

        assert isinstance(time, np.ndarray)
        assert isinstance(flux, np.ndarray)
        assert len(time) == len(flux) > 0
        assert data_type == "simulated"

    def test_time_in_expected_bjd_range(self, sample_simulated_file: Path) -> None:
        time, _, _, _ = load_light_curve(sample_simulated_file)

        assert 2454833.0 <= time.min()
        assert time.max() <= 2454843.0

    def test_flux_is_normalized(self, sample_simulated_file: Path) -> None:
        _, flux, _, _ = load_light_curve(sample_simulated_file)

        assert flux.mean() == pytest.approx(1.0, rel=0.01)
        assert 0.9 < flux.min() <= flux.max() < 1.1

    def test_invalid_file_raises_value_error(self, tmp_path: Path) -> None:
        invalid_file = tmp_path / "invalid.csv"
        invalid_file.write_text("invalid content")

        with pytest.raises(ValueError):
            load_light_curve(invalid_file)


REQUIRED_PARAMS = [
    "Periodo_orbital_d",
    "Epoca_BJDS",
    "Radio_Planeta_R_star",
    "Semieje_a_R_star",
    "Coeficiente_LD_u1",
    "Coeficiente_LD_u2",
]


class TestSimulatedParams:
    @pytest.fixture
    def params(self, sample_simulated_file: Path) -> dict:
        _, _, params, _ = load_light_curve(sample_simulated_file)
        return params

    @pytest.mark.parametrize("param_name", REQUIRED_PARAMS)
    def test_required_params_present(self, params: dict, param_name: str) -> None:
        assert param_name in params

    @pytest.mark.parametrize(
        ("param_name", "expected", "rel_tolerance"),
        [
            ("Periodo_orbital_d", 2.36, 1e-3),
            ("Epoca_BJDS", 2454833.59, 1e-6),
            ("Radio_Planeta_R_star", 0.1, 1e-3),
            ("Semieje_a_R_star", 8.0, 1e-3),
            ("Inc_planeta_deg", 90.0, 1e-3),
            ("Coeficiente_LD_u1", 0.6, 1e-3),
            ("Coeficiente_LD_u2", 0.2, 1e-3),
        ],
    )
    def test_corot1b_param_values(
        self, params: dict, param_name: str, expected: float, rel_tolerance: float
    ) -> None:
        assert params[param_name] == pytest.approx(expected, rel=rel_tolerance)


class TestKepler2002bParams:
    @pytest.fixture
    def params(self, sample_simulated_file_2: Path) -> dict:
        _, _, params, _ = load_light_curve(sample_simulated_file_2)
        return params

    @pytest.mark.parametrize(
        ("param_name", "expected", "rel_tolerance"),
        [
            ("Periodo_orbital_d", 20.003431, 1e-3),
            ("Radio_Planeta_R_star", 0.03522, 1e-2),
        ],
    )
    def test_kepler2002b_param_values(
        self, params: dict, param_name: str, expected: float, rel_tolerance: float
    ) -> None:
        assert params[param_name] == pytest.approx(expected, rel=rel_tolerance)

    def test_has_epoch(self, params: dict) -> None:
        assert "Epoca_BJDS" in params
