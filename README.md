# 📚 BookLease Backend

A high-performance REST API backend for the **BookLease** peer-to-peer textbook, notes, and study material sharing platform. Built with **Go (Gin)**, **Supabase PostgreSQL (GORM)**, **Firebase Authentication**, and **AWS S3 Object Storage (Presigned Direct Uploads)**.

---

## 🛠 Tech Stack

- **Language:** Go 1.23+
- **Web Framework:** [Gin Web Framework](https://github.com/gin-gonic/gin)
- **ORM:** [GORM](https://gorm.io/) with PostgreSQL Driver
- **Database:** [Supabase PostgreSQL](https://supabase.com/) (with PgBouncer connection pooler)
- **Authentication:** [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) (JWT verification)
- **Object Storage:** [AWS S3](https://aws.amazon.com/s3/) / S3-compatible storage via AWS SDK for Go v2 (Presigned PUT URLs)
- **CORS:** [gin-contrib/cors](https://github.com/gin-contrib/cors)

---

## 🚀 Getting Started

### 1. Prerequisites

- [Go](https://go.dev/dl/) `1.23` or higher
- A [Supabase](https://supabase.com/) project
- A [Firebase](https://console.firebase.google.com/) project with Google Authentication enabled
- An [AWS Account](https://aws.amazon.com/) with an S3 Bucket (or Cloudflare R2 / MinIO)

---

### 2. Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rs0125/booklease-backend.git
   cd booklease-backend
   ```

2. **Install Go dependencies:**
   ```bash
   go mod download
   ```

---

### 3. Configuration

#### A. Environment Variables (`.env`)
Create a `.env` file in the `booklease-backend/` root directory (see [`.env.example`](.env.example)):

```env
# Database connection string (use Supabase connection pooler for IPv4 compatibility)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"

# Server port (defaults to 8080)
PORT=8080

# Allowed email domains for login (comma-separated, or * for all domains)
ALLOWED_EMAIL_DOMAINS=vitstudent.ac.in

# Path to Firebase Admin SDK service account key
FIREBASE_CREDENTIALS_PATH=firebase-service-account.json

# Additional CORS allowed origins
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# AWS S3 Storage (for book covers & note PDFs)
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=booklease-storage-2026
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

#### B. Firebase Service Account Key
1. Go to your [Firebase Console](https://console.firebase.google.com/) > **Project Settings** > **Service accounts**.
2. Click **Generate new private key**.
3. Save the downloaded `.json` file as `firebase-service-account.json` in `booklease-backend/`.

#### C. AWS S3 Bucket Setup & CORS
In your AWS S3 Console, configure CORS on your bucket under **Permissions > Cross-origin resource sharing (CORS)**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

### 4. Running the Server

Start the backend server:
```bash
go run main.go
```

The server will initialize the database schema automatically via GORM `AutoMigrate` and start listening on `http://localhost:8080`.

---

## 📡 API Endpoints

### 🔐 Authentication & System

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Serves the web testing client / static page |
| `GET` | `/api/hello` | **Protected** | Verifies token & returns authentication status |
| `GET` | `/api/FAQ` | Public | List Frequently Asked Questions |
| `POST` | `/api/upload/presigned-url` | **Protected** | Generate S3 presigned PUT URL for direct file uploads |

---

### 👤 User Profile (`/user`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/user/signup` | **Protected** | Creates or fetches user profile from Firebase JWT |
| `GET` | `/user/` | **Protected** | Get user profile (username, phone, reg no, admin) |
| `POST` | `/user/phone` | **Protected** | Update user phone number |

---

### 📖 Books & Wishlists (`/book`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/book/` | Public | List all books (supports `?search=`, `?category=`, `?limit=`, `?offset=`) |
| `GET` | `/book/:id` | Public | Get details of a single book |
| `GET` | `/book/mybooks` | **Protected** | List books uploaded by authenticated user |
| `POST` | `/book/` | **Protected** | Create a new book listing |
| `DELETE` | `/book/:id` | **Protected** | Delete a book (uploader or admin only) |
| `POST` | `/book/:id/wishlist` | **Protected** | Add book to user wishlist |
| `GET` | `/book/wishlist` | **Protected** | Get authenticated user's wishlist |

---

### 📝 Notes & Study Materials (`/notes`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/notes/` | Public | List all public study notes |
| `GET` | `/notes/:id` | Public | Get single note by ID |
| `POST` | `/notes/` | **Protected** | Upload/create study material note |
| `DELETE` | `/notes/:id` | **Protected** | Delete note (uploader or admin only) |

---

### 🤝 Rentals (`/rentals`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/rentals/` | **Protected** | Request to rent a book |
| `GET` | `/rentals/` | **Protected** | List all rentals for current user (or all if admin) |
| `GET` | `/rentals/lent` | **Protected** | List materials the user has lent out |
| `GET` | `/rentals/borrowed` | **Protected** | List materials the user has borrowed |
| `POST` | `/rentals/:id/decision` | **Protected** | Accept (`{"accept": true}`) or reject rental request |
| `DELETE` | `/rentals/delete/:id` | **Protected** | Cancel or delete rental request |
| `PATCH` | `/rentals/:id/return` | **Protected** | Mark rental as returned & restore book availability |

---

### 🔔 Notifications (`/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications/` | **Protected** | Get user notifications (rental requests, updates) |
| `PATCH` | `/notifications/:id/seen` | **Protected** | Mark notification as read |
| `DELETE` | `/notifications/:id` | **Protected** | Delete a single notification |
| `DELETE` | `/notifications/` | **Protected** | Clear all user notifications |

---

## 🧪 Testing with Postman

1. Import [**`BookLease_API.postman_collection.json`**](BookLease_API.postman_collection.json) into Postman.
2. Sign in at `http://localhost:8080` and copy your Firebase ID token.
3. Paste the token into the `firebaseToken` collection variable.
4. Execute any of the organized requests across all modules.
