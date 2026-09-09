package api

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"bookapi/models"
	"bookapi/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetNotes returns all public notes
func GetNotes(c *gin.Context) {
	cacheKey := "notes:public:all"
	var notes []models.Note

	// 1. Check Redis Cache for public notes list
	hit := services.GetCache(c.Request.Context(), cacheKey, &notes)
	if !hit {
		if err := services.DB.Where("is_public = ?", true).Preload("Uploader").Order("id DESC").Find(&notes).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notes"})
			return
		}
		services.SetCache(c.Request.Context(), cacheKey, notes, 60*time.Second)
		c.Header("X-Cache", "MISS")
	} else {
		c.Header("X-Cache", "HIT")
	}

	// 2. Personalize is_upvoted if user is authenticated
	uid := c.GetString("uid")
	if uid != "" {
		var user models.User
		if err := services.DB.Where("uid = ?", uid).First(&user).Error; err == nil {
			for i := range notes {
				var count int64
				services.DB.Model(&models.NoteUpvote{}).Where("user_id = ? AND note_id = ?", user.ID, notes[i].ID).Count(&count)
				notes[i].IsUpvoted = (count > 0)
			}
		}
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

	cacheKey := fmt.Sprintf("notes:id:%d", id)
	var note models.Note
	hit := services.GetCache(c.Request.Context(), cacheKey, &note)
	if !hit {
		if err := services.DB.Preload("Uploader").First(&note, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
			return
		}
		services.SetCache(c.Request.Context(), cacheKey, note, 5*time.Minute)
		c.Header("X-Cache", "MISS")
	} else {
		c.Header("X-Cache", "HIT")
	}

	uid := c.GetString("uid")
	if uid != "" {
		var user models.User
		if err := services.DB.Where("uid = ?", uid).First(&user).Error; err == nil {
			var count int64
			services.DB.Model(&models.NoteUpvote{}).Where("user_id = ? AND note_id = ?", user.ID, note.ID).Count(&count)
			note.IsUpvoted = (count > 0)
		}
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

	if strings.TrimSpace(user.PhoneNumber) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please enter your phone number in your profile before uploading notes."})
		return
	}

	var newNote models.Note
	if err := c.ShouldBindJSON(&newNote); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newNote.UploadedBy = user.ID
	newNote.Available = true
	if err := services.DB.Create(&newNote).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create note"})
		return
	}

	services.InvalidatePattern(c.Request.Context(), "notes:*")
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

	// Clean up related records (upvotes, waitlists, rentals) inside a transaction to prevent FK constraint violations
	err = services.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("note_id = ?", note.ID).Delete(&models.NoteUpvote{}).Error; err != nil {
			return err
		}
		if err := tx.Where("note_id = ?", note.ID).Delete(&models.NoteWaitlist{}).Error; err != nil {
			return err
		}
		if err := tx.Where("notes_id = ?", note.ID).Delete(&models.Rental{}).Error; err != nil {
			return err
		}
		if err := tx.Delete(&note).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete note: " + err.Error()})
		return
	}

	services.InvalidatePattern(c.Request.Context(), "notes:*")
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

