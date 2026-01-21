-- Rollback: Restore Spanish table and column names
-- Note: Foreign key constraints are disabled during migration

PRAGMA foreign_keys = OFF;

-- 1. Users → Usuarios
ALTER TABLE Users RENAME TO Usuarios;

-- 2. Curves → CurvasDeLuz (with column name restoration)
CREATE TABLE CurvasDeLuz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_archivo TEXT UNIQUE NOT NULL,
    ruta_archivo TEXT NOT NULL,
    tiempo_min REAL,
    tiempo_max REAL,
    num_expected_transits INTEGER,
    found_transits INTEGER DEFAULT 0,
    tipo_datos TEXT,
    periodo_orbital_d REAL,
    epoca_bjds REAL,
    duracion_d REAL,
    radio_planeta_r_star REAL,
    semieje_a_r_star REAL,
    inc_planeta_deg REAL,
    u1 REAL,
    u2 REAL,
    ecc REAL,
    w_deg REAL,
    exp_time REAL,
    supersample_factor INTEGER,
    gt_n_manchas INTEGER,
    gt_tamano_min_mancha REAL,
    gt_tamano_max_mancha REAL,
    gt_contraste_mancha REAL,
    gt_radio_exoluna REAL,
    gt_periodo_exoluna REAL,
    gt_semieje_exoluna REAL,
    gt_amplitud_ttv_dias REAL,
    gt_periodo_ttv_orbitas REAL,
    gt_fase_ttv_rad REAL
);

INSERT INTO CurvasDeLuz SELECT
    id,
    filename,
    filepath,
    time_min,
    time_max,
    num_expected_transits,
    found_transits,
    data_type,
    period_days,
    epoch_bjd,
    duration_days,
    planet_radius,
    semi_major_axis,
    inclination_deg,
    u1,
    u2,
    ecc,
    omega_deg,
    exposure_time,
    supersample_factor,
    gt_num_spots,
    gt_min_spot_size,
    gt_max_spot_size,
    gt_spot_contrast,
    gt_exomoon_radius,
    gt_exomoon_period,
    gt_exomoon_semi_major_axis,
    gt_ttv_amplitude_days,
    gt_ttv_period_orbits,
    gt_ttv_phase_rad
FROM Curves;

DROP TABLE Curves;

-- 3. Classifications → ClasificacionesTransitos
CREATE TABLE ClasificacionesTransitos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curve_id INTEGER NOT NULL,
    indice_transito INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    t_expected_bjds REAL,
    t_observed_bjds REAL,
    ttv_minutes REAL,
    asimetria_izquierda BOOLEAN,
    asimetria_derecha BOOLEAN,
    aumento_flujo_interior BOOLEAN,
    disminucion_flujo_interior BOOLEAN,
    transito_normal BOOLEAN,
    morfologia_anomala BOOLEAN,
    tdv_marcada BOOLEAN,
    notas TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curve_id) REFERENCES CurvasDeLuz(id),
    FOREIGN KEY (user_id) REFERENCES Usuarios(id),
    UNIQUE (curve_id, indice_transito, user_id)
);

INSERT INTO ClasificacionesTransitos SELECT
    id,
    curve_id,
    transit_index,
    user_id,
    t_expected_bjd,
    t_observed_bjd,
    ttv_minutes,
    left_asymmetry,
    right_asymmetry,
    increased_flux,
    decreased_flux,
    normal_transit,
    anomalous_morphology,
    marked_tdv,
    notes,
    timestamp
FROM Classifications;

DROP TABLE Classifications;

-- 4. Transits → Transitos
DROP INDEX IF EXISTS idx_transits_curve_id;

CREATE TABLE Transitos (
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
    FOREIGN KEY (curve_id) REFERENCES CurvasDeLuz(id),
    UNIQUE (curve_id, transit_index)
);

INSERT INTO Transitos SELECT * FROM Transits;

DROP TABLE Transits;

-- 5. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_transitos_curve_id ON Transitos(curve_id);

PRAGMA foreign_keys = ON;
