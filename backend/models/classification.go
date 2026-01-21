package models

import (
	"database/sql"
	"emoons-web/db"
	"time"
)

type Classification struct {
	ID                       int64      `json:"id"`
	CurveID                  int64      `json:"curve_id"`
	IndiceTransito           int        `json:"indice_transito"`
	UserID                   int64      `json:"user_id"`
	TExpectedBJDS            *float64   `json:"t_expected_bjds"`
	TObservedBJDS            *float64   `json:"t_observed_bjds"`
	TTVMinutes               *float64   `json:"ttv_minutes"`
	AsimetriaIzquierda       bool       `json:"asimetria_izquierda"`
	AsimetriaDerecha         bool       `json:"asimetria_derecha"`
	AumentoFlujoInterior     bool       `json:"aumento_flujo_interior"`
	DisminucionFlujoInterior bool       `json:"disminucion_flujo_interior"`
	TransitoNormal           bool       `json:"transito_normal"`
	MorfologiaAnomala        bool       `json:"morfologia_anomala"`
	TDVMarcada               bool       `json:"tdv_marcada"`
	Notas                    string     `json:"notas"`
	Timestamp                *time.Time `json:"timestamp"`
}

type ClassificationInput struct {
	TExpectedBJDS            *float64 `json:"t_expected_bjds"`
	TObservedBJDS            *float64 `json:"t_observed_bjds"`
	TTVMinutes               *float64 `json:"ttv_minutes"`
	AsimetriaIzquierda       bool     `json:"asimetria_izquierda"`
	AsimetriaDerecha         bool     `json:"asimetria_derecha"`
	AumentoFlujoInterior     bool     `json:"aumento_flujo_interior"`
	DisminucionFlujoInterior bool     `json:"disminucion_flujo_interior"`
	TransitoNormal           bool     `json:"transito_normal"`
	MorfologiaAnomala        bool     `json:"morfologia_anomala"`
	TDVMarcada               bool     `json:"tdv_marcada"`
	Notas                    string   `json:"notas"`
}

