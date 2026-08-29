package main
import (
	"bookapi/models"
	"bookapi/services"
	"log"
	"github.com/joho/godotenv"
)
func main() {
	godotenv.Load()
	services.InitDatabase()
	var rentals []models.Rental
	services.DB.Find(&rentals)
	for _, rental := range rentals {
		status := "null"
		if rental.Status != nil {
			if *rental.Status { status = "true" } else { status = "false" }
		}
		log.Printf("Rental %d: Desc: '%s' Status: %s Returned: %v", rental.ID, rental.Description, status, rental.IsReturned)
	}
}
