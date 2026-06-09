package db

import (
	"fmt"
	gormadapter "github.com/casbin/gorm-adapter/v3"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/utils"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/user-management/serverlib/types"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"os"
)

type PostgresAuthController struct {
	dbConnection *gorm.DB
	gormAdapter  *gormadapter.Adapter
	config       map[string]string
}

// NewPostgresAuthController creates a new AuthController for a postgresql database. The required credentials must be
// set through environment variables
func NewPostgresAuthController(config map[string]string) (*PostgresAuthController, error) {
	controller := &PostgresAuthController{}
	controller.config = config
	err := controller.createDatabase()
	if err != nil {
		panic(err)
	}
	dsn := fmt.Sprintf(
		"host=%s port=%s dbname=rbac-model user=%s password=%s sslmode=disable TimeZone=Europe/Berlin",
		controller.config["DB_HOST"],
		controller.config["DB_PORT"],
		controller.config["DB_USER"],
		controller.config["DB_PASSWD"],
	)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	controller.dbConnection = db

	err = controller.dbConnection.AutoMigrate(
		&types.User{},
		&types.Role{},
	)
	if err != nil {
		return nil, err
	}

	gormAdapter, err := gormadapter.NewAdapterByDB(controller.dbConnection)
	if err != nil {
		return nil, err
	}
	controller.gormAdapter = gormAdapter

	return controller, nil
}

// createDatabase creates the required database if it is not available
func (c *PostgresAuthController) createDatabase() error {
	//initial check
	db, err := gorm.Open(
		postgres.Open(
			fmt.Sprintf(
				"host=%s port=%s dbname=rbac-model user=%s password=%s sslmode=disable TimeZone=Europe/Berlin",
				c.config["DB_HOST"],
				c.config["DB_PORT"],
				c.config["DB_USER"],
				c.config["DB_PASSWD"],
			),
		),
		&gorm.Config{},
	)
	if err == nil {
		fmt.Printf("database rbac-model already exists.\n")
		return nil
	}
	fmt.Printf("database rbac-model does not exist, create it now.\n")
	db, err = gorm.Open(
		postgres.Open(
			fmt.Sprintf(
				"host=%s port=%s dbname=postgres user=%s password=%s sslmode=disable TimeZone=Europe/Berlin",
				c.config["DB_HOST"],
				c.config["DB_PORT"],
				c.config["DB_USER"],
				c.config["DB_PASSWD"],
			),
		),
		&gorm.Config{},
	)
	if err != nil {
		return err
	}
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	createCmd := fmt.Sprintf("CREATE DATABASE \"%s\"", "rbac-model")
	err = db.Exec(createCmd).Error
	if err != nil {
		return err
	}

	err = sqlDB.Close()
	if err != nil {
		return err
	}

	return nil
}

func (c *PostgresAuthController) CreateUser(user *types.User) error {
	// no salt required for bcrypt package (they have one included)
	passwd := user.Password + os.Getenv("PASSWD_SALT")
	utils.HashPassword(&passwd)
	user.Password = passwd
	//initialize a new user if there is nobody in the database with the same email
	result := c.dbConnection.FirstOrCreate(&user, types.User{Email: user.Email})
	if result.Error != nil {
		return result.Error
	}

	return nil
}

// GetUser retrieves a user from the database by the given identifier. Username and email can be used to query the user.
func (c *PostgresAuthController) GetUser(mailOrUsername string) (*types.User, error) {
	//empty user. Populated through First()
	result := &types.User{}
	query := c.dbConnection.Preload("Role").First(&result, "email = ? OR username = ? ", mailOrUsername, mailOrUsername)
	if query.Error != nil {
		return nil, query.Error
	}
	return result, nil
}

func (c *PostgresAuthController) GetUsersByUsernames(usernames []string) ([]*types.User, error) {
	collector := make([]*types.User, 0)
	query := c.dbConnection.Where("username IN ?", usernames).Find(&collector)
	if query.Error != nil {
		return nil, query.Error
	}

	return collector, nil
}

func (c *PostgresAuthController) GetUserByID(userID uint) (*types.User, error) {
	user := &types.User{}
	query := c.dbConnection.Preload("Role").First(&user, "id = ?", userID)
	if query.Error != nil {
		return nil, query.Error
	}
	return user, nil
}

func (c *PostgresAuthController) GetCasbinAdapter() *gormadapter.Adapter {
	return c.gormAdapter
}

func (c *PostgresAuthController) UpdateUser(user *types.User) error {
	query := c.dbConnection.Session(&gorm.Session{FullSaveAssociations: true}).Save(user)
	if query.Error != nil {
		return query.Error
	}

	return nil
}

func (c *PostgresAuthController) SuspendUser(user *types.User) error {
	//TODO: implement me!
	panic("not implemented")
}

func (c *PostgresAuthController) ResumeUser(user *types.User) error {
	//TODO: implement me!
	panic("not implemented")
}

func (p *PostgresAuthController) InitializeDatabaseExtension() error {
	result := p.dbConnection.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
	if result.Error != nil {
		return result.Error
	}
	return nil
}
