package api

import (
	"bookapi/models"
	"bookapi/services"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateOrFetchUser creates a user record in the DB if one doesn't exist yet
func CreateOrFetchUser(c *gin.Context) {
	uid := c.GetString("uid")
	name := c.GetString("name")
	email := c.GetString("email")

	if uid == "" || email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user data from token"})
		return
	}

	if !strings.HasSuffix(email, "@vitstudent.ac.in") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only @vitstudent.ac.in emails are allowed"})
		return
	}
	if name == "" {
		parts := strings.Split(email, "@")
		name = parts[0]
	}

	var registrationNo string
	regNumPattern := regexp.MustCompile(`^\d{2}[A-Z]{3}\d{4}$`)
	parts := strings.Fields(name)
	for _, word := range parts {
		if regNumPattern.MatchString(strings.ToUpper(word)) {
			registrationNo = strings.ToUpper(word)
			break
		}
	}

	if registrationNo == "" {
		// Fallback registration number for testing / other domains
		randomPart := rand.Intn(10000)
		registrationNo = fmt.Sprintf("99GEN%04d", randomPart)
	}

	var user models.User
	result := services.DB.Where("uid = ?", uid).First(&user)
	if result.Error == nil {
		// Update email if missing
		if user.Email == "" && email != "" {
			user.Email = email
			services.DB.Save(&user)
		}
		c.JSON(http.StatusOK, gin.H{"message": "User already exists", "user": user})
		return
	}

	newUser := models.User{
		UID:            uid,
		Email:          email,
		Username:       name,
		RegistrationNo: registrationNo,
		IsAdmin:        false,
	}
	if err := services.DB.Create(&newUser).Error; err != nil {
		log.Println("❌ DB Create error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created", "user": newUser})
}

type PhoneUpdateRequest struct {
	PhoneNumber string `json:"phone_number" binding:"required"`
}

// GetUserProfile returns the current authenticated user profile
func GetUserProfile(c *gin.Context) {
	uid := c.GetString("uid")

	var user models.User
	result := services.DB.Where("uid = ?", uid).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":              user.ID,
		"uid":             user.UID,
		"username":        user.Username,
		"phone_number":    user.PhoneNumber,
		"registration_no": user.RegistrationNo,
		"is_admin":        user.IsAdmin,
		"email":           c.GetString("email"),
	})
}

// UpdatePhoneNumber updates phone number for the user
func UpdatePhoneNumber(c *gin.Context) {
	uid := c.GetString("uid")
	if uid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req PhoneUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.PhoneNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid phone number in request"})
		return
	}

	re := regexp.MustCompile(`^[6-9]\d{9}$`)
	if !re.MatchString(req.PhoneNumber) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Phone number format invalid (expected 10-digit Indian mobile number)"})
		return
	}

	var user models.User
	result := services.DB.Where("uid = ?", uid).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.PhoneNumber = req.PhoneNumber
	if err := services.DB.Save(&user).Error; err != nil {
		log.Println("❌ DB Update error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update phone number"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Phone number updated", "user": user})
}
