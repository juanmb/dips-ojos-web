"""Type definitions for transit plotter."""

from dataclasses import dataclass
from typing import TypedDict


class TransitParams(TypedDict, total=False):
    """Parameters extracted from light curve CSV headers."""

    # Orbital parameters
    Periodo_orbital_d: float
    Epoca_BJDS: float
    Inc_planeta_deg: float
    Semieje_a_R_star: float
    Radio_Planeta_R_star: float
    Duracion_d: float
    ecc: float
    w_deg: float

    # Stellar parameters
    R_star_R_sol: float
    Coeficiente_LD_u1: float
    Coeficiente_LD_u2: float
    Teff_star: float
    logg_star: float

    # Observation parameters
    exp_time: float
    supersample_factor: int
    Ruido_Sigma: float
    Tipo_Datos: str
    Nombre_Objeto: str

    # Ground truth (simulated data only)
    gt_n_manchas: int
    gt_tamano_min_mancha: float
    gt_tamano_max_mancha: float
    gt_contraste_mancha: float
    gt_radio_exoluna: float
    gt_periodo_exoluna: float
    gt_semieje_exoluna: float
    gt_amplitud_ttv_dias: float
    gt_periodo_ttv_orbitas: float
    gt_fase_ttv_rad: float

    # Fitted parameters (added after global fit)
    RP_GLOBAL: float
    A_GLOBAL: float


@dataclass
class FittedTransit:
    """Result of fitting a single transit."""

    t0: float
    rp: float
    a: float
    period: float
    inc: float
    u1: float
    u2: float
    ecc: float
    w: float
    exp_time: float
    supersample_factor: int


# Default parameter values
DEFAULT_U1 = 0.65
DEFAULT_U2 = 0.08
DEFAULT_INC = 89.0
DEFAULT_ECC = 0.0
DEFAULT_W = 90.0
DEFAULT_EXP_TIME = 0.00068113
DEFAULT_SUPERSAMPLE = 15
