package handlers

import (
	"emoons-web/models"
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func ListUsers(c *gin.Context) {
	users, err := models.ListUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

type CreateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Fullname string `json:"fullname" binding:"required"`
	IsAdmin  bool   `json:"is_admin"`
}

func CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := models.CreateUser(req.Username, req.Password, req.Fullname, req.IsAdmin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

type UpdateUserRequest struct {
	Fullname string `json:"fullname" binding:"required"`
	IsAdmin  bool   `json:"is_admin"`
}

func UpdateUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := models.UpdateUser(id, req.Fullname, req.IsAdmin); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated"})
}

func DeleteUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := models.DeleteUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}

func GetUserStats(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	stats, err := models.GetDetailedUserStats(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func ExportUserClassifications(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get user info for filename
	user, err := models.GetUserByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	classifications, err := models.GetUserClassificationsForExport(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get classifications"})
		return
	}

	// Set headers for CSV download
	filename := fmt.Sprintf("classifications_%s.csv", user.Username)
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write header
	header := []string{
		"curve", "transit_index",
		"transito_normal", "morfologia_anomala",
		"asimetria_izquierda", "asimetria_derecha",
		"aumento_flujo_interior", "disminucion_flujo_interior",
		"tdv_marcada",
		"t_expected_bjds", "t_observed_bjds", "ttv_minutes",
		"notas", "timestamp",
	}
	writer.Write(header)

	// Write data
	for _, c := range classifications {
		row := []string{
			c.CurveName,
			strconv.Itoa(c.TransitIndex),
			boolToStr(c.TransitoNormal),
			boolToStr(c.MorfologiaAnomala),
			boolToStr(c.AsimetriaIzquierda),
			boolToStr(c.AsimetriaDerecha),
			boolToStr(c.AumentoFlujoInterior),
			boolToStr(c.DisminucionFlujoInterior),
			boolToStr(c.TDVMarcada),
			floatPtrToStr(c.TExpectedBJDS),
			floatPtrToStr(c.TObservedBJDS),
			floatPtrToStr(c.TTVMinutes),
			c.Notas,
			c.Timestamp,
		}
		writer.Write(row)
	}
}

func boolToStr(b bool) string {
	if b {
		return "1"
	}
	return "0"
}

func floatPtrToStr(f *float64) string {
	if f == nil {
		return ""
	}
	return strconv.FormatFloat(*f, 'f', -1, 64)
}
