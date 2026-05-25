package types

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username  string `json:"username" binding:"required,min=3" gorm:"unique"`
	Password  string `json:"password" binding:"required,min=8,max=48"`
	Email     string `json:"email" gorm:"unique"`
	Role      Role   `json:"-" gorm:"foreignKey:UserID"`
	Suspended bool   `json:"-" gorm:"default:false"`
}

type Role struct {
	gorm.Model
	RoleName string `json:"role_name"`
	UserID   uint   `json:"user_id"`
}
