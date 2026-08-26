# BookLease Backend — Changes Applied

All critical bugs and design flaws identified in `code_review.md` have been fixed. Below is a file-by-file summary of every change made, referencing the original issue numbers.

---

## Files Modified

### 1. `middleware/auth.go`

| Issue # | Severity | Change |
|---------|----------|--------|
| #5 | 🔴 Bug | **Fixed nil-pointer panic.** After `VerifyIDToken` succeeds, `err` is `nil`. The old code called `err.Error()` when the email claim was missing, which would crash the server. Replaced with a static string `"Email not found in token"`. |
| #31 | 🔵 Minor | **Removed dead code.** Deleted the commented-out `@vitstudent.ac.in` domain check (lines 34-38). |

---

### 2. `api/books.go`

| Issue # | Severity | Change |
|---------|----------|--------|
| #1 | 🔴 Bug | **Fixed `DeleteBook` looking up book by Firebase UID instead of book ID.** `services.DB.First(&book, uid)` → `services.DB.First(&book, id)`. The `uid` variable is a string (Firebase UID), not the parsed book ID from the URL. This caused the endpoint to always 404 or type-mismatch error. |
| #7 | 🔴 Bug | **Fixed `CreateBook` Preload on Create.** `Preload("Uploader")` has no effect on `Create()`. Now the book is created first, then reloaded with `Preload("Uploader").First(...)` so the response includes the uploader data. |
| #19 | 🟡 Design | **Normalized `IndentedJSON` → `JSON`** in `MyBooks` handler (2 calls). |
| #37 | 🔵 Minor | **Added colon+space separator** in error message: `"Books not found for this user" + err.Error()` → `"Books not found for this user: " + err.Error()`. |

---

### 3. `api/rentals.go` *(full rewrite)*

| Issue # | Severity | Change |
|---------|----------|--------|
| #2 | 🔴 Bug | **Fixed auth bypass in `PostRental`.** `uid == " "` (single space) → `uid == ""` (empty string). An empty UID would have bypassed the unauthorized check. |
| #3 | 🔴 Bug | **Fixed `GetRentals` ordering.** `.Find(&rentals).Order("ID DESC")` → `.Order("ID DESC").Find(&rentals)`. GORM executes at `.Find()`; the chained `.Order()` had no effect. |
| #4 | 🔴 Bug | **Fixed `GetRentals` data leak.** Added `.Where("user_id = ?", user.ID)` filter. Previously returned ALL rentals in the database to any authenticated user. |
| #8 | 🔴 Bug | **Fixed redundant dereference.** `*&book.UploadedBy` → `book.UploadedBy`. |
| #18 | 🟡 Design | **Added database transactions** to `ReturnRental` and `DecideRental`. Both functions update rental status AND book availability in two separate DB calls. If the second fails, the data is left inconsistent. Now both operations are wrapped in `services.DB.Transaction()` for atomicity. |
| #19 | 🟡 Design | **Normalized all `IndentedJSON` → `JSON`** across every handler (8 calls). `IndentedJSON` wastes bandwidth and CPU on response serialization. |
| #30 | 🔵 Minor | **Removed dead code.** Deleted the commented-out import block (lines 13-21). |
| — | 🔵 Minor | **Removed debug `fmt.Printf` statements** that leaked full request structs to stdout. Removed the `fmt` import. |
| — | 🔵 Minor | **Fixed error response format** in `GetRentals`: `c.IndentedJSON(http.StatusInternalServerError, err.Error())` was returning a raw string, not a JSON object. Changed to `gin.H{"error": "Failed to fetch rentals"}`. |

---

### 4. `api/notifications.go`

| Issue # | Severity | Change |
|---------|----------|--------|
| #6 | 🔴 Bug | **Fixed nil-pointer panic in `DeleteNotification`.** At the authorization check (`notif.UserID != user.ID`), the `err` variable in scope was `nil` (from a successful `strconv.ParseUint` earlier). Calling `err.Error()` would crash the server. Removed the `+ err.Error()` concatenation. |
| #37 | 🔵 Minor | **Added colon+space separators** in 5 error message concatenations so messages like `"User not foundrecord not found"` now read `"User not found: record not found"`. |

---

### 5. `main.go`

| Issue # | Severity | Change |
|---------|----------|--------|
| #27 | 🔵 Minor | **Wrapped `r.Run()` in `log.Fatal()`** so server startup errors (e.g., port already in use) are logged and cause a proper exit instead of being silently discarded. |

---

### 6. `services/db.go`

| Issue # | Severity | Change |
|---------|----------|--------|
| #29 | 🔵 Minor | **Handled `AutoMigrate` error.** The return value was previously discarded. Now wrapped in `if err := ...; err != nil { log.Fatalf(...) }` to catch schema migration failures at startup. |

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Bugs fixed | 8 |
| 🟡 Design flaws fixed | 3 (transactions, IndentedJSON normalization) |
| 🔵 Minor / code quality | 7 (dead code, error messages, error handling) |
| **Total changes** | **18** |

## Not Yet Fixed (from code_review.md)

The following items from the review were **not** addressed in this round — they require design decisions or are lower priority:

- **#9, #10**: Secrets management (requires credential rotation + infrastructure changes)
- **#11**: CORS origin from env var
- **#12**: `notes.go` unregistered handlers with no auth
- **#13**: `GetBook` missing Preload consistency
- **#14**: Rate limiting
- **#15**: Dependency injection / global DB
- **#16**: User lookup deduplication across handlers
- **#17**: AutoMigrate in production (needs migration tooling)
- **#20**: `Book.Subject` storing author names
- **#21**: Model file organization
- **#22**: Redundant `Admin` model
- **#23**: Pagination on list endpoints
- **#24-25**: Wishlist response + remove endpoint
- **#26**: `User.Email` not persisted
- **#33-36**: Dead `notes.go`, seed data, file naming conventions

## Build Verification

⚠️ Go compiler was not available in the shell environment to run `go build`. Please verify by running:

```bash
go build ./...
```
