package types

type RBACModelPersistenceProvider interface {
	//Open() error
	//Close() error
	CreateUser(user *User) error
	GetUser(mailOrUsername string) (*User, error)
	GetUsersByUsernames(usernames []string) ([]*User, error)
	GetUserByID(userID uint) (*User, error)

	UpdateUser(user *User) error
	//TODO: Suspend and Resume User
}
