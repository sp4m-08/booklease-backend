# BookLease Backend — Updated Code Review (v2.0)

## Executive Summary

This code review assesses the current state of the `booklease-backend` Go repository following the recent refactoring, dependency updates, and Supabase integration. 

The previous version of the codebase contained numerous dead handlers, unhandled nil-pointer crashes, and invalid query lookups. While the codebase is now substantially cleaner and builds successfully, there are critical **security gaps** (e.g., unauthenticated write/delete routes), **missing production configs** (CORS, dynamic ports), and **architectural cleanup** required before feature expansion.

---

## 📊 Findings Overview

| Category | Count | Primary Impact |
| :--- | :---: | :--- |
| 🔴 **Critical / Security** | 5 | Data loss, unauthorized access, CORS failure |
| 🟠 **Bugs & Operational** | 4 | Port binding on cloud providers, credential path flexibility |
| 🟡 **Architecture & Data Model** | 6 | Orphaned schemas, model file structure, missing foreign keys |
| 🔵 **Code Quality & Best Practices** | 4 | Gin proxy warnings, input validation tags, error propagation |

---

## 🔴 Critical & Security Issues

### 1. Unauthenticated Mutation Endpoints (`POST /book/` and `DELETE /book/:id`)
* **File:** [`routes/routes.go:17-24`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/routes/routes.go#L17-L24)
* **Risk:** High (Public Data Tampering / Deletion)
* **Detail:** `middleware.RequireAuth(app)` is only mounted on `/api/hello`. The entire `/book` group is completely public:
  ```go
  BookRoutes := r.Group("/book")
  {
      BookRoutes.GET("/", api.GetBooks)
      BookRoutes.GET("/:id", api.GetBook)
      BookRoutes.DELETE("/:id", api.DeleteBook) // ❌ Anyone can delete any book
      BookRoutes.POST("/", api.CreateBook)      // ❌ Anyone can add arbitrary books
  }
  ```
* **Remediation:** Apply `middleware.RequireAuth(app)` to `POST` and `DELETE` routes:
  ```go
  BookRoutes.GET("/", api.GetBooks)
  BookRoutes.GET("/:id", api.GetBook)
  
  protected := BookRoutes.Group("", middleware.RequireAuth(app))
  {
      protected.POST("/", api.CreateBook)
      protected.DELETE("/:id", api.DeleteBook)
  }
  ```

---

### 2. Missing Ownership Verification on Book Deletion
* **File:** [`api/books.go:51-64`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/api/books.go#L51-L64)
* **Risk:** High (Insecure Direct Object Reference - IDOR)
* **Detail:** `DeleteBook` simply takes an `id` from the URL and deletes the record from Supabase without verifying if the requesting user uploaded the book or is an administrator.
* **Remediation:** Add `UploadedBy uint` (or `OwnerEmail string`) to `models.Book` and check user ownership before deleting.

---

### 3. No CORS Middleware Configured
* **File:** [`main.go:15`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/main.go#L15)
* **Risk:** Medium (Frontend-to-Backend Connection Blocked)
* **Detail:** The Gin router does not have CORS middleware attached. When your React/Vite/Next.js frontend running on `http://localhost:3000` or `http://localhost:5173` attempts to call `http://localhost:8080`, browsers will block the request with a CORS policy error.
* **Remediation:** Add `github.com/gin-contrib/cors`:
  ```go
  r.Use(cors.New(cors.Config{
      AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
      AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
      AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
      AllowCredentials: true,
  }))
  ```

---

### 4. Hardcoded Organization Domain Check in Auth Middleware
* **File:** [`middleware/auth.go:35`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/middleware/auth.go#L35)
* **Risk:** Medium (Fragile authorization)
* **Detail:** `strings.HasSuffix(email, "@vitstudent.ac.in")` is hardcoded in the handler. If faculty, admins, or external reviewers need access, the backend rejects them with `403 Forbidden`.
* **Remediation:** Make allowed domains configurable via environment variable (e.g., `ALLOWED_EMAIL_DOMAINS="vitstudent.ac.in,vit.ac.in"`).

---

### 5. Plaintext Service Account Files in Repository Directory
* **File:** [`firebase-service-account.json`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/firebase-service-account.json)
* **Risk:** High (Credential Leakage if git config slips)
* **Detail:** Private keys should ideally be passed through environment variables (e.g. `FIREBASE_CREDENTIALS_JSON` or `FIREBASE_CREDENTIALS_PATH`) rather than relying solely on local file existence.

---

## 🟠 Bugs & Operational Issues

### 6. Hardcoded Port `8080` & Unhandled `r.Run()` Error
* **File:** [`main.go:25`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/main.go#L25)
* **Detail:** `r.Run(":8080")` hardcodes the port. Cloud hosting platforms (Render, Railway, Fly.io, Cloud Run) assign dynamic ports via the `PORT` environment variable.
* **Remediation:**
  ```go
  port := os.Getenv("PORT")
  if port == "" {
      port = "8080"
  }
  if err := r.Run(":" + port); err != nil {
      log.Fatalf("❌ Server failed to start: %v", err)
  }
  ```

---

### 7. Missing Input Validation on `CreateBook`
* **File:** [`api/books.go:38-49`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/api/books.go#L38-L49), [`models/book.go:15-24`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/models/book.go#L15-L24)
* **Detail:** `models.Book` has no validation tags. Sending `{}` (empty JSON) creates a row with blank title and description.
* **Remediation:** Add struct binding tags:
  ```go
  type Book struct {
      ID          uint      `gorm:"primaryKey" json:"id"`
      Title       string    `gorm:"not null" json:"title" binding:"required"`
      Author      string    `gorm:"not null" json:"author" binding:"required"`
      Description string    `json:"description"`
      Category    string    `json:"category" binding:"required"`
      Available   bool      `gorm:"default:true" json:"available"`
      CreatedAt   time.Time `json:"created_at"`
      UpdatedAt   time.Time `json:"updated_at"`
  }
  ```

---

## 🟡 Architecture & Data Model

### 8. All Entity Models Defined in a Single File (`book.go`)
* **File:** [`models/book.go`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/models/book.go)
* **Detail:** `User`, `Book`, `Note`, `Rental`, `Wishlist`, `Admin`, and `FAQ` are all placed in `models/book.go`.
* **Remediation:** Split models into separate files under `models/`:
  - `models/user.go`
  - `models/book.go`
  - `models/note.go`
  - `models/rental.go`
  - `models/wishlist.go`
  - `models/faq.go`

---

### 9. Orphaned Models Migrated to Supabase with No Endpoints
* **File:** [`services/db.go:34-42`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/services/db.go#L34-L42)
* **Detail:** `AutoMigrate` creates tables for `Note`, `Rental`, `Wishlist`, `Admin`, and `FAQ`, but the `api/` directory currently contains no controllers or business logic for them.
* **Remediation:** Implement API handlers for rentals, wishlists, and notes, or remove them from `AutoMigrate` until ready.

---

### 10. `models.Admin` Entity is Redundant
* **File:** [`models/book.go:55-59`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/models/book.go#L55-L59)
* **Detail:** `models.User` already has an `IsAdmin bool` column. Creating a separate `admins` table with just `AdminID` creates two competing sources of truth for admin privileges.
* **Remediation:** Use `User.IsAdmin` exclusively and remove the `Admin` model.

---

### 11. No Pagination on `GetBooks`
* **File:** [`api/books.go:13-20`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/api/books.go#L13-L20)
* **Detail:** `services.DB.Find(&books)` fetches all records in a single query. As the catalog grows, this will cause memory pressure and latency.
* **Remediation:** Add `limit` and `page` query parameters with `Offset()` and `Limit()`.

---

## 🔵 Code Quality & Best Practices

| # | Item | Recommendation |
|---|------|----------------|
| 1 | **Proxy Warning in Gin** | Set `r.SetTrustedProxies(nil)` or configure trusted proxy IPs to remove Gin proxy warnings. |
| 2 | **Seed Function Unused** | [`services/seed.go`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/services/seed.go) defines `SeedData()` which is never called. Add a `--seed` CLI flag or dedicated admin route if needed. |
| 3 | **JSON Tags on Models** | Add explicit `json:"fieldname"` tags to all models to guarantee consistent lowercase JSON serialization across endpoints. |
| 4 | **Graceful Shutdown** | Use `http.Server` with `context` and signal listening (`SIGINT`, `SIGTERM`) for zero-downtime restarts. |

---

## 🎯 Recommended Next Steps

1. **Secure the routes:** Attach `middleware.RequireAuth` to `POST` and `DELETE` in [`routes/routes.go`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/routes/routes.go).
2. **Add CORS support:** Install `gin-contrib/cors` and register it in [`main.go`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/main.go).
3. **Split models:** Organize [`models/`](file:///c:/Users/rimpi/Documents/projects/booklease-2026/booklease-backend/models/) into dedicated files per domain entity with JSON and GORM validation tags.
4. **Implement User & Book Association:** Attach `UploadedBy` to books to support ownership checks.
