package routes

import (
	"bookapi/api"
	"bookapi/middleware"

	firebase "firebase.google.com/go/v4"
	"github.com/gin-gonic/gin"
)

func RegisterAPIRoutes(r *gin.Engine, app *firebase.App) {
	// API Base Group
	apiGroup := r.Group("/api")
	{
		apiGroup.GET("/hello", middleware.RequireAuth(app), api.HelloHandler)
		apiGroup.GET("/FAQ", api.GetFAQ)
		apiGroup.POST("/upload/presigned-url", middleware.RequireAuth(app), api.GetPresignedUploadURL)
		apiGroup.POST("/upload/direct", middleware.RequireAuth(app), api.DirectUpload)
	}

	// Book Routes
	bookRoutes := r.Group("/book")
	{
		// Public
		bookRoutes.GET("/", api.GetBooks)
		bookRoutes.GET("/:id", api.GetBook)

		// Protected
		bookRoutes.GET("/mybooks", middleware.RequireAuth(app), api.MyBooks)
		bookRoutes.DELETE("/:id", middleware.RequireAuth(app), api.DeleteBook)
		bookRoutes.POST("/", middleware.RequireAuth(app), api.CreateBook)
		bookRoutes.POST("/:id/wishlist", middleware.RequireAuth(app), api.AddToWishlist)
		bookRoutes.DELETE("/:id/wishlist", middleware.RequireAuth(app), api.RemoveFromWishlist)
		bookRoutes.GET("/wishlist", middleware.RequireAuth(app), api.Wishlist)
	}

	// Notes Routes
	noteRoutes := r.Group("/notes")
	{
		// Public
		noteRoutes.GET("/", api.GetNotes)
		noteRoutes.GET("/:id", api.GetNote)

		// Protected
		noteRoutes.GET("/mynotes", middleware.RequireAuth(app), api.MyNotes)
		noteRoutes.POST("/", middleware.RequireAuth(app), api.CreateNote)
		noteRoutes.DELETE("/:id", middleware.RequireAuth(app), api.DeleteNote)
	}

	// Rental Routes
	rentalRoutes := r.Group("/rentals", middleware.RequireAuth(app))
	{
		rentalRoutes.POST("/", api.PostRental)
		rentalRoutes.GET("/", api.GetRentals)
		rentalRoutes.GET("/lent", api.LentMaterials)
		rentalRoutes.GET("/borrowed", api.BorrowedMaterials)
		rentalRoutes.POST("/:id/decision", api.DecideRental)
		rentalRoutes.DELETE("/delete/:id", api.DeleteRental)
		rentalRoutes.PATCH("/:id/return", api.ReturnRental)
	}

	// User Routes
	userRoutes := r.Group("/user", middleware.RequireAuth(app))
	{
		userRoutes.POST("/signup", api.CreateOrFetchUser)
		userRoutes.POST("/phone", api.UpdatePhoneNumber)
		userRoutes.GET("/", api.GetUserProfile)
	}

	// Notification Routes
	notiRoutes := r.Group("/notifications", middleware.RequireAuth(app))
	{
		notiRoutes.GET("/", api.Notifications)
		notiRoutes.DELETE("/:id", api.DeleteNotification)
		notiRoutes.PATCH("/:id/seen", api.MarkNotificationSeen)
		notiRoutes.DELETE("/", api.DeleteAllNotifications)
	}
}
