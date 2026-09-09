package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// ipVisitor tracks the rate limiter and the last time an IP was seen
type ipVisitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// IPRateLimiter manages per-IP rate limiters and cleans up inactive visitors
type IPRateLimiter struct {
	visitors map[string]*ipVisitor
	mu       sync.RWMutex
	rate     rate.Limit
	burst    int
}

// NewIPRateLimiter creates a new rate limiter manager with automatic cleanup
func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
	limiter := &IPRateLimiter{
		visitors: make(map[string]*ipVisitor),
		rate:     r,
		burst:    b,
	}

	// Periodically remove stale IP entries every 3 minutes
	go limiter.cleanupVisitors()

	return limiter
}

func (i *IPRateLimiter) getVisitor(ip string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()

	v, exists := i.visitors[ip]
	if !exists {
		limiter := rate.NewLimiter(i.rate, i.burst)
		i.visitors[ip] = &ipVisitor{limiter: limiter, lastSeen: time.Now()}
		return limiter
	}

	v.lastSeen = time.Now()
	return v.limiter
}

func (i *IPRateLimiter) cleanupVisitors() {
	for {
		time.Sleep(3 * time.Minute)
		i.mu.Lock()
		for ip, v := range i.visitors {
			if time.Since(v.lastSeen) > 5*time.Minute {
				delete(i.visitors, ip)
			}
		}
		i.mu.Unlock()
	}
}

// RateLimitMiddleware creates a Gin middleware enforcing the specified rate limit per IP
func RateLimitMiddleware(requestsPerMinute float64, burst int) gin.HandlerFunc {
	limiter := NewIPRateLimiter(rate.Limit(requestsPerMinute/60.0), burst)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		if !limiter.getVisitor(ip).Allow() {
			c.Header("Retry-After", "10")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "Too Many Requests",
				"message": "Rate limit exceeded. Please slow down and try again shortly.",
			})
			return
		}
		c.Next()
	}
}
