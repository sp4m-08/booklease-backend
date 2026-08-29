package main

import (
	"bookapi/models"
	"bookapi/services"
	"log"
	"strings"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	services.InitDatabase()

	var rentals []models.Rental
	services.DB.Where("is_returned = ? AND status = ?", false, true).Find(&rentals)

	for _, rental := range rentals {
		log.Printf("Rental %d for Book %v Note %v Desc: %s", rental.ID, rental.BookID, rental.NotesID, rental.Description)
		
		// extract slot from description e.g. "Requested for B2 lease."
		slot := ""
		if strings.HasPrefix(rental.Description, "Requested for ") && strings.HasSuffix(rental.Description, " lease.") {
			slot = strings.TrimSuffix(strings.TrimPrefix(rental.Description, "Requested for "), " lease.")
		}
		
		if slot != "" {
			rental.Slot = slot
			services.DB.Save(&rental)
			
			if rental.BookID != nil {
				var book models.Book
				if err := services.DB.First(&book, *rental.BookID).Error; err == nil {
					if book.RentedSlots == "" {
						book.RentedSlots = slot
					} else if !strings.Contains(book.RentedSlots, slot) {
						book.RentedSlots += ", " + slot
					}
					
					allSlots := strings.Split(book.Slot, ",")
					rentedSlots := strings.Split(book.RentedSlots, ",")
					var validRented []string
					for _, s := range rentedSlots {
						if strings.TrimSpace(s) != "" {
							validRented = append(validRented, strings.TrimSpace(s))
						}
					}
					book.Available = len(validRented) < len(allSlots)
					services.DB.Save(&book)
					log.Printf("Updated Book %d RentedSlots to %s", book.ID, book.RentedSlots)
				}
			} else if rental.NotesID != nil {
				var note models.Note
				if err := services.DB.First(&note, *rental.NotesID).Error; err == nil {
					if note.RentedSlots == "" {
						note.RentedSlots = slot
					} else if !strings.Contains(note.RentedSlots, slot) {
						note.RentedSlots += ", " + slot
					}
					
					allSlots := strings.Split(note.Slot, ",")
					rentedSlots := strings.Split(note.RentedSlots, ",")
					var validRented []string
					for _, s := range rentedSlots {
						if strings.TrimSpace(s) != "" {
							validRented = append(validRented, strings.TrimSpace(s))
						}
					}
					note.Available = len(validRented) < len(allSlots)
					services.DB.Save(&note)
					log.Printf("Updated Note %d RentedSlots to %s", note.ID, note.RentedSlots)
				}
			}
		}
	}
}
