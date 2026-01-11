package models

import (
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"strings"
	"sync"
)

type Transit struct {
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

var (
	transitCache     map[string][]Transit // keyed by filename
	transitCacheLock sync.RWMutex
)

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

	transitCacheLock.Lock()
	defer transitCacheLock.Unlock()

	transitCache = make(map[string][]Transit)

	// Skip header row
	for _, record := range records[1:] {
		if len(record) < 14 {
			continue
		}

		transit := Transit{
			File:     record[0],
			PlotFile: record[13],
		}

		if idx, err := strconv.Atoi(record[1]); err == nil {
			transit.TransitIndex = idx
		}
		if v, err := strconv.ParseFloat(record[2], 64); err == nil {
			transit.T0Expected = v
		}
		if v, err := strconv.ParseFloat(record[3], 64); err == nil && record[3] != "" {
			transit.T0Fitted = &v
		}
		if v, err := strconv.ParseFloat(record[4], 64); err == nil && record[4] != "" {
			transit.TTVMinutes = &v
		}
		if v, err := strconv.ParseFloat(record[5], 64); err == nil {
			transit.RpFitted = v
		}
		if v, err := strconv.ParseFloat(record[6], 64); err == nil {
			transit.AFitted = v
		}
		if v, err := strconv.ParseFloat(record[7], 64); err == nil && record[7] != "" {
			transit.RMSResiduals = &v
		}
		if v, err := strconv.ParseFloat(record[8], 64); err == nil {
			transit.Period = v
		}
		if v, err := strconv.ParseFloat(record[9], 64); err == nil && record[9] != "" {
			transit.Duration = &v
		}
		if v, err := strconv.ParseFloat(record[10], 64); err == nil {
			transit.Inc = v
		}
		if v, err := strconv.ParseFloat(record[11], 64); err == nil {
			transit.U1 = v
		}
		if v, err := strconv.ParseFloat(record[12], 64); err == nil {
			transit.U2 = v
		}

		key := strings.ToLower(transit.File)
		transitCache[key] = append(transitCache[key], transit)
	}

	return nil
}

func GetTransitsForFile(filename string) []Transit {
	transitCacheLock.RLock()
	defer transitCacheLock.RUnlock()

	key := strings.ToLower(filename)
	if transits, ok := transitCache[key]; ok {
		return transits
	}
	return nil
}

func GetTransit(filename string, index int) *Transit {
	transitCacheLock.RLock()
	defer transitCacheLock.RUnlock()

	key := strings.ToLower(filename)
	if transits, ok := transitCache[key]; ok {
		for _, t := range transits {
			if t.TransitIndex == index {
				return &t
			}
		}
	}
	return nil
}

func GetAllFiles() []string {
	transitCacheLock.RLock()
	defer transitCacheLock.RUnlock()

	files := make([]string, 0, len(transitCache))
	for file := range transitCache {
		files = append(files, file)
	}
	return files
}

func GetTransitCount(filename string) int {
	transitCacheLock.RLock()
	defer transitCacheLock.RUnlock()

	key := strings.ToLower(filename)
	if transits, ok := transitCache[key]; ok {
		return len(transits)
	}
	return 0
}
