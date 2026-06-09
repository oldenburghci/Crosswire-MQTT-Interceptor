package types

import (
	"errors"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ConfigurationStep struct {
	gorm.Model `json:"-"`
	Ready      bool `json:"ready"`
	// used for frontend conversion
	Type            string `json:"type"`
	ConfigurationID uint   `json:"-"`
}

// DeviceConfigurationStep is a ConfigurationStep
type DeviceConfigurationStep struct {
	ConfigurationStep
	//a mapping between a device and its belonging entities
	Entities []Entity `json:"entities"`
	//a mapping between the entity and its configuration
	//EntityConfigurations []EntityConfiguration `json:"entities" gorm:"foreignKey:DeviceConfigurationID"`
}

// TODO: deprecated
type Device struct {
	gorm.Model                `json:"-"`
	Device                    string   `json:"device"`
	Entities                  []Entity `json:"entities" gorm:"foreignKey:DeviceID"`
	DeviceConfigurationStepID uint     `json:"-"`
}

type Entity struct {
	gorm.Model                `json:"-"`
	DeviceConfigurationStepID uint                `json:"-"`
	Entity                    string              `json:"entity"`
	EntityConfiguration       EntityConfiguration `json:"entityConfiguration" gorm:"embedded"`
	Service                   string              `json:"service"`
	Domain                    string              `json:"domain"`
}

type EntityConfiguration struct {
	//EntityID     uint64         `json:"-"`
	JSON         datatypes.JSON `json:"json"`
	Capabilities datatypes.JSON `json:"capabilities"`
}

type AutomationDefinition struct {
	gorm.Model             `json:"-"`
	AutomationDefinitionID uint64 `json:"-"`
	Mode                   string `json:"mode"`
	Description            string `json:"description"`
	Alias                  string `json:"alias"`
	SHHInternalID          string `json:"internalId"`
	//indicates the initial set
	IsInitial  bool        `json:"-"`
	Triggers   []Trigger   `json:"triggers" gorm:"foreignKey:AutomationDefinitionID"`
	Conditions []Condition `json:"conditions" gorm:"foreignKey:AutomationDefinitionID"`
	Actions    []Action    `json:"actions" gorm:"foreignKey:AutomationDefinitionID"`
}

type JSONDefinition struct {
	ID uint `json:"-"`
	//DefinitionID uint64         `json:"-" gorm:"uniqueIndex, auto_increment"`
	JSON datatypes.JSON `json:"json"`
	// the part (trigger,condition,action) of the definition comes from this entity
	FriendlyName string `json:"friendlyName"`
	EntityId     string `json:"entityId"`
}

type Trigger struct {
	JSONDefinition
	AutomationDefinitionID uint `json:"-"`
}

type Condition struct {
	JSONDefinition
	AutomationDefinitionID uint `json:"-"`
}

type Action struct {
	JSONDefinition
	AutomationDefinitionID uint `json:"-"`
}

type RuleConfigurationStep struct {
	ConfigurationStep
	//RuleSubstitutions []RuleSubstitution `json:"ruleSubstitutions" gorm:"foreignKey:RuleConfigurationStepID"`
	Substitutions []AutomationSubstitution `json:"substitutions" gorm:"foreignKey:RuleConfigurationStepID"`
}

type AutomationSubstitution struct {
	gorm.Model `json:"-"`
	//foreign key
	RuleConfigurationStepID uint   `json:"-"`
	Service                 string `json:"service"`
	//domain is always 'automation'
	// entity id
	Entity string `json:"entity"`
	//all user defined changes to triggers and such go here
	Definitions []AutomationDefinition `json:"definitions" gorm:"foreignKey:AutomationDefinitionID"`
	//the initial configuration for reset purposes...is set with the init function
	//InitialConfigurationID uint                 `json:"-"`
	//identify new substitutions by this field...
	ResourceID   uuid.UUID `json:"key" gorm:"type:uuid;default:uuid_generate_v4()"`
	FriendlyName string    `json:"friendlyName"`
}

type RuleSubstitution struct {
	gorm.Model `json:"-"`

	RuleA                   string `json:"ruleA"`
	RuleB                   string `json:"ruleB"`
	RuleConfigurationStepID uint   `json:"-"`
}

type ErrorConfigurationStep struct {
	ConfigurationStep
	SuppressedTopics  []MQTTSuppressedTopicWrapper  `json:"suppressedTopics" gorm:"foreignKey:ErrorConfigurationStepID"`
	InterceptedTopics []MQTTInterceptedTopicWrapper `json:"interceptedTopics" gorm:"foreignKey:ErrorConfigurationStepID"`
}

type Configuration struct {
	Object `gorm:"embedded"`
	//ID    uint                `json:"key" gorm:"primaryKey"`
	Name                    string                    `json:"friendlyName"`
	DeviceConfigurationStep DeviceConfigurationStep   `json:"deviceConfigurationStep" gorm:"foreignKey:ConfigurationID"`
	RulesConfigurationStep  RuleConfigurationStep     `json:"rulesConfigurationStep" gorm:"foreignKey:ConfigurationID"`
	ErrorConfigurationStep  ErrorConfigurationStep    `json:"errorConfigurationStep" gorm:"foreignKey:ConfigurationID"`
	ConfigurationSharedWith []ConfigurationSharedWith `json:"-" gorm:"foreignKey:ConfigurationID"`
}

type ConfigurationSharedWith struct {
	gorm.Model
	UserID          uint `json:"userID"`
	ConfigurationID uint
}

// NewAutomationSubstitution creates a new automation substitution. Copies the RunConfiguration and stores it into InitialConfiguration.
// This field is used for rollbacks of automations
func NewAutomationSubstitution(service string, entity string, friendlyName string, initDefinition *AutomationDefinition) *AutomationSubstitution {
	c := AutomationDefinition{
		Mode:          initDefinition.Mode,
		Alias:         initDefinition.Alias,
		Description:   initDefinition.Description,
		SHHInternalID: initDefinition.SHHInternalID,
		Triggers:      make([]Trigger, 0),
		Conditions:    make([]Condition, 0),
		Actions:       make([]Action, 0),
		IsInitial:     true,
	}

	for _, trigger := range initDefinition.Triggers {
		//create by copy!
		c.Triggers = append(c.Triggers, trigger)
	}

	for _, condition := range initDefinition.Conditions {
		c.Conditions = append(c.Conditions, condition)
	}

	for _, action := range initDefinition.Actions {
		c.Actions = append(c.Actions, action)
	}

	result := AutomationSubstitution{
		FriendlyName: friendlyName,
		Service:      service,
		Entity:       entity,
		Definitions:  make([]AutomationDefinition, 0),
	}
	result.Definitions = append(result.Definitions, c, *initDefinition)

	return &result
}

func (substitution *AutomationSubstitution) GetCurrentDefinition() (*AutomationDefinition, error) {
	if len(substitution.Definitions) == 1 {
		return &substitution.Definitions[0], nil
	}

	for _, definition := range substitution.Definitions {
		if definition.IsInitial {
			continue
		}
		return &definition, nil
	}
	return nil, errors.New("No definition found")
}

func (definition *AutomationDefinition) FlattenTriggers() ([]datatypes.JSON, error) {
	result := make([]datatypes.JSON, 0)

	for _, trigger := range definition.Triggers {
		if trigger.JSON == nil {
			continue
		}
		result = append(result, trigger.JSON)
	}
	return result, nil
}

func (definition *AutomationDefinition) FlattenConditions() ([]datatypes.JSON, error) {
	result := make([]datatypes.JSON, 0)

	for _, condition := range definition.Conditions {
		if condition.JSON == nil {
			continue
		}
		result = append(result, condition.JSON)
	}
	return result, nil
}

func (definition *AutomationDefinition) FlattenActions() ([]datatypes.JSON, error) {
	result := make([]datatypes.JSON, 0)

	for _, action := range definition.Actions {
		if action.JSON == nil {
			continue
		}
		result = append(result, action.JSON)
	}
	return result, nil
}
