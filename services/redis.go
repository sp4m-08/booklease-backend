package services

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

// InitRedis initializes connection to Redis with graceful fallback
func InitRedis() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("⚠️ Redis URL parse warning (%s): %v. Caching disabled.\n", redisURL, err)
		RedisClient = nil
		return
	}

	client := redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("⚠️ Redis ping failed: %v. Running in fail-soft mode (DB only).\n", err)
		RedisClient = nil
		return
	}

	RedisClient = client
	log.Printf("⚡ Connected to Redis cache (%s)\n", opt.Addr)
}

// GetCache retrieves and deserializes cached JSON value into target
func GetCache(ctx context.Context, key string, target interface{}) bool {
	if RedisClient == nil {
		return false
	}

	val, err := RedisClient.Get(ctx, key).Result()
	if err != nil {
		return false // Cache miss or Redis error
	}

	if err := json.Unmarshal([]byte(val), target); err != nil {
		log.Printf("⚠️ Failed to unmarshal cache key %s: %v\n", key, err)
		return false
	}

	return true
}

// SetCache serializes and stores a key-value pair in Redis with a TTL
func SetCache(ctx context.Context, key string, value interface{}, ttl time.Duration) {
	if RedisClient == nil {
		return
	}

	data, err := json.Marshal(value)
	if err != nil {
		log.Printf("⚠️ Failed to marshal value for cache key %s: %v\n", key, err)
		return
	}

	if err := RedisClient.Set(ctx, key, data, ttl).Err(); err != nil {
		log.Printf("⚠️ Failed to set cache key %s: %v\n", key, err)
	}
}

// InvalidateCache deletes specific cache keys
func InvalidateCache(ctx context.Context, keys ...string) {
	if RedisClient == nil || len(keys) == 0 {
		return
	}

	if err := RedisClient.Del(ctx, keys...).Err(); err != nil {
		log.Printf("⚠️ Failed to invalidate cache keys %v: %v\n", keys, err)
	}
}

// InvalidatePattern deletes all keys matching a glob pattern (e.g., "books:*", "notes:*")
func InvalidatePattern(ctx context.Context, pattern string) {
	if RedisClient == nil {
		return
	}

	var cursor uint64
	for {
		keys, nextCursor, err := RedisClient.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			log.Printf("⚠️ Scan error for pattern %s: %v\n", pattern, err)
			break
		}

		if len(keys) > 0 {
			if err := RedisClient.Del(ctx, keys...).Err(); err != nil {
				log.Printf("⚠️ Failed to delete matching keys for pattern %s: %v\n", pattern, err)
			}
		}

		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}
}
