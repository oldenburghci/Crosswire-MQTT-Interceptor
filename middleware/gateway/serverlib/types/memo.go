package types

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Memo struct {
	Object
	MemoItems       []MemoItem        `json:"items" gorm:"foreignKey:MemoID"`
	MemoSharedWith  []MemoSharedWith  `json:"-" gorm:"foreignKey:MemoID"`
	ObjectReference []ObjectReference `json:"referencedBy,omitempty" gorm:"foreignKey:ReferenceID"`
}

type MemoItem struct {
	gorm.Model `json:"-"`
	// A shared memo might have memo items that are created by other users.
	ResourceID  uuid.UUID `json:"itemID" gorm:"type:uuid;default:uuid_generate_v4()"`
	OwnerID     uint      `json:"-"`
	Description string    `json:"desc"`
	Checked     bool      `json:"checked"`
	MemoID      uint      `json:"-"`
}

type MemoSharedWith struct {
	gorm.Model
	UserID uint `json:"user_id"`
	MemoID uint `json:"memo_id"`
}
