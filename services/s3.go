package services

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/joho/godotenv"
)

var (
	S3Client      *s3.Client
	PresignClient *s3.PresignClient
	S3Bucket      string
	S3Region      string
	S3Endpoint    string
	S3CDNUrl      string
)

// InitS3 initializes the AWS S3 client and Presign client from environment variables
func InitS3() {
	_ = godotenv.Load()
	S3Bucket = os.Getenv("AWS_S3_BUCKET")
	S3Region = os.Getenv("AWS_REGION")
	if S3Region == "" {
		S3Region = "us-east-1"
	}
	S3Endpoint = os.Getenv("AWS_S3_ENDPOINT")
	S3CDNUrl = os.Getenv("AWS_S3_CUSTOM_DOMAIN")

	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")

	if S3Bucket == "" || accessKey == "" || secretKey == "" {
		log.Println("⚠️ AWS S3 credentials not fully configured (AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY). S3 upload endpoints will be inactive until configured.")
		return
	}

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(S3Region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)
	if err != nil {
		log.Printf("❌ Failed to load AWS S3 config: %v\n", err)
		return
	}

	// Support custom endpoint (e.g. MinIO, Cloudflare R2, Supabase Storage S3)
	S3Client = s3.NewFromConfig(cfg, func(o *s3.Options) {
		if S3Endpoint != "" {
			o.BaseEndpoint = aws.String(S3Endpoint)
		}
	})

	PresignClient = s3.NewPresignClient(S3Client)
	log.Printf("✅ AWS S3 initialized successfully (Bucket: %s, Region: %s)\n", S3Bucket, S3Region)
}

// GeneratePresignedUploadURL generates a presigned PUT URL allowing clients to upload directly to S3
func GeneratePresignedUploadURL(key, contentType string, expiration time.Duration) (string, error) {
	if PresignClient == nil {
		return "", fmt.Errorf("S3 service is not initialized")
	}

	putReq, err := PresignClient.PresignPutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(S3Bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(expiration))

	if err != nil {
		return "", fmt.Errorf("failed to sign PUT request: %w", err)
	}

	return putReq.URL, nil
}

// GeneratePresignedDownloadURL generates a presigned GET URL for private files
func GeneratePresignedDownloadURL(key string, expiration time.Duration) (string, error) {
	if PresignClient == nil {
		return "", fmt.Errorf("S3 service is not initialized")
	}

	getReq, err := PresignClient.PresignGetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(S3Bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expiration))

	if err != nil {
		return "", fmt.Errorf("failed to sign GET request: %w", err)
	}

	return getReq.URL, nil
}

// GetPublicURL returns the direct public URL for a file
func GetPublicURL(key string) string {
	if S3CDNUrl != "" {
		return fmt.Sprintf("%s/%s", strings.TrimRight(S3CDNUrl, "/"), key)
	}
	if S3Endpoint != "" {
		return fmt.Sprintf("%s/%s/%s", strings.TrimRight(S3Endpoint, "/"), S3Bucket, key)
	}
	return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", S3Bucket, S3Region, key)
}

// DeleteS3Object removes an object from the S3 bucket
func DeleteS3Object(key string) error {
	if S3Client == nil {
		return fmt.Errorf("S3 service is not initialized")
	}

	_, err := S3Client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
		Bucket: aws.String(S3Bucket),
		Key:    aws.String(key),
	})
	return err
}
