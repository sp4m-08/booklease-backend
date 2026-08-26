package services

import (
	"bookapi/models"
	"log"
	"os"

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

	log.Println("✅ Connected to Supabase PostgreSQL!")
	DB = db

	if err := db.AutoMigrate(
		&models.User{},
		&models.Book{},
		&models.Note{},
		&models.Rental{},
		&models.Wishlist{},
		&models.Admin{},
		&models.FAQ{},
		&models.Notification{},
	); err != nil {
		log.Printf("⚠️ AutoMigrate warning: %v\n", err)
	}
}
