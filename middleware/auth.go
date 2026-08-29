package middleware

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	firebase "firebase.google.com/go/v4"
	"github.com/gin-gonic/gin"
)

// isEmailAllowed checks if an email matches the allowed domain list from env
func isEmailAllowed(email string) bool {
	allowedEnv := os.Getenv("ALLOWED_EMAIL_DOMAINS")
	if allowedEnv == "" {
		allowedEnv = "vitstudent.ac.in"
	}
	if allowedEnv == "*" {
		return true
	}

	domains := strings.Split(allowedEnv, ",")
	for _, domain := range domains {
		d := strings.TrimSpace(domain)
		if d != "" && strings.HasSuffix(strings.ToLower(email), "@"+strings.ToLower(d)) {
			return true
		}
	}
	return false
}

func RequireAuth(app *firebase.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid Authorization header"})
			return
		}
		idToken := strings.TrimPrefix(authHeader, "Bearer ")

		authClient, err := app.Auth(context.Background())
		if err != nil {
			log.Printf("❌ Failed to initialize Firebase Auth: %v\n", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal auth error"})
			return
		}

		token, err := authClient.VerifyIDToken(context.Background(), idToken)
		if err != nil {
			log.Printf("❌ Token verification error: %v\n", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		email, ok := token.Claims["email"].(string)
		if !ok || !isEmailAllowed(email) {
			log.Printf("⚠️ Unauthorized email attempt: %s\n", email)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Unauthorized email domain"})
			return
		}

		uid := token.UID
		name, _ := token.Claims["name"].(string)
		if name == "" {
			// Fallback: extract username prefix from email
			parts := strings.Split(email, "@")
			name = parts[0]
		}

		log.Printf("✅ Authenticated: %s (UID: %s)\n", email, uid)
		c.Set("email", email)
		c.Set("uid", uid)
		c.Set("name", name)
		c.Next()
	}
}

func OptionalAuth(app *firebase.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.Next()
			return
		}
		idToken := strings.TrimPrefix(authHeader, "Bearer ")

		authClient, err := app.Auth(context.Background())
		if err != nil {
			c.Next()
			return
		}

		token, err := authClient.VerifyIDToken(context.Background(), idToken)
		if err != nil {
			c.Next()
			return
		}

		email, ok := token.Claims["email"].(string)
		if !ok || !isEmailAllowed(email) {
			c.Next()
			return
		}

		uid := token.UID
		c.Set("email", email)
		c.Set("uid", uid)
		c.Next()
	}
}
