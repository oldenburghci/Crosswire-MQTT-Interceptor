package serverlib

import (
	"fmt"
	"github.com/casbin/casbin/v2"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/db"
	"testing"
)

var AUTH_ENFORCER_TEST *casbin.Enforcer

func init() {
	fmt.Println("init")
	authModel, err := db.NewPostgresAuthController(gateway.GetDatabaseEnvironment(gateway.NewGatewayConfig()))
	if err != nil {
		panic(err)
	}

	enforcer, err := casbin.NewEnforcer("../config/abac_model.conf", authModel.GetCasbinAdapter())
	if err != nil {
		panic(err)
	}
	enforcer.EnableAcceptJsonRequest(true)
	// load
	if err := enforcer.LoadPolicy(); err != nil {
		panic(err)
	}

	enforcer.AddPolicy(
		"r.obj.Shared == true && r.attribute == r.obj.ConfigurationSharedWith", "/configuration/*", "(read)|(write)", "allow",
	)
	enforcer.AddPolicy(
		"r.sub.User == r.obj.Owner", "/configuration/*", "(read)|(write)", "allow",
	)
	AUTH_ENFORCER_TEST = enforcer
}

type Subject struct {
	User string `json:"user"`
}

type Object struct {
	Owner      string `json:"owner"`
	Shared     bool   `json:"shared"`
	SharedWith int    `json:"shared_with"`
}

func TestEnforcer(t *testing.T) {
	subj0 := Subject{
		User: "me",
	}
	obj0 := Object{
		Owner:      "me",
		Shared:     false,
		SharedWith: -1,
	}

	subj1 := Subject{
		User: "you",
	}
	obj1 := Object{
		Owner:      "me",
		Shared:     false,
		SharedWith: -1,
	}

	obj2 := Object{
		Owner:      "you",
		Shared:     true,
		SharedWith: 1,
	}

	subjects := []Subject{subj0, subj1, subj1, subj0}
	objects := []Object{obj0, obj1, obj2, obj2}
	shouldPass := []bool{true, false, true, false}
	attributes := []int{-1, -1, 1, 0}

	for i := 0; i < len(subjects); i++ {
		subj := subjects[i]
		obj := objects[i]
		pass := shouldPass[i]
		attribute := attributes[i]
		fmt.Printf("check subj: %+v, obj: %+v attribute: %+v\n", subj, obj, attribute)
		// sub, obj, attribute, res, act
		ok, err := AUTH_ENFORCER_TEST.Enforce(subj, obj, attribute, "/configuration/1", "read")
		if err != nil {
			t.Fatal(err)
		}
		if ok != pass {
			t.Fail()
		}
		fmt.Printf("enforced=%v, supposed=%v\n---\n", ok, pass)
	}

}
