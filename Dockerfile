# =========================================================
# Stage 1: Build Go binary
# =========================================================
FROM golang:alpine AS builder

WORKDIR /app

ENV GOTOOLCHAIN=auto

# Install build dependencies & CA certificates
RUN apk add --no-cache git ca-certificates tzdata

# Cache Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build statically linked binary without debug symbols for minimal size
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server main.go

# =========================================================
# Stage 2: Minimal Production Runtime
# =========================================================
FROM alpine:3.21 AS runner

WORKDIR /app

# Install runtime SSL certs and timezone data
RUN apk add --no-cache ca-certificates tzdata

# Create non-root user for container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled binary from builder
COPY --from=builder /app/server .

# Copy static directory and service account if present
COPY --from=builder /app/static ./static
COPY --from=builder /app/firebase-service-account.json* ./

# Change file ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose default backend port
EXPOSE 8080

# Environment variables
ENV GIN_MODE=release \
    PORT=8080

# Run backend server
CMD ["./server"]
