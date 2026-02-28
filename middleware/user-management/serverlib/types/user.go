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

//hook, related to gorm

// BeforeCreate hooks into gorm's preprocessing to check if the user with this email already exists.
//func (u *User) BeforeCreate(tx *gorm.DB) error {
//	fmt.Println("before create user")
//	_, ok := tx.Get(fmt.Sprintf("%d", u.ID))
//	if ok {
//		return errors.New("a user with this Email already exists. Do not insert it into the database")
//	}
//	return nil
//}
