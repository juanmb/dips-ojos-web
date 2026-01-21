package handlers

import (
	"emoons-web/middleware"
	"emoons-web/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetCurves(c *gin.Context) {
	userID := middleware.GetUserID(c)

	curves, err := models.GetCurvesWithProgress(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get curves"})
		return
	}

	c.JSON(http.StatusOK, curves)
}

func GetCurve(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid curve ID"})
		return
	}

	curve, err := models.GetCurveByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Curve not found"})
		return
	}

	c.JSON(http.StatusOK, curve)
}

func GetCurveTransits(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid curve ID"})
		return
	}

	curve, err := models.GetCurveByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Curve not found"})
		return
	}

	transits := models.GetTransitsForFile(curve.Filename)
	if transits == nil {
		transits = []models.Transit{}
	}

	c.JSON(http.StatusOK, transits)
}
