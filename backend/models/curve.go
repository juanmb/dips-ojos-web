package models

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strconv"

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

func LoadCurvesFromCSV(csvPath string) error {
	file, err := os.Open(csvPath)
	if err != nil {
		return fmt.Errorf("failed to open CSV: %w", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return fmt.Errorf("failed to read CSV: %w", err)
	}

	if len(records) < 2 {
		return fmt.Errorf("CSV has no data rows")
	}

	upserted := 0
	for _, record := range records[1:] {
		if len(record) < 14 {
			continue
		}

		filename := record[0]
		if filename == "" {
			continue
		}

		var timeMin, timeMax, period, epoch, duration, rp, a, inc, u1, u2 *float64
		var expectedTransits *int

		if v, err := strconv.ParseFloat(record[1], 64); err == nil && record[1] != "" {
			timeMin = &v
		}
		if v, err := strconv.ParseFloat(record[2], 64); err == nil && record[2] != "" {
			timeMax = &v
		}
		if v, err := strconv.Atoi(record[3]); err == nil && record[3] != "" {
			expectedTransits = &v
		}
		// record[4] is found_transits — managed by LoadTransitsFromCSV, skip here
		dataType := record[5]
		if v, err := strconv.ParseFloat(record[6], 64); err == nil && record[6] != "" {
			period = &v
		}
		if v, err := strconv.ParseFloat(record[7], 64); err == nil && record[7] != "" {
			epoch = &v
		}
		if v, err := strconv.ParseFloat(record[8], 64); err == nil && record[8] != "" {
			duration = &v
		}
		if v, err := strconv.ParseFloat(record[9], 64); err == nil && record[9] != "" {
			rp = &v
		}
		if v, err := strconv.ParseFloat(record[10], 64); err == nil && record[10] != "" {
			a = &v
		}
		if v, err := strconv.ParseFloat(record[11], 64); err == nil && record[11] != "" {
			inc = &v
		}
		if v, err := strconv.ParseFloat(record[12], 64); err == nil && record[12] != "" {
			u1 = &v
		}
		if v, err := strconv.ParseFloat(record[13], 64); err == nil && record[13] != "" {
			u2 = &v
		}

		_, err = db.DB.Exec(`
			INSERT INTO Curves (filename, time_min, time_max, num_expected_transits,
				data_type, period_days, epoch_bjd, duration_days,
				planet_radius, semi_major_axis, inclination_deg, u1, u2)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(filename) DO UPDATE SET
				time_min = EXCLUDED.time_min,
				time_max = EXCLUDED.time_max,
				num_expected_transits = EXCLUDED.num_expected_transits,
				data_type = EXCLUDED.data_type,
				period_days = EXCLUDED.period_days,
				epoch_bjd = EXCLUDED.epoch_bjd,
				duration_days = EXCLUDED.duration_days,
				planet_radius = EXCLUDED.planet_radius,
				semi_major_axis = EXCLUDED.semi_major_axis,
				inclination_deg = EXCLUDED.inclination_deg,
				u1 = EXCLUDED.u1,
				u2 = EXCLUDED.u2
		`, filename, timeMin, timeMax, expectedTransits,
			dataType, period, epoch, duration,
			rp, a, inc, u1, u2)
		if err != nil {
			log.Printf("Warning: failed to upsert curve %s: %v", filename, err)
			continue
		}
		upserted++
	}

	log.Printf("Loaded %d curves from CSV", upserted)
	return nil
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
