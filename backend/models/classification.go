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
		WHERE c.num_expected_transits > 0
		AND c.num_expected_transits <= (
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
