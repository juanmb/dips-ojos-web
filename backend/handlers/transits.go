package handlers

import (
	"emoons-web/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetTransit(c *gin.Context) {
	filename := c.Param("file")
	indexStr := c.Param("index")

	index, err := strconv.Atoi(indexStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transit index"})
		return
	}

	transit := models.GetTransit(filename, index)
	if transit == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transit not found"})
		return
	}

	c.JSON(http.StatusOK, transit)
}

func GetTransitsByFile(c *gin.Context) {
	filename := c.Param("file")

	transits := models.GetTransitsForFile(filename)
	if transits == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No transits found for file"})
		return
	}

	c.JSON(http.StatusOK, transits)
}
