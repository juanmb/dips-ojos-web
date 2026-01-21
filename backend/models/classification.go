package models

import (
	"database/sql"
	"emoons-web/db"
	"time"
)

type Classification struct {
	ID                  int64      `json:"id"`
	CurveID             int64      `json:"curve_id"`
	TransitIndex        int        `json:"transit_index"`
	UserID              int64      `json:"user_id"`
	TExpectedBJD        *float64   `json:"t_expected_bjd"`
	TObservedBJD        *float64   `json:"t_observed_bjd"`
	TTVMinutes          *float64   `json:"ttv_minutes"`
	LeftAsymmetry       bool       `json:"left_asymmetry"`
	RightAsymmetry      bool       `json:"right_asymmetry"`
	IncreasedFlux       bool       `json:"increased_flux"`
	DecreasedFlux       bool       `json:"decreased_flux"`
	NormalTransit       bool       `json:"normal_transit"`
	AnomalousMorphology bool       `json:"anomalous_morphology"`
	MarkedTDV           bool       `json:"marked_tdv"`
	Notes               string     `json:"notes"`
	Timestamp           *time.Time `json:"timestamp"`
}

type ClassificationInput struct {
	TExpectedBJD        *float64 `json:"t_expected_bjd"`
	TObservedBJD        *float64 `json:"t_observed_bjd"`
	TTVMinutes          *float64 `json:"ttv_minutes"`
	LeftAsymmetry       bool     `json:"left_asymmetry"`
	RightAsymmetry      bool     `json:"right_asymmetry"`
	IncreasedFlux       bool     `json:"increased_flux"`
	DecreasedFlux       bool     `json:"decreased_flux"`
	NormalTransit       bool     `json:"normal_transit"`
	AnomalousMorphology bool     `json:"anomalous_morphology"`
	MarkedTDV           bool     `json:"marked_tdv"`
	Notes               string   `json:"notes"`
}

