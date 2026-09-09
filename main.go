package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"bookapi/middleware"
	"bookapi/routes"
	"bookapi/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Initialize Firebase, Database, AWS S3 & Redis Cache
	services.InitFirebase()
	services.InitDatabase()
	services.InitS3()
	services.InitRedis()

	r := gin.Default()

	// Avoid untrusted proxy warnings in Gin
	_ = r.SetTrustedProxies(nil)

	// 2. High-Performance Gzip Compression Middleware
	r.Use(gzip.Gzip(gzip.DefaultCompression))

	// 3. Global Token-Bucket IP Rate Limiter (180 requests/min per IP, burst: 40)
	r.Use(middleware.RateLimitMiddleware(180, 40))

	// 4. CORS Middleware Configuration
	allowedOrigins := []string{
		"http://localhost:3000",
		"http://localhost:5173",
		"http://localhost:8080",
		"http://127.0.0.1:3000",
		"http://127.0.0.1:5173",
		"http://127.0.0.1:8080",
		"http://127.0.0.1:5500",
	}
	if envOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); envOrigins != "" {
		allowedOrigins = append(allowedOrigins, strings.Split(envOrigins, ",")...)
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 5. Health & Readiness Probes (For load balancers and orchestrators)
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"time":   time.Now().UTC(),
		})
	})

	r.GET("/readyz", func(c *gin.Context) {
		status := gin.H{
			"status":   "ready",
			"database": "connected",
			"redis":    "connected",
		}

		// Check PostgreSQL Connection
		if services.DB != nil {
			if sqlDB, err := services.DB.DB(); err != nil || sqlDB.Ping() != nil {
				status["database"] = "degraded"
				status["status"] = "degraded"
			}
		} else {
			status["database"] = "disconnected"
			status["status"] = "degraded"
		}

		// Check Redis Cache
		if services.RedisClient == nil || services.RedisClient.Ping(c.Request.Context()).Err() != nil {
			status["redis"] = "disconnected (fail-soft fallback active)"
		}

		c.JSON(http.StatusOK, status)
	})

	// 6. Static Files & Root
	r.GET("/", func(c *gin.Context) {
		c.File("./static/index.html")
	})
	r.Static("/static", "./static")

	// 7. API Routes
	routes.RegisterAPIRoutes(r, services.App)

	// 8. Start Server with Dynamic Port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server running at http://localhost:%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("❌ Server failed to start: %v\n", err)
	}
}
