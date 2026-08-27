package api

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"bookapi/services"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
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
		case "application/msword":
			ext = ".doc"
		case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
			ext = ".docx"
		case "text/plain":
			ext = ".txt"
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

// DirectUpload handles multipart/form-data upload fallback (supports S3 and local storage)
func DirectUpload(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided in form-data ('file')"})
		return
	}
	defer file.Close()

	folder := strings.Trim(strings.ToLower(c.DefaultPostForm("folder", "uploads")), "/ ")
	allowedFolders := map[string]bool{
		"covers":  true,
		"notes":   true,
		"avatars": true,
		"uploads": true,
	}
	if !allowedFolders[folder] {
		folder = "uploads"
	}

	ext := filepath.Ext(header.Filename)
	uniqueID := uuid.New().String()
	filename := uniqueID + ext
	fileKey := folder + "/" + filename

	// 1. If S3 is configured, upload via server to S3
	if services.S3Client != nil {
		contentType := header.Header.Get("Content-Type")
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		_, err := services.S3Client.PutObject(c.Request.Context(), &s3.PutObjectInput{
			Bucket:      aws.String(services.S3Bucket),
			Key:         aws.String(fileKey),
			Body:        file,
			ContentType: aws.String(contentType),
		})
		if err == nil {
			publicURL := services.GetPublicURL(fileKey)
			log.Printf("☁️ Uploaded file directly to AWS S3: %s\n", publicURL)
			c.JSON(http.StatusOK, gin.H{
				"file_key":   fileKey,
				"public_url": publicURL,
				"url":        publicURL,
			})
			return
		}

		log.Printf("⚠️ AWS S3 PutObject failed: %v. Storing in local disk storage as fallback.\n", err)
	}

	// 2. Local filesystem storage fallback
	uploadDir := filepath.Join(".", "static", "uploads", folder)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Reset file pointer to beginning before writing to disk
	if seeker, ok := file.(io.Seeker); ok {
		_, _ = seeker.Seek(0, io.SeekStart)
	}

	destPath := filepath.Join(uploadDir, filename)
	out, err := os.Create(destPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write file"})
		return
	}

	// 3. Build URL for client access
	baseURL := os.Getenv("BACKEND_URL")
	if baseURL == "" {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		baseURL = "http://localhost:" + port
	}
	publicURL := fmt.Sprintf("%s/static/uploads/%s/%s", strings.TrimRight(baseURL, "/"), folder, filename)

	c.JSON(http.StatusOK, gin.H{
		"file_key":   fileKey,
		"public_url": publicURL,
		"url":        publicURL,
	})
}
