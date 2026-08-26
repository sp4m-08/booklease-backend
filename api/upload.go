package api

import (
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"bookapi/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PresignedURLRequest struct {
	FileName    string `json:"file_name" binding:"required"`
	ContentType string `json:"content_type" binding:"required"`
	Folder      string `json:"folder"` // e.g., "covers", "notes"
}

type PresignedURLResponse struct {
	UploadURL        string `json:"upload_url"`
	FileKey          string `json:"file_key"`
	PublicURL        string `json:"public_url"`
	ExpiresInSeconds int    `json:"expires_in_seconds"`
}

// GetPresignedUploadURL generates a presigned URL for direct client-to-S3 upload
func GetPresignedUploadURL(c *gin.Context) {
	if services.PresignClient == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "AWS S3 storage is not configured on the server",
		})
		return
	}

	var req PresignedURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Sanitize folder name
	folder := strings.Trim(strings.ToLower(req.Folder), "/ ")
	if folder == "" {
		folder = "uploads"
	}
	allowedFolders := map[string]bool{
		"covers":  true,
		"notes":   true,
		"avatars": true,
		"uploads": true,
	}
	if !allowedFolders[folder] {
		folder = "uploads"
	}

	// 2. Generate unique S3 Key with clean extension
	ext := filepath.Ext(req.FileName)
	if ext == "" {
		switch req.ContentType {
		case "image/jpeg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/webp":
			ext = ".webp"
		case "application/pdf":
			ext = ".pdf"
		}
	}

	uniqueID := uuid.New().String()
	fileKey := folder + "/" + uniqueID + ext

	// 3. Generate Presigned PUT URL (valid for 10 minutes)
	expiration := 10 * time.Minute
	uploadURL, err := services.GeneratePresignedUploadURL(fileKey, req.ContentType, expiration)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate upload URL"})
		return
	}

	publicURL := services.GetPublicURL(fileKey)

	c.JSON(http.StatusOK, PresignedURLResponse{
		UploadURL:        uploadURL,
		FileKey:          fileKey,
		PublicURL:        publicURL,
		ExpiresInSeconds: int(expiration.Seconds()),
	})
}
