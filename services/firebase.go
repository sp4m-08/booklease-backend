package services

import (
	"context"
	"log"
	"os"

	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

var App *firebase.App

func InitFirebase() {
	var opt option.ClientOption

	// 1. Check if raw JSON credentials are provided via environment variable (Ideal for cloud deployment like Render)
	if jsonCreds := os.Getenv("FIREBASE_SERVICE_ACCOUNT_JSON"); jsonCreds != "" {
		opt = option.WithCredentialsJSON([]byte(jsonCreds))
	} else {
		// 2. Fall back to local file path
		credPath := os.Getenv("FIREBASE_CREDENTIALS_PATH")
		if credPath == "" {
			credPath = "firebase-service-account.json"
		}
		opt = option.WithCredentialsFile(credPath)
	}

	var err error
	App, err = firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Fatalf("❌ Firebase init error: %v", err)
	}
	log.Println("✅ Firebase initialized successfully")
}
