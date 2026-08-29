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

	var notes []models.Note
	services.DB.Find(&notes)
	for _, note := range notes {
		allSlots := strings.Split(note.Slot, ",")
		rentedSlots := strings.Split(note.RentedSlots, ",")
		var validRented []string
		for _, s := range rentedSlots {
			if strings.TrimSpace(s) != "" {
				validRented = append(validRented, strings.TrimSpace(s))
			}
		}
		
		if len(validRented) < len(allSlots) || note.Slot == "" {
			note.Available = true
		} else {
			note.Available = false
		}
		services.DB.Save(&note)
		log.Printf("Updated Note %d: %s -> Available: %v", note.ID, note.Title, note.Available)
	}
}
