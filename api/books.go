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

// UpdateBook allows the owner (or admin) to update their book listing
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
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var book models.Book
	if err := services.DB.First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	if book.UploadedBy != user.ID && !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to edit this listing"})
		return
	}

	var req struct {
		Title       string   `json:"title"`
		Author      string   `json:"author"`
		Subject     string   `json:"subject"`
		Description string   `json:"description"`
		Category    string   `json:"category"`
		Slot        string   `json:"slot"`
		Price       *float64 `json:"price"`
		CoverImage  string   `json:"cover_image"`
		Available   *bool    `json:"available"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid update payload: " + err.Error()})
		return
	}

	if req.Title != "" {
		book.Title = req.Title
	}
	if req.Author != "" {
		book.Author = req.Author
	}
	if req.Subject != "" {
		book.Subject = req.Subject
	}
	if req.Description != "" {
		book.Description = req.Description
	}
	if req.Category != "" {
		book.Category = req.Category
	}
	if req.Slot != "" {
		book.Slot = req.Slot
	}
	if req.Price != nil {
		book.Price = *req.Price
	}
	if req.CoverImage != "" {
		book.CoverImage = req.CoverImage
	}
	if req.Available != nil {
		book.Available = *req.Available
	}

	if err := services.DB.Save(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book"})
		return
	}

	services.DB.Preload("Uploader").First(&book, book.ID)
	log.Printf("✏️ Book #%d updated by user %s\n", book.ID, user.Username)
	c.JSON(http.StatusOK, book)
}

