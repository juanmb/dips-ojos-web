-- Migration: Rename Spanish tables and columns to English
-- Note: Foreign key constraints are disabled during migration

PRAGMA foreign_keys = OFF;

-- 1. Usuarios → Users (no column changes needed)
ALTER TABLE Usuarios RENAME TO Users;

-- 2. CurvasDeLuz → Curves (with column renames)
CREATE TABLE Curves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT UNIQUE NOT NULL,
    filepath TEXT NOT NULL,
    time_min REAL,
    time_max REAL,
    num_expected_transits INTEGER,
    found_transits INTEGER DEFAULT 0,
    data_type TEXT,
    period_days REAL,
    epoch_bjd REAL,
    duration_days REAL,
    planet_radius REAL,
    semi_major_axis REAL,
    inclination_deg REAL,
    u1 REAL,
    u2 REAL,
    ecc REAL,
    omega_deg REAL,
    exposure_time REAL,
    supersample_factor INTEGER,
    gt_num_spots INTEGER,
    gt_min_spot_size REAL,
    gt_max_spot_size REAL,
    gt_spot_contrast REAL,
    gt_exomoon_radius REAL,
    gt_exomoon_period REAL,
    gt_exomoon_semi_major_axis REAL,
    gt_ttv_amplitude_days REAL,
    gt_ttv_period_orbits REAL,
    gt_ttv_phase_rad REAL
);

INSERT INTO Curves SELECT
    id,
    nombre_archivo,
    ruta_archivo,
    tiempo_min,
    tiempo_max,
    num_expected_transits,
    found_transits,
    tipo_datos,
    periodo_orbital_d,
    epoca_bjds,
    duracion_d,
    radio_planeta_r_star,
    semieje_a_r_star,
    inc_planeta_deg,
    u1,
    u2,
    ecc,
    w_deg,
    exp_time,
    supersample_factor,
    gt_n_manchas,
    gt_tamano_min_mancha,
    gt_tamano_max_mancha,
    gt_contraste_mancha,
    gt_radio_exoluna,
    gt_periodo_exoluna,
    gt_semieje_exoluna,
    gt_amplitud_ttv_dias,
    gt_periodo_ttv_orbitas,
    gt_fase_ttv_rad
FROM CurvasDeLuz;

DROP TABLE CurvasDeLuz;

-- 3. ClasificacionesTransitos → Classifications (with column renames)
CREATE TABLE Classifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curve_id INTEGER NOT NULL,
    transit_index INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    t_expected_bjd REAL,
    t_observed_bjd REAL,
    ttv_minutes REAL,
    left_asymmetry BOOLEAN,
    right_asymmetry BOOLEAN,
    increased_flux BOOLEAN,
    decreased_flux BOOLEAN,
    normal_transit BOOLEAN,
    anomalous_morphology BOOLEAN,
    marked_tdv BOOLEAN,
    notes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curve_id) REFERENCES Curves(id),
    FOREIGN KEY (user_id) REFERENCES Users(id),
    UNIQUE (curve_id, transit_index, user_id)
);

INSERT INTO Classifications SELECT
    id,
    curve_id,
    indice_transito,
    user_id,
    t_expected_bjds,
    t_observed_bjds,
    ttv_minutes,
    asimetria_izquierda,
    asimetria_derecha,
    aumento_flujo_interior,
    disminucion_flujo_interior,
    transito_normal,
    morfologia_anomala,
    tdv_marcada,
    notas,
    timestamp
FROM ClasificacionesTransitos;

DROP TABLE ClasificacionesTransitos;

-- 4. Transitos → Transits (columns already in English)
-- Drop old index first
DROP INDEX IF EXISTS idx_transitos_curve_id;

CREATE TABLE Transits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curve_id INTEGER NOT NULL,
    transit_index INTEGER NOT NULL,
    t0_expected REAL,
    t0_fitted REAL,
    ttv_minutes REAL,
    rp_fitted REAL,
    a_fitted REAL,
    rms_residuals REAL,
    period REAL,
    duration REAL,
    inc REAL,
    u1 REAL,
    u2 REAL,
    plot_file TEXT,
    FOREIGN KEY (curve_id) REFERENCES Curves(id),
    UNIQUE (curve_id, transit_index)
);

INSERT INTO Transits SELECT * FROM Transitos;

DROP TABLE Transitos;

-- 5. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_transits_curve_id ON Transits(curve_id);

PRAGMA foreign_keys = ON;
