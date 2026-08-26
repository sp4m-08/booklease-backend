package api

import (
	"fmt"
	"net/http"
	"strconv"

	"bookapi/models"
	"bookapi/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// PostRental creates a new rental request for a book
func PostRental(c *gin.Context) {
	uid := c.GetString("uid")
	if uid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var newRental models.Rental
	if err := c.ShouldBindJSON(&newRental); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if newRental.BookID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing book_id"})
		return
	}

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var book models.Book
	if err := services.DB.First(&book, *newRental.BookID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	// Prevent user from renting their own book
	if book.UploadedBy == user.ID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot rent your own book"})
		return
	}

	if !book.Available {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This book is currently unavailable for rent"})
		return
	}

	newRental.UserID = user.ID
	newRental.OwnerID = &book.UploadedBy
	newRental.IsReturned = false

	if err := services.DB.Create(&newRental).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	services.CreateNotification(book.UploadedBy, "rental_request", fmt.Sprintf("%s wants to rent \"%s\"", user.Username, book.Title))

	c.JSON(http.StatusCreated, newRental)
}

// GetRentals returns rentals related to the authenticated user (or all if admin)
func GetRentals(c *gin.Context) {
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

	var rentals []models.Rental
	query := services.DB.Preload("Book").Preload("Book.Uploader").Preload("User")
	if !user.IsAdmin {
		query = query.Where("user_id = ? OR owner_id = ?", user.ID, user.ID)
	}

	if err := query.Order("id DESC").Find(&rentals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rentals"})
		return
	}

	c.JSON(http.StatusOK, rentals)
}

// DeleteRental cancels/deletes a rental request
func DeleteRental(c *gin.Context) {
	uid := c.GetString("uid")
	if uid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	rentalIDStr := c.Param("id")
	rentalID, err := strconv.ParseUint(rentalIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rental ID"})
		return
	}

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var rental models.Rental
	if err := services.DB.First(&rental, rentalID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Rental not found"})
		return
	}

	if rental.UserID != user.ID && (rental.OwnerID == nil || *rental.OwnerID != user.ID) && !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to delete this rental"})
		return
	}

	if err := services.DB.Delete(&rental).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete rental"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Rental deleted successfully"})
}

// ReturnRental marks a borrowed book as returned and restores book availability
func ReturnRental(c *gin.Context) {
	uid := c.GetString("uid")
	rentalID := c.Param("id")

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var rental models.Rental
	if err := services.DB.Preload("Book").First(&rental, rentalID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Rental not found"})
		return
	}

	if rental.UserID != user.ID && !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to update this rental"})
		return
	}

	if rental.Status == nil || !*rental.Status {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rental has not been accepted yet"})
		return
	}

	if rental.IsReturned {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rental already marked as returned"})
		return
	}

	// Transaction to update rental status and book availability
	err := services.DB.Transaction(func(tx *gorm.DB) error {
		rental.IsReturned = true
		if err := tx.Save(&rental).Error; err != nil {
			return err
		}

		if rental.BookID != nil {
			var book models.Book
			if err := tx.First(&book, *rental.BookID).Error; err == nil {
				book.Available = true
				if err := tx.Save(&book).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process return transaction"})
		return
	}

	if rental.OwnerID != nil {
		services.CreateNotification(*rental.OwnerID, "book_returned", fmt.Sprintf("Book \"%s\" was returned!", rental.Book.Title))
	}

	c.JSON(http.StatusOK, gin.H{"message": "Book returned successfully"})
}

// BorrowedMaterials returns books currently borrowed by the user
func BorrowedMaterials(c *gin.Context) {
	uid := c.GetString("uid")

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var rentals []models.Rental
	if err := services.DB.Where("user_id = ?", user.ID).Order("id DESC").Preload("Book").Preload("Book.Uploader").Find(&rentals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch borrowed materials"})
		return
	}

	c.JSON(http.StatusOK, rentals)
}

// LentMaterials returns books listed by the user that are currently rented out
func LentMaterials(c *gin.Context) {
	uid := c.GetString("uid")

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var rentals []models.Rental
	if err := services.DB.
		Where("owner_id = ?", user.ID).
		Preload("Book").
		Preload("Book.Uploader").
		Preload("User").
		Order("id DESC").
		Find(&rentals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch lent materials"})
		return
	}

	c.JSON(http.StatusOK, rentals)
}

// DecideRental accepts or rejects a rental request
func DecideRental(c *gin.Context) {
	uid := c.GetString("uid")
	rentalID := c.Param("id")

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var rental models.Rental
	if err := services.DB.Preload("Book").First(&rental, rentalID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Rental not found"})
		return
	}

	// Check ownership
	if rental.OwnerID == nil || *rental.OwnerID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to decide this rental"})
		return
	}

	var body struct {
		Accept bool `json:"accept"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Transaction to update rental status and book availability
	err := services.DB.Transaction(func(tx *gorm.DB) error {
		rental.Status = &body.Accept
		if err := tx.Save(&rental).Error; err != nil {
			return err
		}

		if body.Accept && rental.BookID != nil {
			var book models.Book
			if err := tx.First(&book, *rental.BookID).Error; err != nil {
				return err
			}
			book.Available = false
			if err := tx.Save(&book).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update rental decision"})
		return
	}

	statusText := "rejected"
	if body.Accept {
		statusText = "accepted"
	}

	services.CreateNotification(rental.UserID, "rental_status", fmt.Sprintf("Your request to rent \"%s\" was %s", rental.Book.Title, statusText))
	c.JSON(http.StatusOK, gin.H{"message": "Rental request " + statusText})
}
