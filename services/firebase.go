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
	credPath := os.Getenv("FIREBASE_CREDENTIALS_PATH")
	if credPath == "" {
		credPath = "firebase-service-account.json"
	}

	opt := option.WithCredentialsFile(credPath)
	var err error
	App, err = firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Fatalf("❌ Firebase init error: %v (looked for %s)", err, credPath)
	}
	log.Println("✅ Firebase initialized successfully")
}
