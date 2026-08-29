package api

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"bookapi/models"
	"bookapi/services"

	"github.com/gin-gonic/gin"
)

// GetBooks returns all books, optionally filtered by category or search term
func GetBooks(c *gin.Context) {
	query := services.DB.Model(&models.Book{}).Preload("Uploader")

	category := c.Query("category")
	if category != "" {
		query = query.Where("LOWER(category) = ?", strings.ToLower(category))
	}

	search := c.Query("search")
	if search != "" {
		query = query.Where("LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(subject) LIKE ?",
			"%"+strings.ToLower(search)+"%", "%"+strings.ToLower(search)+"%", "%"+strings.ToLower(search)+"%")
	}

	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err == nil && limit > 0 {
		query = query.Limit(limit)
	}

	offsetStr := c.DefaultQuery("offset", "0")
	offset, err := strconv.Atoi(offsetStr)
	if err == nil && offset >= 0 {
		query = query.Offset(offset)
	}

	var books []models.Book
	if err := query.Order("id DESC").Find(&books).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch books"})
		return
	}
	c.JSON(http.StatusOK, books)
}

// GetBook fetches a single book by ID
func GetBook(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	var book models.Book
	if err := services.DB.Preload("Uploader").First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}
	c.JSON(http.StatusOK, book)
}

// MyBooks returns books uploaded by the authenticated user
func MyBooks(c *gin.Context) {
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

	var userBooks []models.Book
	if err := services.DB.Where("uploaded_by = ?", user.ID).Order("id DESC").Find(&userBooks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user books"})
		return
	}

	c.JSON(http.StatusOK, userBooks)
}

// CreateBook adds a new book listing
func CreateBook(c *gin.Context) {
	var newBook models.Book
	if err := c.ShouldBindJSON(&newBook); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	uid := c.GetString("uid")
	if uid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User record not found. Please complete signup first."})
		return
	}

	newBook.UploadedBy = user.ID
	newBook.Available = true
	newBook.Slot = newBook.Slot

	if err := services.DB.Create(&newBook).Error; err != nil {
		log.Println("❌ CreateBook error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book"})
		return
	}

	// Reload with Uploader relationship
	services.DB.Preload("Uploader").First(&newBook, newBook.ID)
	c.JSON(http.StatusCreated, newBook)
}

// DeleteBook removes a book if caller is the uploader or an admin
func DeleteBook(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
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

	var book models.Book
	if err := services.DB.First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	// Authorization check
	if book.UploadedBy != user.ID && !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to delete this book"})
		return
	}

	if err := services.DB.Delete(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete book"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Book deleted successfully"})
}

// AddToWishlist adds a book to the user's wishlist
func AddToWishlist(c *gin.Context) {
	bookIDStr := c.Param("id")
	bookID, err := strconv.ParseUint(bookIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
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

	var book models.Book
	if err := services.DB.First(&book, bookID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	var existing models.Wishlist
	if err := services.DB.Where("user_id = ? AND book_id = ?", user.ID, book.ID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Book already in wishlist"})
		return
	}

	wish := models.Wishlist{
		UserID: user.ID,
		BookID: book.ID,
	}
	if err := services.DB.Create(&wish).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to wishlist"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Book added to wishlist"})
}

// Wishlist returns the user's wishlist
func Wishlist(c *gin.Context) {
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

	var wishlist []models.Wishlist
	if err := services.DB.Where("user_id = ?", user.ID).Preload("Book").Preload("Book.Uploader").Find(&wishlist).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch wishlist"})
		return
	}

	c.JSON(http.StatusOK, wishlist)
}

// RemoveFromWishlist removes a book from the user's wishlist
func RemoveFromWishlist(c *gin.Context) {
	bookIDStr := c.Param("id")
	bookID, err := strconv.ParseUint(bookIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
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

	result := services.DB.Where("user_id = ? AND book_id = ?", user.ID, bookID).Delete(&models.Wishlist{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from wishlist"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found in wishlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Book removed from wishlist"})
}

// JoinWaitlist adds a user to a book's waitlist
func JoinWaitlist(c *gin.Context) {
	bookIDStr := c.Param("id")
	bookID, err := strconv.ParseUint(bookIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
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

	var book models.Book
	if err := services.DB.First(&book, bookID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	if book.Available {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Book is currently available. You can just rent it."})
		return
	}

	var existing models.BookWaitlist
	if err := services.DB.Where("user_id = ? AND book_id = ?", user.ID, book.ID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Already in waitlist"})
		return
	}

	waitlist := models.BookWaitlist{
		UserID: user.ID,
		BookID: book.ID,
	}
	if err := services.DB.Create(&waitlist).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join waitlist"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Joined waitlist"})
}

// LeaveWaitlist removes a user from a book's waitlist
func LeaveWaitlist(c *gin.Context) {
	bookIDStr := c.Param("id")
	bookID, err := strconv.ParseUint(bookIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
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

	result := services.DB.Where("user_id = ? AND book_id = ?", user.ID, bookID).Delete(&models.BookWaitlist{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to leave waitlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Left waitlist"})
}

// GetWaitlistStatus returns whether the user is on the waitlist
func GetWaitlistStatus(c *gin.Context) {
	bookIDStr := c.Param("id")
	bookID, err := strconv.ParseUint(bookIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
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
	services.DB.Model(&models.BookWaitlist{}).Where("user_id = ? AND book_id = ?", user.ID, bookID).Count(&count)

	c.JSON(http.StatusOK, gin.H{"waitlisted": count > 0})
}

// UpdateBook updates a book listing if caller is the uploader or an admin
func UpdateBook(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
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

	var book models.Book
	if err := services.DB.First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	if book.UploadedBy != user.ID && !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to edit this book"})
		return
	}

	var input struct {
		Title       *string  `json:"title"`
		Author      *string  `json:"author"`
		Subject     *string  `json:"subject"`
		Description *string  `json:"description"`
		Category    *string  `json:"category"`
		Slot        *string  `json:"slot"`
		Condition   *string  `json:"condition"`
		CoverImage  *string  `json:"cover_image"`
		Price       *float64 `json:"price"`
		Available   *bool    `json:"available"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Title != nil {
		book.Title = *input.Title
	}
	if input.Author != nil {
		book.Author = *input.Author
	}
	if input.Subject != nil {
		book.Subject = *input.Subject
	}
	if input.Description != nil {
		book.Description = *input.Description
	}
	if input.Category != nil {
		book.Category = *input.Category
	}
	if input.Slot != nil {
		book.Slot = *input.Slot
	}
	if input.Condition != nil {
		book.Condition = *input.Condition
	}
	if input.CoverImage != nil && *input.CoverImage != "" {
		book.CoverImage = *input.CoverImage
	}
	if input.Price != nil {
		book.Price = *input.Price
	}
	if input.Available != nil {
		book.Available = *input.Available
	}

	if err := services.DB.Save(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book"})
		return
	}

	services.DB.Preload("Uploader").First(&book, book.ID)
	c.JSON(http.StatusOK, book)
}

