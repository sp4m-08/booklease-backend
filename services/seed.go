package services

import (
	"log"
	"time"

	"bookapi/models"
)

func SeedData() {
	// Users
	users := []models.User{
		{Username: "alice", PhoneNumber: "9876543210", RegistrationNo: "22BCE1000", IsAdmin: false, Email: "alice@vitstudent.ac.in"},
		{Username: "bob", PhoneNumber: "9876543211", RegistrationNo: "22BCE1001", IsAdmin: true, Email: "bob@vitstudent.ac.in"},
	}
	for _, u := range users {
		DB.Create(&u)
	}

	// Books
	books := []models.Book{
		{Title: "Go in Action", Author: "William Kennedy", Subject: "Computer Science", Description: "Intro to Go", Category: "Programming", Available: true, UploadedBy: 1},
		{Title: "Clean Code", Author: "Robert C. Martin", Subject: "Software Engineering", Description: "Coding best practices", Category: "Software Engineering", Available: true, UploadedBy: 2},
	}
	for _, b := range books {
		DB.Create(&b)
	}

	// Notes
	notes := []models.Note{
		{Title: "DBMS Notes", Subject: "DBMS", Description: "ER Diagrams", FilePath: "notes/dbms.pdf", IsPublic: true, UploadedBy: 1},
		{Title: "OS Notes", Subject: "Operating Systems", Description: "Process Scheduling", FilePath: "notes/os.pdf", IsPublic: false, UploadedBy: 1},
	}
	for _, n := range notes {
		DB.Create(&n)
	}

	// Rentals
	bookID := uint(1)
	ownerID := uint(1)
	rentals := []models.Rental{
		{UserID: 2, BookID: &bookID, OwnerID: &ownerID, RentedFrom: time.Now().AddDate(0, 0, -2), DueDate: time.Now().AddDate(0, 0, 5), IsReturned: false},
	}
	for _, r := range rentals {
		DB.Create(&r)
	}

	// Wishlist
	wishlists := []models.Wishlist{
		{UserID: 1, BookID: 2, CreatedAt: time.Now()},
	}
	for _, w := range wishlists {
		DB.Create(&w)
	}

	// Admin
	admins := []models.Admin{
		{AdminID: 2},
	}
	for _, a := range admins {
		DB.Create(&a)
	}

	// FAQs
	faqs := []models.FAQ{
		{Question: "How do I rent a book?", Answer: "Click on the 'Rent' button next to any available book."},
		{Question: "How long can I keep a rental?", Answer: "The default rental period is 7 days."},
	}
	for _, f := range faqs {
		DB.Create(&f)
	}

	log.Println("✅ Seed data inserted successfully")
}
