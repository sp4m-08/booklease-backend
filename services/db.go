package services

import (
	"bookapi/models"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDatabase() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using system env")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("❌ DATABASE_URL not found in env")
	}

	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true, // Disables prepared statement caching for Supabase connection pooler / PgBouncer
	}), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Printf("⚠️ Warning: Failed to configure sql.DB connection pool: %v", err)
	} else {
		sqlDB.SetMaxOpenConns(50)                 // Max simultaneous open connections
		sqlDB.SetMaxIdleConns(25)                 // Pre-warmed idle connections ready for quick execution
		sqlDB.SetConnMaxLifetime(5 * time.Minute) // Recycle stale connections
		sqlDB.SetConnMaxIdleTime(2 * time.Minute) // Close idle connections after 2 minutes
		log.Println("⚡ Database connection pool configured (MaxOpen: 50, MaxIdle: 25)")
	}

	log.Println("✅ Connected to Supabase PostgreSQL!")
	DB = db

	if err := db.AutoMigrate(
		&models.User{},
		&models.Book{},
		&models.Note{},
		&models.Rental{},
		&models.Wishlist{},
		&models.BookWaitlist{},
		&models.NoteUpvote{},
		&models.NoteWaitlist{},
		&models.Admin{},
		&models.FAQ{},
		&models.Notification{},
	); err != nil {
		log.Printf("⚠️ AutoMigrate warning: %v\n", err)
	}
}
