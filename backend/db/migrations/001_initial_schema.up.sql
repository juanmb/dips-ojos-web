-- Users table
CREATE TABLE IF NOT EXISTS Usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    fullname TEXT NOT NULL
);

-- Light curves table
CREATE TABLE IF NOT EXISTS CurvasDeLuz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_archivo TEXT UNIQUE NOT NULL,
    ruta_archivo TEXT NOT NULL,
    tiempo_min REAL,
    tiempo_max REAL,
    num_expected_transits INTEGER,

    -- Basic scientific parameters
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

    -- Ground truth parameters
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

-- Transit classifications table
CREATE TABLE IF NOT EXISTS ClasificacionesTransitos (
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
