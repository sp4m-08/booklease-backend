package api

import (
	"net/http"
	"time"

	"bookapi/models"
	"bookapi/services"

	"github.com/gin-gonic/gin"
)

func GetFAQ(c *gin.Context) {
	cacheKey := "faqs:all"
	var FAQ []models.FAQ

	if services.GetCache(c.Request.Context(), cacheKey, &FAQ) {
		c.Header("X-Cache", "HIT")
		c.JSON(http.StatusOK, FAQ)
		return
	}

	if err := services.DB.Find(&FAQ).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch FAQ"})
		return
	}

	services.SetCache(c.Request.Context(), cacheKey, FAQ, 1*time.Hour)
	c.Header("X-Cache", "MISS")
	c.JSON(http.StatusOK, FAQ)
}
