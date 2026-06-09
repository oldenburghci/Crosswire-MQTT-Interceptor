package db

import (
	"encoding/json"
	"fmt"
	"github.com/google/uuid"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/types"
	"gorm.io/datatypes"

	//"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/types"
	"testing"
)

var modelProvider2 *PostgresModelProvider
var guid string

func init() {
	provider, err := NewPostgresModelProvider(gateway.GetDatabaseEnvironment(gateway.NewGatewayConfig()))
	if err != nil {
		panic(err)
	}
	modelProvider2 = provider
}

func TestPostgresModelProvider_CreateAutomationSubstitution(t *testing.T) {

	trigger := `{"trigger":"yes"}`
	triggerToJSON := datatypes.JSON([]byte(trigger))
	json.Unmarshal([]byte(trigger), &triggerToJSON)

	condition := `{"condition":"yes"}`
	conditionToJSON := datatypes.JSON([]byte(condition))
	json.Unmarshal([]byte(condition), &conditionToJSON)

	action := `{"action":"yes"}`
	actionToJSON := datatypes.JSON([]byte(action))
	json.Unmarshal([]byte(action), &actionToJSON)

	def := types.AutomationDefinition{
		//AutomationSubstitutionID: 1,
		Mode:        "simple",
		Description: "sample",
		Alias:       "AAA",
		Triggers:    []types.Trigger{{JSONDefinition: types.JSONDefinition{JSON: triggerToJSON}}},
		Conditions:  []types.Condition{{JSONDefinition: types.JSONDefinition{JSON: conditionToJSON}}},
		Actions:     []types.Action{{JSONDefinition: types.JSONDefinition{JSON: actionToJSON}}},
	}

	sub := types.NewAutomationSubstitution("turn_on", "automation.a0", "A name", &def)
	sub.RuleConfigurationStepID = 1
	err := modelProvider2.CreateAutomationSubstitution(sub)

	if err != nil {
		t.Error(err)
	}

	guid = sub.ResourceID.String()
}

func TestPostgresModelProvider_GetAutomationSubstitution(t *testing.T) {
	if guid == "" {
		t.Error("Failure in previous test")
		t.FailNow()
	}

	parsedUUID, err := uuid.Parse(guid)
	if err != nil {
		t.Error(err)
	}
	sub, err := modelProvider2.GetAutomationSubstitution(parsedUUID.String())
	if err != nil {
		t.Error(err)
	}
	if sub == nil {
		t.Error("substitution not found")
		t.FailNow()
	}
	fmt.Printf("sub=%+v\n", sub)
	// correctness check
	if len(sub.Definitions[0].Triggers) != 1 {
		t.Error("Expected 1 trigger")
	}
	if sub.Definitions[0].IsInitial != true {
		t.Error("Expected first definition to be initial")
	}
}

func TestPostgresModelProvider_UpdateAutomationSubstitution(t *testing.T) {
	if guid == "" {
		t.Error("Failure in previous test")
		t.FailNow()
	}

	updatedTrigger := `{"trigger":"updated", "status" : "okay"}`
	updatedTriggerToJSON := datatypes.JSON([]byte(updatedTrigger))
	json.Unmarshal([]byte(updatedTriggerToJSON), &updatedTriggerToJSON)

	sub, err := modelProvider2.GetAutomationSubstitution(guid)
	if err != nil {
		t.Error(err)
		t.FailNow()
	}
	sub.Definitions[1].Triggers = append(sub.Definitions[1].Triggers, types.Trigger{
		JSONDefinition: types.JSONDefinition{
			JSON: updatedTriggerToJSON,
		},
	})

	err = modelProvider2.UpdateAutomationSubstitution(sub)
	if err != nil {
		t.Error(err)
		t.FailNow()
	}
	//this substitution should only have one trigger
	sub0, err := modelProvider2.GetAutomationSubstitution(guid)
	if err != nil {
		t.Error(err)
	}
	if sub0 == nil {
		t.Error("substitution not found")
		t.FailNow()
	}
	flag := false
	for i := range len(sub.Definitions) {
		definition := sub.Definitions[i]
		if definition.IsInitial {
			flag = !flag
		}
	}

	if !flag {
		t.Error("Expected exactly one definition to be initial")
	}

}

func TestPostgresModelProvider_DeleteAutomationSubstitution(t *testing.T) {
	if guid == "" {
		t.Error("Failure in previous test")
		t.FailNow()
	}
	sub, err := modelProvider2.GetAutomationSubstitution(guid)
	if err != nil {
		t.Error(err)
		t.FailNow()
	}
	if err := modelProvider2.DeleteAutomationSubstitution(sub); err != nil {
		t.Error(err)
	}
}
