package api

import (
	"net/http"
	"strconv"

	"bookapi/models"
	"bookapi/services"

	"github.com/gin-gonic/gin"
)

// Notifications returns all notifications for the authenticated user
func Notifications(c *gin.Context) {
	uid := c.GetString("uid")

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var notifs []models.Notification
	if err := services.DB.
		Where("user_id = ?", user.ID).
		Order("created_at DESC").
		Find(&notifs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	c.JSON(http.StatusOK, notifs)
}

// DeleteNotification removes a single notification owned by the user
func DeleteNotification(c *gin.Context) {
	uid := c.GetString("uid")

	notifIDStr := c.Param("id")
	notifID, err := strconv.ParseUint(notifIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var notif models.Notification
	if err := services.DB.First(&notif, notifID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	if notif.UserID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to delete this notification"})
		return
	}

	if err := services.DB.Delete(&notif).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted successfully"})
}

// MarkNotificationSeen marks a notification as read
func MarkNotificationSeen(c *gin.Context) {
	uid := c.GetString("uid")
	notificationID := c.Param("id")

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var notification models.Notification
	if err := services.DB.Where("id = ? AND user_id = ?", notificationID, user.ID).First(&notification).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	notification.Seen = true
	if err := services.DB.Save(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as seen"})
}

// DeleteAllNotifications clears all notifications for the authenticated user
func DeleteAllNotifications(c *gin.Context) {
	uid := c.GetString("uid")

	var user models.User
	if err := services.DB.Where("uid = ?", uid).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if err := services.DB.Where("user_id = ?", user.ID).Delete(&models.Notification{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications deleted successfully"})
}
