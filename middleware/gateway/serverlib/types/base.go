package types

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Object struct {
	gorm.Model `json:"-"`
	// Add CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; to postgres before
	// annotate ResourceID to 'unique' to allow updates without inserts
	ResourceID uuid.UUID `json:"key" gorm:"type:uuid;default:uuid_generate_v4()"`
	OwnerID    uint      `json:"-"`
	Shared     bool      `json:"shared"`
}

type ObjectReference struct {
	gorm.Model  `json:"-"`
	ReferenceID uint      `json:"-"`
	ResourceID  uuid.UUID `json:"resourceKey" gorm:"type:uuid;default:uuid_generate_v4()"`
}
