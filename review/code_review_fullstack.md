# BookLease Full-Stack Architecture & Code Review

## Executive Summary
This document provides an end-to-end technical code review of the **BookLease** backend (Go/Gin/GORM/Supabase) and frontend (Next.js/React Query/Tailwind).

---

## 1. Backend Architecture & Route Analysis

### 🔐 Authentication & Middleware (`middleware/auth.go`)
- **Strengths:** 
  - Validates Firebase ID tokens securely with `app.Auth().VerifyIDToken`.
  - Configurable domain restrictions via `ALLOWED_EMAIL_DOMAINS` with wildcards or institutional domains (`vitstudent.ac.in`).
  - Automatically sets `uid`, `email`, and `name` into the Gin context for downstream handlers.
- **Observations:** Ensure token extraction gracefully handles case insensitivity in headers (`authorization` vs `Authorization`).

---

### 📚 Books API (`api/books.go` & `models/book.go`)

| Route | Method | Access | Function | Notes / Analysis |
|---|---|---|---|---|
| `/book/` | `GET` | Public | `GetBooks` | Supports `category`, `search`, and `limit`/`offset` pagination. Preloads `Uploader`. |
| `/book/:id` | `GET` | Public | `GetBook` | Fetches single book with `Uploader` relation. |
| `/book/mybooks` | `GET` | Protected | `MyBooks` | Fetches books where `uploaded_by == user.ID`. |
| `/book/` | `POST` | Protected | `CreateBook` | Associates `UploadedBy = user.ID` and sets `Available = true`. |
| `/book/:id` | `DELETE` | Protected | `DeleteBook` | **Enforces strict ownership:** only uploader or platform admin can delete. |
| `/book/:id/wishlist` | `POST` | Protected | `AddToWishlist` | Prevents duplicate wishlist entries using composite lookups. |
| `/book/wishlist` | `GET` | Protected | `Wishlist` | Preloads nested associations (`Book` and `Book.Uploader`). |

---

### 🤝 Rentals & Workflow API (`api/rentals.go` & `models/book.go`)

| Route | Method | Access | Function | Notes / Analysis |
|---|---|---|---|---|
| `/rentals/` | `POST` | Protected | `PostRental` | Validates that users cannot rent their own books; verifies `Available == true`. Emits in-app notification. |
| `/rentals/` | `GET` | Protected | `GetRentals` | Multi-tenant isolation: non-admins only see rentals where they are borrower or lender. |
| `/rentals/lent` | `GET` | Protected | `LentMaterials` | Returns incoming requests for books owned by user. |
| `/rentals/borrowed` | `GET` | Protected | `BorrowedMaterials` | Returns outgoing rental requests made by user. |
| `/rentals/:id/decision` | `POST` | Protected | `DecideRental` | **ACID Safe:** Uses DB transaction to update rental status and toggle `book.Available = false`. |
| `/rentals/:id/return` | `PATCH` | Protected | `ReturnRental` | **ACID Safe:** Uses DB transaction to mark `is_returned = true` and restore `book.Available = true`. |
| `/rentals/delete/:id` | `DELETE` | Protected | `DeleteRental` | Allows borrower or owner to cancel/remove rental record. |

---

### 📝 Notes & Study Material (`api/notes.go`)

| Route | Method | Access | Function | Notes / Analysis |
|---|---|---|---|---|
| `/notes/` | `GET` | Public | `GetNotes` | Returns public notes sorted newest first with `Uploader`. |
| `/notes/:id` | `GET` | Public | `GetNote` | Fetches note details and uploader contact metadata. |
| `/notes/` | `POST` | Protected | `CreateNote` | Associates uploader ID with the document record. |
| `/notes/:id` | `DELETE` | Protected | `DeleteNote` | Authorization guarded (uploader or admin only). |

---

### 🔔 Notifications & User Profile (`api/notifications.go`, `api/user.go`)

| Route | Method | Access | Function | Notes / Analysis |
|---|---|---|---|---|
| `/user/signup` | `POST` | Protected | `CreateOrFetchUser` | Auto-extracts registration numbers (e.g. `21BCE1234`) or assigns generated IDs. |
| `/user/phone` | `POST` | Protected | `UpdatePhoneNumber` | Validates 10-digit Indian phone regex (`^[6-9]\d{9}$`). |
| `/user/` | `GET` | Protected | `GetUserProfile` | Returns user details and admin privileges. |
| `/notifications/` | `GET` | Protected | `Notifications` | Returns user notifications ordered by `created_at DESC`. |
| `/notifications/:id/seen`| `PATCH` | Protected | `MarkNotificationSeen`| Toggles `seen = true`. |
| `/notifications/:id` | `DELETE` | Protected | `DeleteNotification` | Deletes individual notification record. |
| `/notifications/` | `DELETE` | Protected | `DeleteAllNotifications` | Clears all notifications for the user. |

---

### ☁️ File Upload & Storage Architecture (`api/upload.go`, `services/s3.go`)
- **Dual-Storage Engine**:
  1. **Direct AWS S3 Presigned URLs** (`POST /api/upload/presigned-url`): Zero-backend-bandwidth uploads directly from client to S3 bucket.
  2. **Direct Backend Multipart Upload** (`POST /api/upload/direct`): Fail-safe fallback that handles server-side S3 storage or local storage (`./static/uploads/`) if S3 credentials or CORS are unconfigured.

---

## 2. Frontend Architecture & Review

- **Design System:** Neo-Brutalism aesthetic with thick high-contrast borders (`border-4 border-black`), sharp drop-shadows (`shadow-neo`), and dynamic GSAP stagger animations.
- **State Management & Data Fetching:** `@tanstack/react-query` handles caching, background invalidation, and server state synchronisation.
- **Authentication Lifecycle:** Centralized `AuthContext.tsx` syncing Firebase Auth tokens with Axios request interceptors.
- **Resilience:** `<BookCover />` component with `getImageUrl` safely resolves image paths and degrades to styled cover art if files are unviewable.

---

## 3. Recommendations & Enhancements

1. **Wishlist Deletion Route:**
   - Add `DELETE /book/:id/wishlist` so users can remove saved books from their wishlist.
2. **Document Viewer Compatibility in Notes:**
   - In `frontend/src/app/notes/[id]/page.tsx`, add conditional rendering for document types (render `iframe` for `.pdf`, `<img>` for `.png`/`.jpg`, and a prominent "Download Document" button for `.doc`/`.docx`).
3. **Database Performance Indexing:**
   - When database scale grows, add `gin_trgm_ops` index on `title` and `author` columns in PostgreSQL to accelerate `LIKE '%term%'` full-text search.
