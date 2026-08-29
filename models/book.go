package models

import "time"

type Book struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Author      string    `json:"author"`
	Subject     string    `json:"subject"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Slot        string    `json:"slot"`
	Condition   string    `json:"condition"` // E.g., Brand New, Like New, Highlighted, Torn Pages
	CoverImage  string    `json:"cover_image"`
	FilePath    string    `json:"file_path"`
	Price       float64   `gorm:"default:0" json:"price"`
	Available   bool      `gorm:"default:true" json:"available"`
	UploadedBy  uint      `gorm:"index" json:"uploaded_by"` // Foreign key (User.ID)
	Uploader    User      `gorm:"foreignKey:UploadedBy" json:"uploader,omitempty"`
	Type        string    `json:"type"`
	ValidTill   time.Time `json:"valid_till"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Rental struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"not null;index" json:"user_id"`
	User        User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	BookID      *uint     `gorm:"index" json:"book_id,omitempty"`
	Book        Book      `gorm:"foreignKey:BookID" json:"book,omitempty"`
	NotesID     *uint     `gorm:"index" json:"notes_id,omitempty"`
	OwnerID     *uint     `gorm:"index" json:"owner_id,omitempty"`
	Description string    `json:"description"`
	RentedFrom  time.Time `json:"rented_from"`
	DueDate     time.Time `json:"due_date"`
	IsReturned  bool      `gorm:"default:false" json:"is_returned"`
	Status      *bool     `json:"status"` // nil = pending, true = accepted, false = rejected
}

type Wishlist struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	BookID    uint      `gorm:"not null;index" json:"book_id"`
	Book      Book      `gorm:"foreignKey:BookID" json:"book,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type BookWaitlist struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	BookID    uint      `gorm:"not null;index" json:"book_id"`
	Book      Book      `gorm:"foreignKey:BookID" json:"book,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type Note struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Subject     string    `json:"subject"`
	Slot        string    `json:"slot"`
	Condition   string    `json:"condition"`
	Description string    `json:"description"`
	FilePath    string    `json:"file_path"`
	Price       float64   `gorm:"default:0" json:"price"`
	Available   bool      `gorm:"default:true" json:"available"`
	IsPublic    bool      `gorm:"default:true" json:"is_public"`
	Upvotes     uint      `gorm:"default:0" json:"upvotes"`
	IsUpvoted   bool      `gorm:"-" json:"is_upvoted"`
	UploadedBy  uint      `gorm:"index" json:"uploaded_by"`
	Uploader    User      `gorm:"foreignKey:UploadedBy" json:"uploader,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type NoteUpvote struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	NoteID    uint      `gorm:"not null;index" json:"note_id"`
	CreatedAt time.Time `json:"created_at"`
}

type NoteWaitlist struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	NoteID    uint      `gorm:"not null;index" json:"note_id"`
	Note      Note      `gorm:"foreignKey:NoteID" json:"note,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
