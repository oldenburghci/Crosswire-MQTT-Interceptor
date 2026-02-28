package auth

import (
	"github.com/casbin/casbin/v2"
	gormadapter "github.com/casbin/gorm-adapter/v3"
)

type AccessControlEnforcer struct {
	RBACEnforcer *casbin.Enforcer
	ABACEnforcer *casbin.Enforcer
}

func NewAccessControlEnforcer(adapter *gormadapter.Adapter) (*AccessControlEnforcer, error) {

	result := &AccessControlEnforcer{}

	rbac, err := result.initRBAC(adapter)
	if err != nil {
		return nil, err
	}

	abac, err := result.initABAC(adapter)
	if err != nil {
		return nil, err
	}

	result.RBACEnforcer = rbac
	result.ABACEnforcer = abac

	return result, nil
}

func (*AccessControlEnforcer) initRBAC(adapter *gormadapter.Adapter) (*casbin.Enforcer, error) {
	enforcer, err := casbin.NewEnforcer("config/rbac_model.conf", adapter)
	if err != nil {
		return nil, err
	}
	err = enforcer.LoadFilteredPolicy(&gormadapter.Filter{V3: []string{"allow", "deny"}})
	if err != nil {
		return nil, err
	}
	_, err = enforcer.AddPolicy(
		"operator", "/middleware/api/*", "(GET)|(POST)|(PUT)|(DELETE)", "allow",
	)
	if err != nil {
		return nil, err
	}
	_, err = enforcer.AddPolicy(
		"external", "/middleware/api/*", "GET", "allow",
	)
	if err != nil {
		return nil, err
	}
	_, err = enforcer.AddPolicy(
		"admin", "/admin/*", "(GET)|(POST)|(PUT)|(DELETE)", "allow",
	)
	if err != nil {
		return nil, err
	}
	if err := enforcer.LoadPolicy(); err != nil {
		return nil, err
	}
	return enforcer, nil
}

func (*AccessControlEnforcer) initABAC(adapter *gormadapter.Adapter) (*casbin.Enforcer, error) {
	enforcer, err := casbin.NewEnforcer("config/abac_model.conf", adapter)
	if err != nil {
		return nil, err
	}

	enforcer.EnableAcceptJsonRequest(true)

	if err := enforcer.LoadFilteredPolicy(&gormadapter.Filter{V3: []string{"/"}}); err != nil {
		return nil, err
	}
	// A request to the enforcer is a 5-tuple (sub, obj, attribute, res, act) and
	//  a policy is a 4-tuple (sub_rule, res, act, eft)
	// This rule ensures that a shared object can be shared with a user that is mentioned in the sharedWith attribute
	// see the configuration
	_, err = enforcer.AddPolicy(
		"r.obj.Shared == true && r.attribute == r.obj.SharedWith", "(GET)|(POST)|(PUT)|(DELETE)", "allow", "/",
	)
	_, err = enforcer.AddPolicy(
		"r.sub.UserID == r.obj.OwnerID", "(GET)|(POST)|(PUT)|(DELETE)", "allow", "/",
	)
	if err != nil {
		return nil, err
	}

	return enforcer, nil
}
