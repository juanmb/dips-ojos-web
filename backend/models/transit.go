package models

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strconv"

	"emoons-web/db"
)

type Transit struct {
	ID           int64    `json:"id"`
	CurveID      int64    `json:"curve_id"`
	File         string   `json:"file"`
	TransitIndex int      `json:"transit_index"`
	T0Expected   float64  `json:"t0_expected"`
	T0Fitted     *float64 `json:"t0_fitted"`
	TTVMinutes   *float64 `json:"ttv_minutes"`
	RpFitted     float64  `json:"rp_fitted"`
	AFitted      float64  `json:"a_fitted"`
	RMSResiduals *float64 `json:"rms_residuals"`
	Period       float64  `json:"period"`
	Duration     *float64 `json:"duration"`
	Inc          float64  `json:"inc"`
	U1           float64  `json:"u1"`
	U2           float64  `json:"u2"`
	PlotFile     string   `json:"plot_file"`
}

func LoadTransitsFromCSV(csvPath string) error {
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

	// Clear existing transits
	_, err = db.DB.Exec("DELETE FROM Transitos")
	if err != nil {
		return fmt.Errorf("failed to clear transits table: %w", err)
	}

	// Reset found_transits counts
	_, err = db.DB.Exec("UPDATE CurvasDeLuz SET found_transits = 0")
	if err != nil {
		return fmt.Errorf("failed to reset found_transits: %w", err)
	}

	// Build map of filename -> curve_id
	curveMap := make(map[string]int64)
	rows, err := db.DB.Query("SELECT id, nombre_archivo FROM CurvasDeLuz")
	if err != nil {
		return fmt.Errorf("failed to query curves: %w", err)
	}
	for rows.Next() {
		var id int64
		var filename string
		if err := rows.Scan(&id, &filename); err != nil {
			rows.Close()
			return fmt.Errorf("failed to scan curve: %w", err)
		}
		curveMap[filename] = id
	}
	rows.Close()

	// Count transits per curve
	transitCounts := make(map[int64]int)
	inserted := 0

	// Skip header row
	for _, record := range records[1:] {
		if len(record) < 14 {
			continue
		}

		filename := record[0]
		curveID, ok := curveMap[filename]
		if !ok {
			log.Printf("Warning: no curve found for file %s", filename)
			continue
		}

		var transitIndex int
		var t0Expected, rpFitted, aFitted, period, inc, u1, u2 float64
		var t0Fitted, ttvMinutes, rmsResiduals, duration *float64

		if idx, err := strconv.Atoi(record[1]); err == nil {
			transitIndex = idx
		}
		if v, err := strconv.ParseFloat(record[2], 64); err == nil {
			t0Expected = v
		}
		if v, err := strconv.ParseFloat(record[3], 64); err == nil && record[3] != "" {
			t0Fitted = &v
		}
		if v, err := strconv.ParseFloat(record[4], 64); err == nil && record[4] != "" {
			ttvMinutes = &v
		}
		if v, err := strconv.ParseFloat(record[5], 64); err == nil {
			rpFitted = v
		}
		if v, err := strconv.ParseFloat(record[6], 64); err == nil {
			aFitted = v
		}
		if v, err := strconv.ParseFloat(record[7], 64); err == nil && record[7] != "" {
			rmsResiduals = &v
		}
		if v, err := strconv.ParseFloat(record[8], 64); err == nil {
			period = v
		}
		if v, err := strconv.ParseFloat(record[9], 64); err == nil && record[9] != "" {
			duration = &v
		}
		if v, err := strconv.ParseFloat(record[10], 64); err == nil {
			inc = v
		}
		if v, err := strconv.ParseFloat(record[11], 64); err == nil {
			u1 = v
		}
		if v, err := strconv.ParseFloat(record[12], 64); err == nil {
			u2 = v
		}
		plotFile := record[13]

		_, err = db.DB.Exec(`
			INSERT INTO Transitos (curve_id, transit_index, t0_expected, t0_fitted, ttv_minutes,
				rp_fitted, a_fitted, rms_residuals, period, duration, inc, u1, u2, plot_file)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, curveID, transitIndex, t0Expected, t0Fitted, ttvMinutes,
			rpFitted, aFitted, rmsResiduals, period, duration, inc, u1, u2, plotFile)
		if err != nil {
			log.Printf("Warning: failed to insert transit %s:%d: %v", filename, transitIndex, err)
			continue
		}

		transitCounts[curveID]++
		inserted++
	}

	// Update found_transits for each curve
	for curveID, count := range transitCounts {
		_, err = db.DB.Exec("UPDATE CurvasDeLuz SET found_transits = ? WHERE id = ?", count, curveID)
		if err != nil {
			log.Printf("Warning: failed to update found_transits for curve %d: %v", curveID, err)
		}
	}

	log.Printf("Loaded %d transits into database for %d curves", inserted, len(transitCounts))
	return nil
}

func GetTransitsForFile(filename string) []Transit {
	rows, err := db.DB.Query(`
		SELECT t.id, t.curve_id, t.transit_index, t.t0_expected, t.t0_fitted, t.ttv_minutes,
			t.rp_fitted, t.a_fitted, t.rms_residuals, t.period, t.duration, t.inc, t.u1, t.u2, t.plot_file
		FROM Transitos t
		JOIN CurvasDeLuz c ON t.curve_id = c.id
		WHERE c.nombre_archivo = ?
		ORDER BY t.transit_index
	`, filename)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var transits []Transit
	for rows.Next() {
		var t Transit
		t.File = filename
		err := rows.Scan(&t.ID, &t.CurveID, &t.TransitIndex, &t.T0Expected, &t.T0Fitted, &t.TTVMinutes,
			&t.RpFitted, &t.AFitted, &t.RMSResiduals, &t.Period, &t.Duration, &t.Inc, &t.U1, &t.U2, &t.PlotFile)
		if err != nil {
			continue
		}
		transits = append(transits, t)
	}
	return transits
}

func GetTransitsByCurveID(curveID int64) []Transit {
	rows, err := db.DB.Query(`
		SELECT t.id, t.curve_id, c.nombre_archivo, t.transit_index, t.t0_expected, t.t0_fitted, t.ttv_minutes,
			t.rp_fitted, t.a_fitted, t.rms_residuals, t.period, t.duration, t.inc, t.u1, t.u2, t.plot_file
		FROM Transitos t
		JOIN CurvasDeLuz c ON t.curve_id = c.id
		WHERE t.curve_id = ?
		ORDER BY t.transit_index
	`, curveID)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var transits []Transit
	for rows.Next() {
		var t Transit
		err := rows.Scan(&t.ID, &t.CurveID, &t.File, &t.TransitIndex, &t.T0Expected, &t.T0Fitted, &t.TTVMinutes,
			&t.RpFitted, &t.AFitted, &t.RMSResiduals, &t.Period, &t.Duration, &t.Inc, &t.U1, &t.U2, &t.PlotFile)
		if err != nil {
			continue
		}
		transits = append(transits, t)
	}
	return transits
}

func GetTransit(filename string, index int) *Transit {
	var t Transit
	t.File = filename
	err := db.DB.QueryRow(`
		SELECT t.id, t.curve_id, t.transit_index, t.t0_expected, t.t0_fitted, t.ttv_minutes,
			t.rp_fitted, t.a_fitted, t.rms_residuals, t.period, t.duration, t.inc, t.u1, t.u2, t.plot_file
		FROM Transitos t
		JOIN CurvasDeLuz c ON t.curve_id = c.id
		WHERE c.nombre_archivo = ? AND t.transit_index = ?
	`, filename, index).Scan(&t.ID, &t.CurveID, &t.TransitIndex, &t.T0Expected, &t.T0Fitted, &t.TTVMinutes,
		&t.RpFitted, &t.AFitted, &t.RMSResiduals, &t.Period, &t.Duration, &t.Inc, &t.U1, &t.U2, &t.PlotFile)
	if err != nil {
		return nil
	}
	return &t
}

func GetAllFiles() []string {
	rows, err := db.DB.Query(`
		SELECT DISTINCT c.nombre_archivo
		FROM CurvasDeLuz c
		JOIN Transitos t ON t.curve_id = c.id
	`)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var files []string
	for rows.Next() {
		var f string
		if err := rows.Scan(&f); err == nil {
			files = append(files, f)
		}
	}
	return files
}

func GetTransitCount(filename string) int {
	var count int
	err := db.DB.QueryRow(`
		SELECT COUNT(*) FROM Transitos t
		JOIN CurvasDeLuz c ON t.curve_id = c.id
		WHERE c.nombre_archivo = ?
	`, filename).Scan(&count)
	if err != nil {
		return 0
	}
	return count
}

func GetTotalTransitCount() int {
	var count int
	err := db.DB.QueryRow("SELECT COUNT(*) FROM Transitos").Scan(&count)
	if err != nil {
		return 0
	}
	return count
}
