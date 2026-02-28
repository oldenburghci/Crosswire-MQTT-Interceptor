package db

import (
	"fmt"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/types"
	"gorm.io/datatypes"
	"testing"
)

var MODEL_PROVIDER *PostgresModelProvider
var TEST_CONFIG *types.Configuration

func init() {
	provider, err := NewPostgresModelProvider(gateway.GetDatabaseEnvironment(gateway.NewGatewayConfig()))
	if err != nil {
		panic(err)
	}
	MODEL_PROVIDER = provider
}

func TestPostgresModelProvider_CreateConfiguration(t *testing.T) {
	config := types.Configuration{
		Name: "MyConfiguration",
		DeviceConfigurationStep: types.DeviceConfigurationStep{
			ConfigurationStep: types.ConfigurationStep{
				Type:  "devices",
				Ready: false,
			},
			Devices: make([]types.Device, 0),
		},
		RulesConfigurationStep: types.RuleConfigurationStep{
			ConfigurationStep: types.ConfigurationStep{
				Type:  "rules",
				Ready: false,
			},
			RuleSubstitutions: make([]types.RuleSubstitution, 0),
		},
		ErrorConfigurationStep: types.ErrorConfigurationStep{
			ConfigurationStep: types.ConfigurationStep{
				Type:  "errors",
				Ready: false,
			},
		},
	}

	config.DeviceConfigurationStep.Devices = append(
		config.DeviceConfigurationStep.Devices,
		types.Device{
			Device: "Fan",
			Entities: []types.Entity{
				{
					Entity: "Switch Fan On/Off",
					EntityConfiguration: types.EntityConfiguration{
						JSON: datatypes.JSON([]byte(`{ "state": "off" }`)),
					},
				},
				{
					Entity: "Rotate Fan vertically",
					EntityConfiguration: types.EntityConfiguration{
						JSON: datatypes.JSON([]byte(`{ "rotation": 45, "unit" : "deg", "state" : "off" }`)),
					},
				},
			},
		},
	)

	config.RulesConfigurationStep.RuleSubstitutions = append(
		config.RulesConfigurationStep.RuleSubstitutions,
		types.RuleSubstitution{
			RuleA: "Rule X",
			RuleB: "Rule Y",
		},
		types.RuleSubstitution{
			RuleA: "Rule Z",
			RuleB: "Rule A",
		},
	)

	// this is an operator who has the right to insert configurations
	config.OwnerID = 2
	config.Shared = true
	config.ConfigurationSharedWith = make([]types.ConfigurationSharedWith, 0)
	config.ConfigurationSharedWith = append(
		config.ConfigurationSharedWith,
		types.ConfigurationSharedWith{
			// 1000 is a mockup user that does not exist in the database
			UserID: 1000,
		},
		types.ConfigurationSharedWith{
			UserID: 3,
		},
	)

	err := MODEL_PROVIDER.CreateConfiguration(&config)
	if err != nil {
		t.Error(err)
	}
	TEST_CONFIG = &config
}

func TestPostgresModelProvider_GetConfigurationByFriendlyName(t *testing.T) {
	configuration, err := MODEL_PROVIDER.GetConfigurationByFriendlyName(2, "MyConfiguration")

	if err != nil {
		t.Error(err)
	}
	if configuration == nil {
		t.Error("configuration is nil")
	}
	//TODO: semantic check
	fmt.Printf("loaded configuration: %+v\n---\n", configuration)
}

func TestPostgresModelProvider_GetConfigurations(t *testing.T) {
	configurations, err := MODEL_PROVIDER.GetConfigurationsForUser(2)
	if err != nil {
		t.Error(err)
	}
	if len(configurations) == 0 {
		t.Error("expected  at least 1 configuration for this user")
	}
	for _, configuration := range configurations {
		fmt.Printf("loaded configuration: %+v\n---\n", configuration)
	}
}

func TestPostgresModelProvider_GetAllSharedConfigurations(t *testing.T) {
	configurations, err := MODEL_PROVIDER.GetAllSharedConfigurations(1)
	if err != nil {
		t.Error(err)
	}
	if len(configurations) == 0 {
		t.Error("expected at least 1 configuration for this user")
	}
	for _, configuration := range configurations {
		fmt.Printf("loaded configuration: %+v\n---\n", configuration)
	}
}

func TestPostgresModelProvider_GetConfigurationResourceIDsByUID(t *testing.T) {
	resourceIDs, err := MODEL_PROVIDER.GetConfigurationResourceIDsForUser(2)
	if err != nil {
		t.Error(err)
	}
	if len(resourceIDs) == 0 {
		t.Error("expected at least 1 resource ID for user 2")
	}
	for _, resourceID := range resourceIDs {
		fmt.Printf("loaded resource ID for user 2: %s\n", resourceID)
	}
	fmt.Println("---")

	resourceIDs, err = MODEL_PROVIDER.GetConfigurationResourceIDsForUser(1000)
	if err != nil {
		t.Error(err)
	}
	if len(resourceIDs) != 1 {
		t.Error("expected exactly 1 resource ID for user 1000")
	}
	for _, resourceID := range resourceIDs {
		fmt.Printf("loaded resource ID for user 1000: %s\n", resourceID)
	}
}

func TestPostgresModelProvider_UpdateConfiguration(t *testing.T) {
	config := TEST_CONFIG
	config.Name = "YourConfiguration"

	err := MODEL_PROVIDER.UpdateConfiguration(config)
	if err != nil {
		t.Error(err)
	}

	getConfig, err := MODEL_PROVIDER.GetConfigurationByFriendlyName(2, "YourConfiguration")
	if err != nil {
		t.Error(err)
	}
	if getConfig.Name != "YourConfiguration" {
		t.Error("expected YourConfiguration for Configuration.Name")
	}
	fmt.Printf("loaded configuration: %+v\n---\n", getConfig)
	TEST_CONFIG = config
}

func TestPostgresModelProvider_DeleteConfiguration(t *testing.T) {
	err := MODEL_PROVIDER.DeleteConfiguration(TEST_CONFIG)
	if err != nil {
		t.Error(err)
	}
	_, err = MODEL_PROVIDER.GetConfigurationByFriendlyName(2, "YourConfiguration")
	if err == nil {
		t.Error("There should be not configuration by this name anymore.")
	}
}
