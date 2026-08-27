package api

import (
	"net/http"
	"strconv"

	"bookapi/models"
	"bookapi/services"

	"github.com/gin-gonic/gin"
)

// GetNotes returns all public notes
func GetNotes(c *gin.Context) {
	var notes []models.Note
	if err := services.DB.Where("is_public = ?", true).Preload("Uploader").Order("id DESC").Find(&notes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notes"})
		return
	}
	c.JSON(http.StatusOK, notes)
}

// GetNote fetches a single note by ID
func GetNote(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}

	var note models.Note
	if err := services.DB.Preload("Uploader").First(&note, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}
	c.JSON(http.StatusOK, note)
}

// CreateNote adds a new study material note
func CreateNote(c *gin.Context) {
	uid := c.GetString("uid")
	if uid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var newNote models.Note
	if err := c.ShouldBindJSON(&newNote); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newNote.UploadedBy = user.ID
	if err := services.DB.Create(&newNote).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create note"})
		return
	}

	services.DB.Preload("Uploader").First(&newNote, newNote.ID)
	c.JSON(http.StatusCreated, newNote)
}

// DeleteNote deletes a note if the caller is the uploader or admin
func DeleteNote(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}

	uid := c.GetString("uid")
	if uid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var note models.Note
	if err := services.DB.First(&note, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	if note.UploadedBy != user.ID && !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to delete this note"})
		return
	}

	if err := services.DB.Delete(&note).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete note"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Note deleted successfully"})
}

// MyNotes returns study material notes uploaded by the authenticated user
func MyNotes(c *gin.Context) {
	uid := c.GetString("uid")
	if uid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var userNotes []models.Note
	if err := services.DB.Where("uploaded_by = ?", user.ID).Order("id DESC").Find(&userNotes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user notes"})
		return
	}

	c.JSON(http.StatusOK, userNotes)
}


// UpdateNote allows the uploader (or admin) to update their note listing
func UpdateNote(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}

	uid := c.GetString("uid")
	if uid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var note models.Note
	if err := services.DB.First(&note, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	if note.UploadedBy != user.ID && !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to edit this note"})
		return
	}

	var req struct {
		Title       string   `json:"title"`
		Subject     string   `json:"subject"`
		Slot        string   `json:"slot"`
		Description string   `json:"description"`
		Price       *float64 `json:"price"`
		FilePath    string   `json:"file_path"`
		IsPublic    *bool    `json:"is_public"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid update payload: " + err.Error()})
		return
	}

	if req.Title != "" {
		note.Title = req.Title
	}
	if req.Subject != "" {
		note.Subject = req.Subject
	}
	if req.Slot != "" {
		note.Slot = req.Slot
	}
	if req.Description != "" {
		note.Description = req.Description
	}
	if req.Price != nil {
		note.Price = *req.Price
	}
	if req.FilePath != "" {
		note.FilePath = req.FilePath
	}
	if req.IsPublic != nil {
		note.IsPublic = *req.IsPublic
	}

	if err := services.DB.Save(&note).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update note"})
		return
	}

	services.DB.Preload("Uploader").First(&note, note.ID)
	c.JSON(http.StatusOK, note)
}

