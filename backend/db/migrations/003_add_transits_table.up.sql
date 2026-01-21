-- Add found_transits column to CurvasDeLuz
ALTER TABLE CurvasDeLuz ADD COLUMN found_transits INTEGER DEFAULT 0;

-- Transits table (populated from transit_summary.csv at startup)
CREATE TABLE IF NOT EXISTS Transitos (
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

CREATE INDEX IF NOT EXISTS idx_transitos_curve_id ON Transitos(curve_id);
