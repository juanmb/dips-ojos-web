package models

import (
	"database/sql"
	"emoons-web/db"
)

type Curve struct {
	ID                  int64    `json:"id"`
	Filename            string   `json:"filename"`
	TimeMin             *float64 `json:"time_min"`
	TimeMax             *float64 `json:"time_max"`
	NumExpectedTransits *int     `json:"num_expected_transits"`
	FoundTransits       int      `json:"found_transits"`
	DataType            *string  `json:"data_type"`
	PeriodDays          *float64 `json:"period_days"`
	EpochBJD            *float64 `json:"epoch_bjd"`
	DurationDays        *float64 `json:"duration_days"`
	PlanetRadius        *float64 `json:"planet_radius"`
	SemiMajorAxis       *float64 `json:"semi_major_axis"`
	InclinationDeg      *float64 `json:"inclination_deg"`
	U1                  *float64 `json:"u1"`
	U2                  *float64 `json:"u2"`
}

type CurveWithProgress struct {
	Curve
	ClassifiedCount int `json:"classified_count"`
}

func GetAllCurves() ([]Curve, error) {
	rows, err := db.DB.Query(`
		SELECT id, filename, time_min, time_max,
		       num_expected_transits, found_transits, data_type, period_days, epoch_bjd,
		       duration_days, planet_radius, semi_major_axis, inclination_deg, u1, u2
		FROM Curves
		ORDER BY filename
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var curves []Curve
	for rows.Next() {
		var c Curve
		err := rows.Scan(
			&c.ID, &c.Filename, &c.TimeMin, &c.TimeMax,
			&c.NumExpectedTransits, &c.FoundTransits, &c.DataType, &c.PeriodDays, &c.EpochBJD,
			&c.DurationDays, &c.PlanetRadius, &c.SemiMajorAxis, &c.InclinationDeg, &c.U1, &c.U2,
		)
		if err != nil {
			return nil, err
		}
		curves = append(curves, c)
	}
	return curves, nil
}

func GetCurvesWithProgress(userID int64) ([]CurveWithProgress, error) {
	rows, err := db.DB.Query(`
		SELECT c.id, c.filename, c.time_min, c.time_max,
		       c.num_expected_transits, c.found_transits, c.data_type, c.period_days, c.epoch_bjd,
		       c.duration_days, c.planet_radius, c.semi_major_axis, c.inclination_deg, c.u1, c.u2,
		       COALESCE((SELECT COUNT(DISTINCT transit_index) FROM Classifications
		                 WHERE curve_id = c.id AND user_id = ?), 0) as classified_count
		FROM Curves c
		ORDER BY c.filename
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var curves []CurveWithProgress
	for rows.Next() {
		var c CurveWithProgress
		err := rows.Scan(
			&c.ID, &c.Filename, &c.TimeMin, &c.TimeMax,
			&c.NumExpectedTransits, &c.FoundTransits, &c.DataType, &c.PeriodDays, &c.EpochBJD,
			&c.DurationDays, &c.PlanetRadius, &c.SemiMajorAxis, &c.InclinationDeg, &c.U1, &c.U2,
			&c.ClassifiedCount,
		)
		if err != nil {
			return nil, err
		}
		curves = append(curves, c)
	}
	return curves, nil
}

func GetCurveByID(id int64) (*Curve, error) {
	var c Curve
	err := db.DB.QueryRow(`
		SELECT id, filename, time_min, time_max,
		       num_expected_transits, found_transits, data_type, period_days, epoch_bjd,
		       duration_days, planet_radius, semi_major_axis, inclination_deg, u1, u2
		FROM Curves WHERE id = ?
	`, id).Scan(
		&c.ID, &c.Filename, &c.TimeMin, &c.TimeMax,
		&c.NumExpectedTransits, &c.FoundTransits, &c.DataType, &c.PeriodDays, &c.EpochBJD,
		&c.DurationDays, &c.PlanetRadius, &c.SemiMajorAxis, &c.InclinationDeg, &c.U1, &c.U2,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func GetCurveByFilename(filename string) (*Curve, error) {
	var c Curve
	err := db.DB.QueryRow(`
		SELECT id, filename, time_min, time_max,
		       num_expected_transits, found_transits, data_type, period_days, epoch_bjd,
		       duration_days, planet_radius, semi_major_axis, inclination_deg, u1, u2
		FROM Curves WHERE filename = ?
	`, filename).Scan(
		&c.ID, &c.Filename, &c.TimeMin, &c.TimeMax,
		&c.NumExpectedTransits, &c.FoundTransits, &c.DataType, &c.PeriodDays, &c.EpochBJD,
		&c.DurationDays, &c.PlanetRadius, &c.SemiMajorAxis, &c.InclinationDeg, &c.U1, &c.U2,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}
