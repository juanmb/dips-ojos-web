package handlers

import (
	"emoons-web/middleware"
	"emoons-web/models"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetClassification(c *gin.Context) {
	userID := middleware.GetUserID(c)
	filename := c.Param("file")
	indexStr := c.Param("index")

	index, err := strconv.Atoi(indexStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transit index"})
		return
	}

	// Get curve by filename to find curve_id
	curve, err := models.GetCurveByFilename(filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find curve"})
		return
	}
	if curve == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Curve not found"})
		return
	}

	// Convert from 1-indexed (CSV/UI) to 0-indexed (database)
	dbIndex := index - 1
	classification, err := models.GetClassification(curve.ID, dbIndex, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get classification"})
		return
	}

	if classification == nil {
		c.JSON(http.StatusOK, nil)
		return
	}

	c.JSON(http.StatusOK, classification)
}

func SaveClassification(c *gin.Context) {
	userID := middleware.GetUserID(c)
	filename := c.Param("file")
	indexStr := c.Param("index")

	index, err := strconv.Atoi(indexStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transit index"})
		return
	}

	var input models.ClassificationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Get curve by filename to find curve_id
	curve, err := models.GetCurveByFilename(filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find curve"})
		return
	}
	if curve == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Curve not found"})
		return
	}

	// Get transit data from CSV to fill in timing info
	transit := models.GetTransit(filename, index)
	if transit != nil {
		input.TExpectedBJD = &transit.T0Expected
		input.TObservedBJD = transit.T0Fitted
		input.TTVMinutes = transit.TTVMinutes
	}

	// Convert from 1-indexed (CSV/UI) to 0-indexed (database)
	dbIndex := index - 1
	err = models.SaveClassification(curve.ID, dbIndex, userID, input)
	if err != nil {
		log.Printf("Error saving classification: curve_id=%d, index=%d, dbIndex=%d, user_id=%d, error=%v",
			curve.ID, index, dbIndex, userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save classification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Classification saved"})
}

func GetStats(c *gin.Context) {
	userID := middleware.GetUserID(c)

	stats, err := models.GetUserStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func DeleteCurveClassifications(c *gin.Context) {
	userID := middleware.GetUserID(c)
	curveIDStr := c.Param("id")

	curveID, err := strconv.ParseInt(curveIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid curve ID"})
		return
	}

	deleted, err := models.DeleteCurveClassifications(curveID, userID)
	if err != nil {
		log.Printf("Error deleting classifications: curve_id=%d, user_id=%d, error=%v", curveID, userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete classifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted": deleted})
}
