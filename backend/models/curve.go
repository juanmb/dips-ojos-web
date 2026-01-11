package models

import (
	"database/sql"
	"emoons-web/db"
)

type Curve struct {
	ID                  int64    `json:"id"`
	NombreArchivo       string   `json:"nombre_archivo"`
	RutaArchivo         string   `json:"ruta_archivo"`
	TiempoMin           *float64 `json:"tiempo_min"`
	TiempoMax           *float64 `json:"tiempo_max"`
	NumExpectedTransits *int     `json:"num_expected_transits"`
	TipoDatos           *string  `json:"tipo_datos"`
	PeriodoOrbitalD     *float64 `json:"periodo_orbital_d"`
	EpocaBJDS           *float64 `json:"epoca_bjds"`
	DuracionD           *float64 `json:"duracion_d"`
	RadioPlanetaRStar   *float64 `json:"radio_planeta_r_star"`
	SemiejeARStar       *float64 `json:"semieje_a_r_star"`
	IncPlanetaDeg       *float64 `json:"inc_planeta_deg"`
	U1                  *float64 `json:"u1"`
	U2                  *float64 `json:"u2"`
}

type CurveWithProgress struct {
	Curve
	ClassifiedCount int `json:"classified_count"`
}

func GetAllCurves() ([]Curve, error) {
	rows, err := db.DB.Query(`
		SELECT id, nombre_archivo, ruta_archivo, tiempo_min, tiempo_max,
		       num_expected_transits, tipo_datos, periodo_orbital_d, epoca_bjds,
		       duracion_d, radio_planeta_r_star, semieje_a_r_star, inc_planeta_deg, u1, u2
		FROM CurvasDeLuz
		ORDER BY nombre_archivo
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var curves []Curve
	for rows.Next() {
		var c Curve
		err := rows.Scan(
			&c.ID, &c.NombreArchivo, &c.RutaArchivo, &c.TiempoMin, &c.TiempoMax,
			&c.NumExpectedTransits, &c.TipoDatos, &c.PeriodoOrbitalD, &c.EpocaBJDS,
			&c.DuracionD, &c.RadioPlanetaRStar, &c.SemiejeARStar, &c.IncPlanetaDeg, &c.U1, &c.U2,
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
		SELECT c.id, c.nombre_archivo, c.ruta_archivo, c.tiempo_min, c.tiempo_max,
		       c.num_expected_transits, c.tipo_datos, c.periodo_orbital_d, c.epoca_bjds,
		       c.duracion_d, c.radio_planeta_r_star, c.semieje_a_r_star, c.inc_planeta_deg, c.u1, c.u2,
		       COALESCE((SELECT COUNT(DISTINCT indice_transito) FROM ClasificacionesTransitos
		                 WHERE curve_id = c.id AND user_id = ?), 0) as classified_count
		FROM CurvasDeLuz c
		ORDER BY c.nombre_archivo
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var curves []CurveWithProgress
	for rows.Next() {
		var c CurveWithProgress
		err := rows.Scan(
			&c.ID, &c.NombreArchivo, &c.RutaArchivo, &c.TiempoMin, &c.TiempoMax,
			&c.NumExpectedTransits, &c.TipoDatos, &c.PeriodoOrbitalD, &c.EpocaBJDS,
			&c.DuracionD, &c.RadioPlanetaRStar, &c.SemiejeARStar, &c.IncPlanetaDeg, &c.U1, &c.U2,
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
		SELECT id, nombre_archivo, ruta_archivo, tiempo_min, tiempo_max,
		       num_expected_transits, tipo_datos, periodo_orbital_d, epoca_bjds,
		       duracion_d, radio_planeta_r_star, semieje_a_r_star, inc_planeta_deg, u1, u2
		FROM CurvasDeLuz WHERE id = ?
	`, id).Scan(
		&c.ID, &c.NombreArchivo, &c.RutaArchivo, &c.TiempoMin, &c.TiempoMax,
		&c.NumExpectedTransits, &c.TipoDatos, &c.PeriodoOrbitalD, &c.EpocaBJDS,
		&c.DuracionD, &c.RadioPlanetaRStar, &c.SemiejeARStar, &c.IncPlanetaDeg, &c.U1, &c.U2,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func GetCurveByFilename(filename string) (*Curve, error) {
	var c Curve
	err := db.DB.QueryRow(`
		SELECT id, nombre_archivo, ruta_archivo, tiempo_min, tiempo_max,
		       num_expected_transits, tipo_datos, periodo_orbital_d, epoca_bjds,
		       duracion_d, radio_planeta_r_star, semieje_a_r_star, inc_planeta_deg, u1, u2
		FROM CurvasDeLuz WHERE nombre_archivo = ?
	`, filename).Scan(
		&c.ID, &c.NombreArchivo, &c.RutaArchivo, &c.TiempoMin, &c.TiempoMax,
		&c.NumExpectedTransits, &c.TipoDatos, &c.PeriodoOrbitalD, &c.EpocaBJDS,
		&c.DuracionD, &c.RadioPlanetaRStar, &c.SemiejeARStar, &c.IncPlanetaDeg, &c.U1, &c.U2,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}
