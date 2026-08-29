package api

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

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

	if newRental.BookID == nil && newRental.NotesID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing book_id or notes_id"})
		return
	}

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var ownerID uint
	var itemTitle string
	if newRental.BookID != nil {
		var book models.Book
		if err := services.DB.First(&book, *newRental.BookID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
			return
		}
		if book.UploadedBy == user.ID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot rent your own book"})
			return
		}
		if !book.Available {
			c.JSON(http.StatusBadRequest, gin.H{"error": "This book is currently unavailable for rent"})
			return
		}
		ownerID = book.UploadedBy
		itemTitle = book.Title
	} else if newRental.NotesID != nil {
		var note models.Note
		if err := services.DB.First(&note, *newRental.NotesID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
			return
		}
		if note.UploadedBy == user.ID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot rent your own note"})
			return
		}
		if !note.Available {
			c.JSON(http.StatusBadRequest, gin.H{"error": "This note is currently unavailable for rent"})
			return
		}
		ownerID = note.UploadedBy
		itemTitle = note.Title
	}

	newRental.UserID = user.ID
	newRental.OwnerID = &ownerID
	newRental.IsReturned = false

	if err := services.DB.Create(&newRental).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	services.CreateNotification(ownerID, "rental_request", fmt.Sprintf("%s wants to rent \"%s\"", user.Username, itemTitle))

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
	query := services.DB.Preload("Book").Preload("Book.Uploader").Preload("Note").Preload("Note.Uploader").Preload("User")
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
	if err := services.DB.Preload("Book").Preload("Note").First(&rental, rentalID).Error; err != nil {
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
				if rental.Slot != "" {
					slots := strings.Split(book.RentedSlots, ",")
					newSlots := []string{}
					for _, s := range slots {
						if strings.TrimSpace(s) != "" && strings.TrimSpace(s) != rental.Slot {
							newSlots = append(newSlots, strings.TrimSpace(s))
						}
					}
					book.RentedSlots = strings.Join(newSlots, ", ")
				}
				book.Available = true
				if err := tx.Save(&book).Error; err != nil {
					return err
				}
			}
		} else if rental.NotesID != nil {
			var note models.Note
			if err := tx.First(&note, *rental.NotesID).Error; err == nil {
				if rental.Slot != "" {
					slots := strings.Split(note.RentedSlots, ",")
					newSlots := []string{}
					for _, s := range slots {
						if strings.TrimSpace(s) != "" && strings.TrimSpace(s) != rental.Slot {
							newSlots = append(newSlots, strings.TrimSpace(s))
						}
					}
					note.RentedSlots = strings.Join(newSlots, ", ")
				}
				note.Available = true
				if err := tx.Save(&note).Error; err != nil {
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
		if rental.BookID != nil {
			services.CreateNotification(*rental.OwnerID, "book_returned", fmt.Sprintf("Item \"%s\" was returned!", rental.Book.Title))
		} else if rental.NotesID != nil {
			services.CreateNotification(*rental.OwnerID, "note_returned", fmt.Sprintf("Item \"%s\" was returned!", rental.Note.Title))
		}
	}

	if rental.BookID != nil {
		var waitlistUsers []models.BookWaitlist
		if err := services.DB.Where("book_id = ?", *rental.BookID).Find(&waitlistUsers).Error; err == nil {
			for _, wu := range waitlistUsers {
				services.CreateNotification(wu.UserID, "book_available", fmt.Sprintf("The book \"%s\" on your waitlist is now available!", rental.Book.Title))
			}
			services.DB.Where("book_id = ?", *rental.BookID).Delete(&models.BookWaitlist{})
		}
	} else if rental.NotesID != nil {
		var waitlistUsers []models.NoteWaitlist
		if err := services.DB.Where("note_id = ?", *rental.NotesID).Find(&waitlistUsers).Error; err == nil {
			for _, wu := range waitlistUsers {
				services.CreateNotification(wu.UserID, "note_available", "A note on your waitlist is now available!")
			}
			services.DB.Where("note_id = ?", *rental.NotesID).Delete(&models.NoteWaitlist{})
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item returned successfully"})
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
	if err := services.DB.Where("user_id = ?", user.ID).Order("id DESC").Preload("Book").Preload("Book.Uploader").Preload("Note").Preload("Note.Uploader").Find(&rentals).Error; err != nil {
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
		Preload("Note").
		Preload("Note.Uploader").
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
	if err := services.DB.Preload("Book").Preload("Note").First(&rental, rentalID).Error; err != nil {
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

		if body.Accept {
			if rental.BookID != nil {
				var book models.Book
				if err := tx.First(&book, *rental.BookID).Error; err != nil {
					return err
				}
				
				if rental.Slot != "" && book.Slot != "All Slots" && book.Slot != "" {
					if book.RentedSlots == "" {
						book.RentedSlots = rental.Slot
					} else {
						book.RentedSlots = book.RentedSlots + ", " + rental.Slot
					}
					// Check if all available slots are now rented
					allSlots := strings.Split(book.Slot, ",")
					rentedSlots := strings.Split(book.RentedSlots, ",")
					if len(rentedSlots) >= len(allSlots) {
						book.Available = false
					}
				} else {
					book.Available = false
				}

				if err := tx.Save(&book).Error; err != nil {
					return err
				}
			} else if rental.NotesID != nil {
				var note models.Note
				if err := tx.First(&note, *rental.NotesID).Error; err != nil {
					return err
				}

				if rental.Slot != "" && note.Slot != "All Slots" && note.Slot != "" {
					if note.RentedSlots == "" {
						note.RentedSlots = rental.Slot
					} else {
						note.RentedSlots = note.RentedSlots + ", " + rental.Slot
					}
					allSlots := strings.Split(note.Slot, ",")
					rentedSlots := strings.Split(note.RentedSlots, ",")
					if len(rentedSlots) >= len(allSlots) {
						note.Available = false
					}
				} else {
					note.Available = false
				}

				if err := tx.Save(&note).Error; err != nil {
					return err
				}
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

	var itemName string
	if rental.BookID != nil {
		itemName = rental.Book.Title
	} else if rental.NotesID != nil {
		itemName = rental.Note.Title
	} else {
		itemName = "a study material"
	}

	services.CreateNotification(rental.UserID, "rental_decision", fmt.Sprintf("Your request to rent \"%s\" was %s.", itemName, statusText))

	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Rental %s successfully", statusText)})
}