func GetClassification(curveID int64, transitIndex int, userID int64) (*Classification, error) {
	var c Classification
	var timestamp sql.NullTime

	err := db.DB.QueryRow(`
		SELECT id, curve_id, indice_transito, user_id, t_expected_bjds, t_observed_bjds,
		       ttv_minutes, asimetria_izquierda, asimetria_derecha, aumento_flujo_interior,
		       disminucion_flujo_interior, transito_normal, morfologia_anomala, tdv_marcada,
		       notas, timestamp
		FROM ClasificacionesTransitos
		WHERE curve_id = ? AND indice_transito = ? AND user_id = ?
	`, curveID, transitIndex, userID).Scan(
		&c.ID, &c.CurveID, &c.IndiceTransito, &c.UserID, &c.TExpectedBJDS, &c.TObservedBJDS,
		&c.TTVMinutes, &c.AsimetriaIzquierda, &c.AsimetriaDerecha, &c.AumentoFlujoInterior,
		&c.DisminucionFlujoInterior, &c.TransitoNormal, &c.MorfologiaAnomala, &c.TDVMarcada,
		&c.Notas, &timestamp,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if timestamp.Valid {
		c.Timestamp = &timestamp.Time
	}

	return &c, nil
}

func SaveClassification(curveID int64, transitIndex int, userID int64, input ClassificationInput) error {
	_, err := db.DB.Exec(`
		INSERT INTO ClasificacionesTransitos (
			curve_id, indice_transito, user_id, t_expected_bjds, t_observed_bjds, ttv_minutes,
			asimetria_izquierda, asimetria_derecha, aumento_flujo_interior,
			disminucion_flujo_interior, transito_normal, morfologia_anomala, tdv_marcada, notas
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(curve_id, indice_transito, user_id) DO UPDATE SET
			t_expected_bjds = EXCLUDED.t_expected_bjds,
			t_observed_bjds = EXCLUDED.t_observed_bjds,
			ttv_minutes = EXCLUDED.ttv_minutes,
			asimetria_izquierda = EXCLUDED.asimetria_izquierda,
			asimetria_derecha = EXCLUDED.asimetria_derecha,
			aumento_flujo_interior = EXCLUDED.aumento_flujo_interior,
			disminucion_flujo_interior = EXCLUDED.disminucion_flujo_interior,
			transito_normal = EXCLUDED.transito_normal,
			morfologia_anomala = EXCLUDED.morfologia_anomala,
			tdv_marcada = EXCLUDED.tdv_marcada,
			notas = EXCLUDED.notas,
			timestamp = CURRENT_TIMESTAMP
	`, curveID, transitIndex, userID, input.TExpectedBJDS, input.TObservedBJDS, input.TTVMinutes,
		input.AsimetriaIzquierda, input.AsimetriaDerecha, input.AumentoFlujoInterior,
		input.DisminucionFlujoInterior, input.TransitoNormal, input.MorfologiaAnomala,
		input.TDVMarcada, input.Notas)

	return err
}

type UserStats struct {
	TotalClassified int `json:"total_classified"`
	CurvesCompleted int `json:"curves_completed"`
}

func GetUserStats(userID int64) (*UserStats, error) {
	var stats UserStats

	// Total classified transits
	err := db.DB.QueryRow(`
		SELECT COUNT(*) FROM ClasificacionesTransitos WHERE user_id = ?
	`, userID).Scan(&stats.TotalClassified)
	if err != nil {
		return nil, err
	}

	// Curves completed (all transits classified)
	err = db.DB.QueryRow(`
		SELECT COUNT(*) FROM CurvasDeLuz c
		WHERE c.found_transits > 0
		AND c.found_transits <= (
			SELECT COUNT(DISTINCT indice_transito)
			FROM ClasificacionesTransitos
			WHERE curve_id = c.id AND user_id = ?
		)
	`, userID).Scan(&stats.CurvesCompleted)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}

func DeleteCurveClassifications(curveID int64, userID int64) (int64, error) {
	result, err := db.DB.Exec(`
		DELETE FROM ClasificacionesTransitos
		WHERE curve_id = ? AND user_id = ?
	`, curveID, userID)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

type DetailedUserStats struct {
	TotalTransits       int    `json:"total_transits"`
	ClassifiedTransits  int    `json:"classified_transits"`
	TotalCurves         int    `json:"total_curves"`
	CurvesWithProgress  int    `json:"curves_with_progress"`
	CurvesCompleted     int    `json:"curves_completed"`
	TransitoNormal      int    `json:"transito_normal"`
	MorfologiaAnomala   int    `json:"morfologia_anomala"`
	AsimetriaIzquierda  int    `json:"asimetria_izquierda"`
	AsimetriaDerecha    int    `json:"asimetria_derecha"`
	AumentoFlujo        int    `json:"aumento_flujo"`
	DisminucionFlujo    int    `json:"disminucion_flujo"`
	TDVMarcada          int    `json:"tdv_marcada"`
	WithNotes           int    `json:"with_notes"`
	LastActivity        string `json:"last_activity,omitempty"`
}

func GetDetailedUserStats(userID int64) (*DetailedUserStats, error) {
	var stats DetailedUserStats

	// Get total transits and curves
	err := db.DB.QueryRow(`
		SELECT COUNT(*), SUM(found_transits) FROM CurvasDeLuz WHERE found_transits > 0
	`).Scan(&stats.TotalCurves, &stats.TotalTransits)
	if err != nil {
		return nil, err
	}

	// Get classification counts
	err = db.DB.QueryRow(`
		SELECT
			COUNT(*),
			SUM(CASE WHEN transito_normal THEN 1 ELSE 0 END),
			SUM(CASE WHEN morfologia_anomala THEN 1 ELSE 0 END),
			SUM(CASE WHEN asimetria_izquierda THEN 1 ELSE 0 END),
			SUM(CASE WHEN asimetria_derecha THEN 1 ELSE 0 END),
			SUM(CASE WHEN aumento_flujo_interior THEN 1 ELSE 0 END),
			SUM(CASE WHEN disminucion_flujo_interior THEN 1 ELSE 0 END),
			SUM(CASE WHEN tdv_marcada THEN 1 ELSE 0 END),
			SUM(CASE WHEN notas != '' THEN 1 ELSE 0 END),
			MAX(timestamp)
		FROM ClasificacionesTransitos WHERE user_id = ?
	`, userID).Scan(
		&stats.ClassifiedTransits,
		&stats.TransitoNormal,
		&stats.MorfologiaAnomala,
		&stats.AsimetriaIzquierda,
		&stats.AsimetriaDerecha,
		&stats.AumentoFlujo,
		&stats.DisminucionFlujo,
		&stats.TDVMarcada,
		&stats.WithNotes,
		&stats.LastActivity,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	// Curves with at least one classification
	err = db.DB.QueryRow(`
		SELECT COUNT(DISTINCT curve_id) FROM ClasificacionesTransitos WHERE user_id = ?
	`, userID).Scan(&stats.CurvesWithProgress)
	if err != nil {
		return nil, err
	}

	// Curves completed
	err = db.DB.QueryRow(`
		SELECT COUNT(*) FROM CurvasDeLuz c
		WHERE c.found_transits > 0
		AND c.found_transits <= (
			SELECT COUNT(DISTINCT indice_transito)
			FROM ClasificacionesTransitos
			WHERE curve_id = c.id AND user_id = ?
		)
	`, userID).Scan(&stats.CurvesCompleted)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}

type ClassificationExport struct {
	CurveName                string  `json:"curve_name"`
	TransitIndex             int     `json:"transit_index"`
	TransitoNormal           bool    `json:"transito_normal"`
	MorfologiaAnomala        bool    `json:"morfologia_anomala"`
	AsimetriaIzquierda       bool    `json:"asimetria_izquierda"`
	AsimetriaDerecha         bool    `json:"asimetria_derecha"`
	AumentoFlujoInterior     bool    `json:"aumento_flujo_interior"`
	DisminucionFlujoInterior bool    `json:"disminucion_flujo_interior"`
	TDVMarcada               bool    `json:"tdv_marcada"`
	TExpectedBJDS            *float64 `json:"t_expected_bjds"`
	TObservedBJDS            *float64 `json:"t_observed_bjds"`
	TTVMinutes               *float64 `json:"ttv_minutes"`
	Notas                    string  `json:"notas"`
	Timestamp                string  `json:"timestamp"`
}

func GetUserClassificationsForExport(userID int64) ([]ClassificationExport, error) {
	rows, err := db.DB.Query(`
		SELECT
			c.nombre_archivo,
			ct.indice_transito,
			ct.transito_normal,
			ct.morfologia_anomala,
			ct.asimetria_izquierda,
			ct.asimetria_derecha,
			ct.aumento_flujo_interior,
			ct.disminucion_flujo_interior,
			ct.tdv_marcada,
			ct.t_expected_bjds,
			ct.t_observed_bjds,
			ct.ttv_minutes,
			COALESCE(ct.notas, ''),
			COALESCE(ct.timestamp, '')
		FROM ClasificacionesTransitos ct
		JOIN CurvasDeLuz c ON ct.curve_id = c.id
		WHERE ct.user_id = ?
		ORDER BY c.nombre_archivo, ct.indice_transito
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var exports []ClassificationExport
	for rows.Next() {
		var e ClassificationExport
		if err := rows.Scan(
			&e.CurveName,
			&e.TransitIndex,
			&e.TransitoNormal,
			&e.MorfologiaAnomala,
			&e.AsimetriaIzquierda,
			&e.AsimetriaDerecha,
			&e.AumentoFlujoInterior,
			&e.DisminucionFlujoInterior,
			&e.TDVMarcada,
			&e.TExpectedBJDS,
			&e.TObservedBJDS,
			&e.TTVMinutes,
			&e.Notas,
			&e.Timestamp,
		); err != nil {
			return nil, err
		}
		exports = append(exports, e)
	}
	return exports, rows.Err()
}
