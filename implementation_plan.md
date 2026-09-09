# Backend Scalability & Zero-Latency Architecture Plan (Phase 2)

Implement production-grade backend performance optimizations for BookLease: Redis multi-layer caching, database connection pool tuning, HTTP response compression (Gzip), token-bucket rate limiting, and liveness/readiness health checks.

## User Review Required

> [!IMPORTANT]
> - **Redis Dependency**: The Go backend will connect to Redis via the existing `REDIS_URL` environment variable (default: `redis://localhost:6379` locally and `redis://redis:6379` inside Docker).
> - **Fail-Soft Graceful Fallback**: If Redis is temporarily down or unreachable, the API will automatically fall back to querying PostgreSQL directly without failing or returning 500 errors to users.

---

## Proposed Changes

### 1. Database Connection Pooling & Indexing

#### [MODIFY] [services/db.go](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/services/db.go)
- Extract underlying `*sql.DB` from GORM instance.
- Configure production connection limits:
  - `SetMaxOpenConns(50)` (prevents Postgres connection exhaustion during CAT/FAT exam traffic surges).
  - `SetMaxIdleConns(25)` (keeps pre-warmed connections ready for sub-millisecond query execution).
  - `SetConnMaxLifetime(5 * time.Minute)` (recycles stale connections smoothly).
  - `SetConnMaxIdleTime(2 * time.Minute)`.

#### [MODIFY] [models/book.go](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/models/book.go)
- Add composite GORM indexes for high-frequency filtering:
  - `Book`: index on `category`, `available`, `uploaded_by`.
  - `Note`: index on `subject`, `is_public`, `available`, `uploaded_by`.
  - `Rental`: index on `user_id`, `owner_id`, `is_returned`, `status`.

---

### 2. Redis In-Memory Caching Layer

#### [NEW] [services/redis.go](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/services/redis.go)
- Initialize go-redis client (`github.com/redis/go-redis/v9`).
- Implement safe caching helpers with JSON serialization:
  - `GetCache[T](ctx, key) (*T, error)`
  - `SetCache(ctx, key, value, ttl) error`
  - `InvalidateCache(ctx, keys...) error`
  - `InvalidatePattern(ctx, pattern) error` (e.g. `books:*`, `notes:*`)
- Include fail-soft error recovery (logs warning, returns cache-miss, does not panic).

#### [MODIFY] [api/books.go](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/api/books.go)
- `GetBooks`: Cache public listing query results with 60s TTL (`books:all:<category>:<search>:<limit>`).
- `CreateBook`, `UpdateBook`, `DeleteBook`: Invalidate `books:*` pattern on mutation.

#### [MODIFY] [api/notes.go](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/api/notes.go)
- `GetNotes`: Cache public note listings with 60s TTL (`notes:public:<category>:<search>`).
- `CreateNote`, `UpdateNote`, `DeleteNote`, `ToggleNoteUpvote`: Invalidate `notes:*` on mutation.

#### [MODIFY] [api/rentals.go](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/api/rentals.go)
- `DecideRental`, `ReturnRental`, `PostRental`: Invalidate `books:*` and `notes:*` when slot availability changes.

#### [MODIFY] [api/faq.go](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/api/faq.go)
- `GetFAQ`: Cache static FAQ list with 1-hour TTL (`faqs:all`).

---

### 3. Middleware: Compression, Rate Limiting & Health Checks

#### [NEW] [middleware/ratelimit.go](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/middleware/ratelimit.go)
- Implement sliding-window / token-bucket IP rate limiter (`golang.org/x/time/rate`).
- General API Rate Limiter: **120 requests / minute per IP** (burst: 30).
- Sensitive Endpoint Rate Limiter (`/user/signup`, `/rentals/`, `/book/upload`): **20 requests / minute per IP**.

#### [MODIFY] [main.go](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/main.go)
- Initialize `services.InitRedis()`.
- Add `gin-contrib/gzip` middleware for automated Gzip compression (payload reduction ~75%).
- Register rate limiting middleware.
- Add `/healthz` (liveness) and `/readyz` (readiness checking DB & Redis connectivity).

---

## Verification Plan

### Automated Verification
1. **Module Integrity & Build**:
   ```bash
   go mod tidy
   go build ./...
   ```
2. **Container Rebuild & Health Verification**:
   ```bash
   docker compose up --build -d
   docker compose ps
   ```

### Manual & Performance Verification
1. **Cache Latency Check**:
   - Query `http://localhost:8080/book/` (First call: DB query ~200ms; Subsequent calls: sub-5ms Redis cache hit).
   - Check response headers and Redis keys: `docker exec -it booklease_redis redis-cli KEYS "*"`
2. **Cache Invalidation Check**:
   - Create or update a book listing. Verify that `books:*` cache is cleared and subsequent fetch reflects the latest state.
3. **Fail-Soft Graceful Degradation**:
   - Stop Redis (`docker stop booklease_redis`) and verify `/book/` continues to respond without crashing (falling back to Postgres).
4. **Health Check Endpoints**:
   - `curl http://localhost:8080/healthz` $\rightarrow$ `{"status": "ok"}`
   - `curl http://localhost:8080/readyz` $\rightarrow$ `{"database": "healthy", "redis": "healthy"}`
