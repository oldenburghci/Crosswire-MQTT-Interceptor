package test

import (
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/user-management/serverlib/db"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/user-management/serverlib/types"
	"testing"
)

var AuthProvider types.RBACModelPersistenceProvider

func init() {

	config := make(map[string]string)
	config["DB_HOST"] = gateway.GetFromEnvironment("DB_HOST")
	config["DB_PORT"] = gateway.GetFromEnvironment("DB_PORT")
	config["DB_USER"] = gateway.GetFromEnvironment("DB_USER")
	config["DB_PASSWD"] = gateway.GetFromEnvironment("DB_PASSWD")
	config["HOST"] = gateway.GetFromEnvironment("HOST")
	config["PORT"] = gateway.GetFromEnvironment("PORT")
	config["PASSWD_SALT"] = gateway.GetFromEnvironment("PASSWD_SALT")

	provider, err := db.NewPostgresAuthController(config)
	if err != nil {
		panic(err)
	}
	AuthProvider = provider
}

func TestPostgresAuthController_GetUserByID(t *testing.T) {
	_, err := AuthProvider.GetUserByID(2)
	if err != nil {
		t.Errorf("There should be a user with id 2. Test failed.")
		t.FailNow()
	}
	//fmt.Printf("uid=2, user=%+v\n", user0)

	_, err = AuthProvider.GetUserByID(1000)
	if err == nil {
		t.Errorf("There should be no user with id 1000. Test failed.")
		t.FailNow()
	}
	//fmt.Printf("uid=3, user=%+v\n", user1)
}