func GetClassification(curveID int64, transitIndex int, userID int64) (*Classification, error) {
	var c Classification
	var timestamp sql.NullTime

	err := db.DB.QueryRow(`
		SELECT id, curve_id, transit_index, user_id, t_expected_bjd, t_observed_bjd,
		       ttv_minutes, left_asymmetry, right_asymmetry, increased_flux,
		       decreased_flux, normal_transit, anomalous_morphology, marked_tdv,
		       notes, timestamp
		FROM Classifications
		WHERE curve_id = ? AND transit_index = ? AND user_id = ?
	`, curveID, transitIndex, userID).Scan(
		&c.ID, &c.CurveID, &c.TransitIndex, &c.UserID, &c.TExpectedBJD, &c.TObservedBJD,
		&c.TTVMinutes, &c.LeftAsymmetry, &c.RightAsymmetry, &c.IncreasedFlux,
		&c.DecreasedFlux, &c.NormalTransit, &c.AnomalousMorphology, &c.MarkedTDV,
		&c.Notes, &timestamp,
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
		INSERT INTO Classifications (
			curve_id, transit_index, user_id, t_expected_bjd, t_observed_bjd, ttv_minutes,
			left_asymmetry, right_asymmetry, increased_flux,
			decreased_flux, normal_transit, anomalous_morphology, marked_tdv, notes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(curve_id, transit_index, user_id) DO UPDATE SET
			t_expected_bjd = EXCLUDED.t_expected_bjd,
			t_observed_bjd = EXCLUDED.t_observed_bjd,
			ttv_minutes = EXCLUDED.ttv_minutes,
			left_asymmetry = EXCLUDED.left_asymmetry,
			right_asymmetry = EXCLUDED.right_asymmetry,
			increased_flux = EXCLUDED.increased_flux,
			decreased_flux = EXCLUDED.decreased_flux,
			normal_transit = EXCLUDED.normal_transit,
			anomalous_morphology = EXCLUDED.anomalous_morphology,
			marked_tdv = EXCLUDED.marked_tdv,
			notes = EXCLUDED.notes,
			timestamp = CURRENT_TIMESTAMP
	`, curveID, transitIndex, userID, input.TExpectedBJD, input.TObservedBJD, input.TTVMinutes,
		input.LeftAsymmetry, input.RightAsymmetry, input.IncreasedFlux,
		input.DecreasedFlux, input.NormalTransit, input.AnomalousMorphology,
		input.MarkedTDV, input.Notes)

	return err
}

type UserStats struct {
	TotalClassified int `json:"total_classified"`
	CurvesCompleted int `json:"curves_completed"`
}

func GetUserStats(userID int64) (*UserStats, error) {
	var stats UserStats

	err := db.DB.QueryRow(`
		SELECT COUNT(*) FROM Classifications WHERE user_id = ?
	`, userID).Scan(&stats.TotalClassified)
	if err != nil {
		return nil, err
	}

	err = db.DB.QueryRow(`
		SELECT COUNT(*) FROM Curves c
		WHERE c.found_transits > 0
		AND c.found_transits <= (
			SELECT COUNT(DISTINCT transit_index)
			FROM Classifications
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
		DELETE FROM Classifications
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
	NormalTransit       int    `json:"normal_transit"`
	AnomalousMorphology int    `json:"anomalous_morphology"`
	LeftAsymmetry       int    `json:"left_asymmetry"`
	RightAsymmetry      int    `json:"right_asymmetry"`
	IncreasedFlux       int    `json:"increased_flux"`
	DecreasedFlux       int    `json:"decreased_flux"`
	MarkedTDV           int    `json:"marked_tdv"`
	WithNotes           int    `json:"with_notes"`
	LastActivity        string `json:"last_activity,omitempty"`
}

func GetDetailedUserStats(userID int64) (*DetailedUserStats, error) {
	var stats DetailedUserStats

	err := db.DB.QueryRow(`
		SELECT COUNT(*), SUM(found_transits) FROM Curves WHERE found_transits > 0
	`).Scan(&stats.TotalCurves, &stats.TotalTransits)
	if err != nil {
		return nil, err
	}

	err = db.DB.QueryRow(`
		SELECT
			COUNT(*),
			SUM(CASE WHEN normal_transit THEN 1 ELSE 0 END),
			SUM(CASE WHEN anomalous_morphology THEN 1 ELSE 0 END),
			SUM(CASE WHEN left_asymmetry THEN 1 ELSE 0 END),
			SUM(CASE WHEN right_asymmetry THEN 1 ELSE 0 END),
			SUM(CASE WHEN increased_flux THEN 1 ELSE 0 END),
			SUM(CASE WHEN decreased_flux THEN 1 ELSE 0 END),
			SUM(CASE WHEN marked_tdv THEN 1 ELSE 0 END),
			SUM(CASE WHEN notes != '' THEN 1 ELSE 0 END),
			MAX(timestamp)
		FROM Classifications WHERE user_id = ?
	`, userID).Scan(
		&stats.ClassifiedTransits,
		&stats.NormalTransit,
		&stats.AnomalousMorphology,
		&stats.LeftAsymmetry,
		&stats.RightAsymmetry,
		&stats.IncreasedFlux,
		&stats.DecreasedFlux,
		&stats.MarkedTDV,
		&stats.WithNotes,
		&stats.LastActivity,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	err = db.DB.QueryRow(`
		SELECT COUNT(DISTINCT curve_id) FROM Classifications WHERE user_id = ?
	`, userID).Scan(&stats.CurvesWithProgress)
	if err != nil {
		return nil, err
	}

	err = db.DB.QueryRow(`
		SELECT COUNT(*) FROM Curves c
		WHERE c.found_transits > 0
		AND c.found_transits <= (
			SELECT COUNT(DISTINCT transit_index)
			FROM Classifications
			WHERE curve_id = c.id AND user_id = ?
		)
	`, userID).Scan(&stats.CurvesCompleted)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}

type ClassificationExport struct {
	CurveName           string   `json:"curve_name"`
	TransitIndex        int      `json:"transit_index"`
	NormalTransit       bool     `json:"normal_transit"`
	AnomalousMorphology bool     `json:"anomalous_morphology"`
	LeftAsymmetry       bool     `json:"left_asymmetry"`
	RightAsymmetry      bool     `json:"right_asymmetry"`
	IncreasedFlux       bool     `json:"increased_flux"`
	DecreasedFlux       bool     `json:"decreased_flux"`
	MarkedTDV           bool     `json:"marked_tdv"`
	TExpectedBJD        *float64 `json:"t_expected_bjd"`
	TObservedBJD        *float64 `json:"t_observed_bjd"`
	TTVMinutes          *float64 `json:"ttv_minutes"`
	Notes               string   `json:"notes"`
	Timestamp           string   `json:"timestamp"`
}

func GetUserClassificationsForExport(userID int64) ([]ClassificationExport, error) {
	rows, err := db.DB.Query(`
		SELECT
			c.filename,
			ct.transit_index,
			ct.normal_transit,
			ct.anomalous_morphology,
			ct.left_asymmetry,
			ct.right_asymmetry,
			ct.increased_flux,
			ct.decreased_flux,
			ct.marked_tdv,
			ct.t_expected_bjd,
			ct.t_observed_bjd,
			ct.ttv_minutes,
			COALESCE(ct.notes, ''),
			COALESCE(ct.timestamp, '')
		FROM Classifications ct
		JOIN Curves c ON ct.curve_id = c.id
		WHERE ct.user_id = ?
		ORDER BY c.filename, ct.transit_index
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
			&e.NormalTransit,
			&e.AnomalousMorphology,
			&e.LeftAsymmetry,
			&e.RightAsymmetry,
			&e.IncreasedFlux,
			&e.DecreasedFlux,
			&e.MarkedTDV,
			&e.TExpectedBJD,
			&e.TObservedBJD,
			&e.TTVMinutes,
			&e.Notes,
			&e.Timestamp,
		); err != nil {
			return nil, err
		}
		exports = append(exports, e)
	}
	return exports, rows.Err()
}