// ToggleNoteUpvote adds or removes an upvote for a note
func ToggleNoteUpvote(c *gin.Context) {
	idStr := c.Param("id")
	noteID, err := strconv.ParseUint(idStr, 10, 64)
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
	if err := services.DB.First(&note, noteID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	var existing models.NoteUpvote
	err = services.DB.Where("user_id = ? AND note_id = ?", user.ID, note.ID).First(&existing).Error

	if err == nil {
		// Remove upvote
		services.DB.Delete(&existing)
		if note.Upvotes > 0 {
			note.Upvotes--
			services.DB.Save(&note)
		}
		services.InvalidatePattern(c.Request.Context(), "notes:*")
		c.JSON(http.StatusOK, gin.H{"message": "Upvote removed", "upvotes": note.Upvotes, "is_upvoted": false})
	} else {
		// Add upvote
		upvote := models.NoteUpvote{
			UserID: user.ID,
			NoteID: note.ID,
		}
		services.DB.Create(&upvote)
		note.Upvotes++
		services.DB.Save(&note)
		services.InvalidatePattern(c.Request.Context(), "notes:*")
		c.JSON(http.StatusOK, gin.H{"message": "Upvoted", "upvotes": note.Upvotes, "is_upvoted": true})
	}
}

// JoinNoteWaitlist adds a user to a note's waitlist
func JoinNoteWaitlist(c *gin.Context) {
	noteIDStr := c.Param("id")
	noteID, err := strconv.ParseUint(noteIDStr, 10, 64)
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
	if err := services.DB.First(&note, noteID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	if note.Available {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Note is currently available. You can just rent it."})
		return
	}

	var existing models.NoteWaitlist
	if err := services.DB.Where("user_id = ? AND note_id = ?", user.ID, note.ID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Already in waitlist"})
		return
	}

	waitlist := models.NoteWaitlist{
		UserID: user.ID,
		NoteID: note.ID,
	}
	if err := services.DB.Create(&waitlist).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join waitlist"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Joined waitlist"})
}

// LeaveNoteWaitlist removes a user from a note's waitlist
func LeaveNoteWaitlist(c *gin.Context) {
	noteIDStr := c.Param("id")
	noteID, err := strconv.ParseUint(noteIDStr, 10, 64)
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

	result := services.DB.Where("user_id = ? AND note_id = ?", user.ID, noteID).Delete(&models.NoteWaitlist{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to leave waitlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Left waitlist"})
}

// GetNoteWaitlistStatus returns whether the user is on the waitlist
func GetNoteWaitlistStatus(c *gin.Context) {
	noteIDStr := c.Param("id")
	noteID, err := strconv.ParseUint(noteIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}

	uid := c.GetString("uid")
	if uid == "" {
		c.JSON(http.StatusOK, gin.H{"waitlisted": false})
		return
	}

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"waitlisted": false})
		return
	}

	var count int64
	services.DB.Model(&models.NoteWaitlist{}).Where("user_id = ? AND note_id = ?", user.ID, noteID).Count(&count)

	c.JSON(http.StatusOK, gin.H{"waitlisted": count > 0})
}

// UpdateNote updates a study note listing if caller is the uploader or an admin
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var note models.Note
	if err := services.DB.First(&note, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	if note.UploadedBy != user.ID && !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to edit this note"})
		return
	}

	var input struct {
		Title       *string  `json:"title"`
		Subject     *string  `json:"subject"`
		Slot        *string  `json:"slot"`
		Condition   *string  `json:"condition"`
		Description *string  `json:"description"`
		FilePath    *string  `json:"file_path"`
		Price       *float64 `json:"price"`
		Available   *bool    `json:"available"`
		IsPublic    *bool    `json:"is_public"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Title != nil {
		note.Title = *input.Title
	}
	if input.Subject != nil {
		note.Subject = *input.Subject
	}
	if input.Slot != nil {
		note.Slot = *input.Slot
	}
	if input.Condition != nil {
		note.Condition = *input.Condition
	}
	if input.Description != nil {
		note.Description = *input.Description
	}
	if input.FilePath != nil && *input.FilePath != "" {
		note.FilePath = *input.FilePath
	}
	if input.Price != nil {
		note.Price = *input.Price
	}
	if input.Available != nil {
		note.Available = *input.Available
	}
	if input.IsPublic != nil {
		note.IsPublic = *input.IsPublic
	}

	if err := services.DB.Save(&note).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update note"})
		return
	}

	services.InvalidatePattern(c.Request.Context(), "notes:*")
	services.DB.Preload("Uploader").First(&note, note.ID)
	c.JSON(http.StatusOK, note)
}

