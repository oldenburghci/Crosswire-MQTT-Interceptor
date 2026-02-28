package handler

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/types"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/utils"
	usertypes "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/user-management/serverlib/types"
	"gorm.io/datatypes"
	"io/ioutil"
	"net/http"
	//"reflect"
	//"strconv"
)

func GetAllConfigurationsHandler(ctx *gin.Context) {
	response := GetAllConfigsResponse{
		Configurations: make([]ShortConfigResponse, 0),
	}

	resourceIDs, isIn := ctx.Get("resources")
	if !isIn {
		fmt.Println("resources is empty")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	for _, resourceID := range resourceIDs.([]string) {
		config, err := serverlib.MODEL_PROVIDER.GetConfigurationByResourceID(resourceID)
		if err != nil {
			// not all receive guids belong to a configuration
			//fmt.Println("GetAllConfigurationsHandler error: " + err.Error())
			//ctx.JSON(http.StatusInternalServerError, gin.H{
			//	"message": "internal server error",
			//})
			continue
		}
		response.Configurations = append(
			response.Configurations,
			ShortConfigResponse{
				FriendlyName: config.Name,
				Key:          config.ResourceID,
			},
		)
	}

	ctx.JSON(http.StatusOK, response)
}

func GetConfigurationHandler(ctx *gin.Context) {
	resourcesId := ctx.Param("id")
	config, err := serverlib.MODEL_PROVIDER.GetConfigurationByResourceID(resourcesId)
	if err != nil {
		fmt.Printf("err:%+v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	//construct returned object
	ctx.JSON(http.StatusOK, config)
}

func CreateConfigurationHandler(ctx *gin.Context) {
	//fmt.Println("CreateConfigurationHandler called")
	//fmt.Printf("%+v\n", ctx)
	//parse the incoming request data and check its validity
	uid, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		return
	}
	request := struct {
		Name string `json:"friendlyName" binding:"required"`
	}{}
	//TODO: create the minimal object on nested lists, this is causing a bug!
	configuration := types.Configuration{}

	configuration.ErrorConfigurationStep.SuppressedTopics = make([]types.MQTTSuppressedTopicWrapper, 0)
	configuration.ErrorConfigurationStep.InterceptedTopics = make([]types.MQTTInterceptedTopicWrapper, 0)
	configuration.ErrorConfigurationStep.Type = "errors"
	configuration.ErrorConfigurationStep.Ready = true

	configuration.DeviceConfigurationStep.Entities = make([]types.Entity, 0)
	configuration.DeviceConfigurationStep.Ready = true
	configuration.DeviceConfigurationStep.Type = "entities"

	configuration.RulesConfigurationStep.Ready = true
	configuration.RulesConfigurationStep.Type = "rules"
	//TODO: Rule later on

	err = ctx.ShouldBindJSON(&request)
	//fmt.Printf("%+v\n", request)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "message body malformed",
		})
		return
	}
	configuration.Name = request.Name
	configuration.OwnerID = uid
	//fmt.Printf("newConfig: %+v\n", configuration)
	//upload configuration
	err = serverlib.MODEL_PROVIDER.CreateConfiguration(&configuration)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
	}
	//return
	ctx.JSON(http.StatusCreated, gin.H{
		"message":    "created",
		"resourceID": configuration.ResourceID.String(),
	})

}

func UpdateConfigurationMetaHandler(ctx *gin.Context) {
	resourcesId := ctx.Param("id")
	type MetaUpdateRequest struct {
		FriendlyName string `json:"friendlyName" binding:"required"`
	}
	request := MetaUpdateRequest{}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "message body malformed",
		})
		return
	}
	current, err := serverlib.MODEL_PROVIDER.GetConfigurationByResourceID(resourcesId)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	current.Name = request.FriendlyName
	if err := serverlib.MODEL_PROVIDER.UpdateConfiguration(current); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"message": "updated",
	})
}

func UpdateConfigurationEntitiesHandler(ctx *gin.Context) {
	resourcesId := ctx.Param("id")
	type EntitiesUpdateRequest struct {
		DeviceConfigurationStep types.DeviceConfigurationStep `json:"deviceConfigurationStep" binding:"required"`
	}
	request := EntitiesUpdateRequest{}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "message body malformed",
		})
		return
	}
	current, err := serverlib.MODEL_PROVIDER.GetConfigurationByResourceID(resourcesId)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	if err := serverlib.MODEL_PROVIDER.DeleteDevicesAndEntries(&current.DeviceConfigurationStep); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	request.DeviceConfigurationStep.Model = current.DeviceConfigurationStep.Model
	current.DeviceConfigurationStep = request.DeviceConfigurationStep
	if err := serverlib.MODEL_PROVIDER.UpdateConfiguration(current); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"message": "updated",
	})
}

func UpdateConfigurationErrorsHandler(ctx *gin.Context) {
	resourcesId := ctx.Param("id")
	type ErrorsUpdateRequest struct {
		ErrorConfigurationStep types.ErrorConfigurationStep `json:"errorConfigurationStep" binding:"required"`
	}
	request := ErrorsUpdateRequest{}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "message body malformed",
		})
		return
	}
	current, err := serverlib.MODEL_PROVIDER.GetConfigurationByResourceID(resourcesId)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	if err := serverlib.MODEL_PROVIDER.DeleteSuppressedAndInterceptedTopics(&current.ErrorConfigurationStep); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	request.ErrorConfigurationStep.Model = current.ErrorConfigurationStep.Model
	current.ErrorConfigurationStep = request.ErrorConfigurationStep
	if err := serverlib.MODEL_PROVIDER.UpdateConfiguration(current); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"message": "updated",
	})
}

func UpdateConfigurationRulesHandler(ctx *gin.Context) {
	resourcesId := ctx.Param("id")
	type RulesUpdateRequest struct {
		RulesConfigurationStep types.RuleConfigurationStep `json:"ruleConfigurationStep" binding:"required"`
	}
	request := RulesUpdateRequest{}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "message body malformed",
		})
		return
	}

	current, err := serverlib.MODEL_PROVIDER.GetConfigurationByResourceID(resourcesId)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	//check if

	//do not delete the initial rule definition per default, only delete if a rule is removed from the configuration step
	//TODO: protect the init rules from overwrites
	request.RulesConfigurationStep.Model = current.RulesConfigurationStep.Model
	current.RulesConfigurationStep = request.RulesConfigurationStep

	if err := serverlib.MODEL_PROVIDER.UpdateConfiguration(current); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"message": "updated",
	})
}

func UpdateAutomationSubstitutionHandler(ctx *gin.Context) {
	//configResourceId := ctx.Param("id")
	substitutionId := ctx.Param("substitution")
	//fmt.Printf("config_id=%s,substitution_id=%s\n", configResourceId, substitutionId)

	request := struct {
		Entity       string                     `json:"entity" binding:"required"`
		Definition   types.AutomationDefinition `json:"definition" binding:"required"`
		Service      string                     `json:"service" binding:"required"`
		FriendlyName string                     `json:"friendlyName" binding:"required"`
	}{}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "message body malformed",
		})
		return
	}
	//fmt.Printf("converted request=%+v\n", request)
	//configuration serverlib.MODEL_PROVIDER.GetConfigurationByResourceID(configResourceId)
	sub, err := serverlib.MODEL_PROVIDER.GetAutomationSubstitution(substitutionId)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	//fmt.Printf("sub=%+v\n", sub)
	updateCollector := make([]types.AutomationDefinition, 0)
	removeCollector := make([]*types.AutomationDefinition, 0)
	//var updateCollector types.AutomationDefinition
	for i := range len(sub.Definitions) {
		definition := sub.Definitions[i]
		if !definition.IsInitial {
			removeCollector = append(removeCollector, &definition)
			//request.Definition.Model = definition.Model
			//updateCollector = append(updateCollector, request.Definition)
			continue
		}
		//the initial definition remains as it
		updateCollector = append(updateCollector, definition)
	}

	updateCollector = append(updateCollector, request.Definition)

	sub.Definitions = updateCollector
	sub.Entity = request.Entity
	sub.Service = request.Service
	sub.FriendlyName = request.FriendlyName

	if err := serverlib.MODEL_PROVIDER.DeleteAutomationDefinitions(removeCollector); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}

	if err := serverlib.MODEL_PROVIDER.UpdateAutomationSubstitution(sub); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "updated",
	})

}

func UpdateConfigurationHandler(ctx *gin.Context) {
	resourcesId := ctx.Param("id")
	// get configuration from request
	updateConfiguration := types.Configuration{}
	err := ctx.ShouldBindJSON(&updateConfiguration)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "message body malformed",
		})
		return
	}

	currentConfiguration, err := serverlib.MODEL_PROVIDER.GetConfigurationByResourceID(resourcesId)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}

	//update
	// TODO: unshare?
	updateConfiguration.Object = currentConfiguration.Object
	updateConfiguration.Model = currentConfiguration.Model
	updateConfiguration.ConfigurationSharedWith = currentConfiguration.ConfigurationSharedWith
	updateConfiguration.DeviceConfigurationStep.Model = currentConfiguration.DeviceConfigurationStep.Model
	updateConfiguration.RulesConfigurationStep.Model = currentConfiguration.RulesConfigurationStep.Model
	updateConfiguration.ErrorConfigurationStep.Model = currentConfiguration.ErrorConfigurationStep.Model
	// check if the updated configuration holds devices that are already in the current configuration.
	// setting the internal gorm model for an updated but already included device will avoid duplicates in the database
	// devices and entities get still duplicated. Delete them first for a clear update.
	if err = serverlib.MODEL_PROVIDER.DeleteDevicesAndEntries(&currentConfiguration.DeviceConfigurationStep); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}

	if err = serverlib.MODEL_PROVIDER.DeleteSuppressedAndInterceptedTopics(&currentConfiguration.ErrorConfigurationStep); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}

	err = serverlib.MODEL_PROVIDER.UpdateConfiguration(&updateConfiguration)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	fmt.Printf("configuration=%+v\n", updateConfiguration)
	ctx.JSON(http.StatusOK, gin.H{
		"message": "update successful",
	})
}

// UpdateShareConfigurationHandler Handler function to set the share configuration for this resource. The entries for
// the shared configuration is not part of the regular update function to prevent exploits. The handler can be used for
// sharing and unsharing of users
func UpdateShareConfigurationHandler(ctx *gin.Context) {
	resourcesId := ctx.Param("id")
	//parse request
	request := ShareConfigurationRequest{}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "message body malformed",
		})
		return
	}

	configuration, err := serverlib.MODEL_PROVIDER.GetConfigurationByResourceID(resourcesId)
	//Delete all shared withs before such that
	if err := serverlib.MODEL_PROVIDER.DeleteConfigurationSharedWith(configuration); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	//TODO: Auth model is never initialized in this module
	userIDs, err := serverlib.AUTH_MODEL_DB.GetUsersByUsernames(request.SharedWithUsers)
	sharedConfigurationsEntry := make([]types.ConfigurationSharedWith, 0)
	for _, user := range userIDs {
		sharedConfigurationsEntry = append(sharedConfigurationsEntry, types.ConfigurationSharedWith{
			UserID:          user.ID,
			ConfigurationID: configuration.ID,
		})
	}

	configuration.ConfigurationSharedWith = sharedConfigurationsEntry
	configuration.Shared = request.Shared
	err = serverlib.MODEL_PROVIDER.UpdateConfiguration(configuration)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"message": "updated successful",
	})
}

func DeleteConfigurationHandler(ctx *gin.Context) {
	resourcesId := ctx.Param("id")
	configuration, err := serverlib.MODEL_PROVIDER.GetConfigurationByResourceID(resourcesId)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	if err := serverlib.MODEL_PROVIDER.DeleteConfiguration(configuration); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"message": "deleted successful",
	})
}

func RunConfigurationHandler(ctx *gin.Context) {
	configuration, user, err := prepareRunConfiguration(ctx)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}

	if configuration.DeviceConfigurationStep.Ready {
		fmt.Println("--- Upload EntitiesConfigurationStep ---")
		if err := uploadEntities(configuration); err != nil {
			fmt.Printf("%s\n", err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "internal server error",
			})
			return
		}
		fmt.Println("--- EntitiesConfigurationStep deployed ---")
	}

	if configuration.RulesConfigurationStep.Ready {
		fmt.Println("--- Upload RulesConfigurationStep ---")

		if err := uploadAutomationSubstitution(configuration); err != nil {
			fmt.Printf("%s\n", err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "internal server error",
			})
			return
		}
		fmt.Println("--- Deploy RulesConfigurationStep ---")
	}

	if configuration.ErrorConfigurationStep.Ready {
		fmt.Println("--- Upload ErrorConfigurationStep ---")

		if err := uploadSuppressedTopics(configuration); err != nil {
			fmt.Printf("%s\n", err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "internal server error",
			})
			return
		}

		if err := uploadInterceptedTopics(configuration); err != nil {
			fmt.Printf("%s\n", err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "internal server error",
			})
			return
		}
		fmt.Println("--- ErrorConfigurationStep deployed --- ")
	}
	serverlib.GATEWAY_CONFIG.LAST_CONFIGURATION_DEPLOYED = configuration.Name
	serverlib.GATEWAY_CONFIG.LAST_CONFIGURATION_DEPLOYED_BY = user.Username

	ctx.JSON(http.StatusOK, gin.H{
		"message": "configuration successful deployed",
	})
}

func RunConfigurationEntitiesHandler(ctx *gin.Context) {
	configuration, user, err := prepareRunConfiguration(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}

	if configuration.DeviceConfigurationStep.Ready {
		fmt.Println("--- Upload EntitiesConfigurationStep ---")
		if err := uploadEntities(configuration); err != nil {
			fmt.Printf("%s\n", err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "internal server error",
			})
			return
		}
		fmt.Println("--- EntitiesConfigurationStep deployed ---")
	}

	serverlib.GATEWAY_CONFIG.LAST_CONFIGURATION_DEPLOYED = configuration.Name + " | Entities"
	serverlib.GATEWAY_CONFIG.LAST_CONFIGURATION_DEPLOYED_BY = user.Username

	ctx.JSON(http.StatusOK, gin.H{
		"message": "configuration successful deployed",
	})
}

func RunConfigurationAutomationsHandler(ctx *gin.Context) {
	configuration, user, err := prepareRunConfiguration(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	// Deploy Automation
	if configuration.RulesConfigurationStep.Ready {
		fmt.Println("--- Upload RulesConfigurationStep ---")
		if err := uploadAutomationSubstitution(configuration); err != nil {
			fmt.Printf("%s\n", err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "internal server error",
			})
			return
		}
		fmt.Println("--- Deploy RulesConfigurationStep ---")
	}

	serverlib.GATEWAY_CONFIG.LAST_CONFIGURATION_DEPLOYED = configuration.Name + " | Automations"
	serverlib.GATEWAY_CONFIG.LAST_CONFIGURATION_DEPLOYED_BY = user.Username

	ctx.JSON(http.StatusOK, gin.H{
		"message": "configuration successful deployed",
	})
}

func RunConfigurationErrorsHandler(ctx *gin.Context) {
	configuration, user, err := prepareRunConfiguration(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	// Deploy Topics
	if configuration.ErrorConfigurationStep.Ready {
		fmt.Println("--- Upload ErrorConfigurationStep ---")
		if err := uploadSuppressedTopics(configuration); err != nil {
			fmt.Printf("%s\n", err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "internal server error",
			})
			return
		}

		if err := uploadInterceptedTopics(configuration); err != nil {
			fmt.Printf("%s\n", err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "internal server error",
			})
			return
		}
		fmt.Println("--- ErrorConfigurationStep deployed --- ")
	}

	serverlib.GATEWAY_CONFIG.LAST_CONFIGURATION_DEPLOYED = configuration.Name + " | Topics"
	serverlib.GATEWAY_CONFIG.LAST_CONFIGURATION_DEPLOYED_BY = user.Username

	ctx.JSON(http.StatusOK, gin.H{
		"message": "configuration successful deployed",
	})
}

func prepareRunConfiguration(ctx *gin.Context) (*types.Configuration, *usertypes.User, error) {
	resourcesId := ctx.Param("id")
	_, err := utils.GetUserIDFromContext(ctx)
	//fmt.Printf("uid=%d\n", uid)
	if err != nil {
		return nil, nil, err
	}
	user, err := requestUserInformation(ctx)
	if err != nil {
		return nil, nil, err
	}

	configuration, err := serverlib.MODEL_PROVIDER.GetConfigurationByResourceID(resourcesId)
	if err != nil {
		return nil, nil, err
	}

	return configuration, user, nil
}

func postAutomationDefinition(substitution *types.AutomationSubstitution) error {
	currentDefinition, err := substitution.GetCurrentDefinition()
	if err != nil {
		return err
	}
	//prepare the configured rewrite of triggers, conditions and actions
	configMessage := struct {
		AutomationID string           `json:"id"`
		Alias        string           `json:"alias"`
		Description  string           `json:"description"`
		Mode         string           `json:"mode"`
		Triggers     []datatypes.JSON `json:"triggers"`
		Conditions   []datatypes.JSON `json:"conditions"`
		Actions      []datatypes.JSON `json:"actions"`
	}{
		AutomationID: currentDefinition.SHHInternalID,
		Alias:        currentDefinition.Alias,
		Description:  currentDefinition.Description,
		Mode:         currentDefinition.Mode,
		Triggers:     make([]datatypes.JSON, 0),
		Conditions:   make([]datatypes.JSON, 0),
		Actions:      make([]datatypes.JSON, 0),
	}
	flattenedTrigger, err := currentDefinition.FlattenTriggers()
	if err != nil {
		return err
	}
	flattenedCondition, err := currentDefinition.FlattenConditions()
	if err != nil {
		return err
	}
	flattenedAction, err := currentDefinition.FlattenActions()
	if err != nil {
		return err
	}

	configMessage.Triggers = flattenedTrigger
	configMessage.Conditions = flattenedCondition
	configMessage.Actions = flattenedAction

	jsonConfigMessage, err := json.Marshal(configMessage)
	if err != nil {
		return err
	}
	fmt.Printf(" json message=%s\n", jsonConfigMessage)
	configRequest, err := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/api/config/automation/config/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, currentDefinition.SHHInternalID),
		bytes.NewReader(jsonConfigMessage),
	)
	if err != nil {
		return err
	}
	configRequest.Header.Set("Content-Type", "application/json")
	configRequest.Header.Set("Authorization", fmt.Sprintf("Bearer %s", serverlib.GATEWAY_CONFIG.SHH_TOKEN))

	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}

	client := &http.Client{Transport: tr}
	response, err := client.Do(configRequest)

	if err != nil {
		return err
	}

	body, _ := ioutil.ReadAll(response.Body)
	responseBody := make(json.RawMessage, 0)

	if err := json.Unmarshal(body, &responseBody); err != nil {
		return err
	}

	fmt.Printf("Server Response Code=%d\nServer Body=%+v\n", response.StatusCode, responseBody)
	response.Body.Close()
	return nil
}

func postDeployMessage(substitution *types.AutomationSubstitution) error {
	//prepare the request
	//this message must be compliant to home assistant
	deployMessage := struct {
		Entity string `json:"entity_id"`
	}{
		Entity: substitution.Entity,
	}
	jsonDeployMessage, err := json.Marshal(deployMessage)
	if err != nil {
		return err
	}
	//send the service message to set this automation to on or off
	deployRequest, err := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/api/services/automation/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, substitution.Service),
		bytes.NewReader(jsonDeployMessage),
	)
	if err != nil {
		return err
	}
	deployRequest.Header.Set("Content-Type", "application/json; charset=UTF-8")
	deployRequest.Header.Set("Authorization", fmt.Sprintf("Bearer %s", serverlib.GATEWAY_CONFIG.SHH_TOKEN))

	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}

	client := &http.Client{Transport: tr}
	response, err := client.Do(deployRequest)

	if err != nil {
		return err
	}

	body, _ := ioutil.ReadAll(response.Body)
	responseBody := make(json.RawMessage, 0)

	if err := json.Unmarshal(body, &responseBody); err != nil {
		return err
	}

	fmt.Printf("Server Response Code=%d\nServer Body=%+v\n", response.StatusCode, responseBody)
	response.Body.Close()
	return nil
}

func uploadAutomationSubstitution(configuration *types.Configuration) error {

	for _, substitution := range configuration.RulesConfigurationStep.Substitutions {
		if err := postAutomationDefinition(&substitution); err != nil {
			return err
		}

		if err := postDeployMessage(&substitution); err != nil {
			return err
		}
	}

	return nil
}

func uploadSuppressedTopics(configuration *types.Configuration) error {
	// create an anonymous structure because we don't need it anywhere else
	// ignore the time feature for now
	request := struct {
		Topics []struct {
			Name string `json:"name"`
		} `json:"topics"`
	}{
		Topics: make([]struct {
			Name string `json:"name"`
		}, 0),
	}

	for _, topic := range configuration.ErrorConfigurationStep.SuppressedTopics {
		// suppress all children topics with wildcard
		next := struct {
			Name string `json:"name"`
		}{
			Name: topic.TopicName + "/#",
		}
		request.Topics = append(request.Topics, next)
	}

	requestBody := new(bytes.Buffer)
	if err := json.NewEncoder(requestBody).Encode(request); err != nil {
		return err
	}

	postSuppression, err := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/topics/suppress", serverlib.GATEWAY_CONFIG.MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS),
		requestBody,
	)
	if err != nil {
		return err
	}

	postSuppression.Header.Set("Content-Type", "application/json; charset=UTF-8")
	//TODO: consider https://forfuncsake.github.io/post/2017/08/trust-extra-ca-cert-in-go-app/
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}
	response, err := client.Do(postSuppression)
	if err != nil {
		return err
	}
	body, _ := ioutil.ReadAll(response.Body)
	response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf(
			"\t send suppression request to %s -- Engine Response: %d\nbody:%s\n",
			fmt.Sprintf("%s/topics/suppress", serverlib.GATEWAY_CONFIG.MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS),
			response.StatusCode,
			body,
		)
	}
	return nil
}

func uploadInterceptedTopics(configuration *types.Configuration) error {
	//aging, an anonymous structure
	request := struct {
		Topics []struct {
			Name           string                `json:"name"`
			OutputTemplate types.TemplateWrapper `json:"template"`
			InputTemplate  types.TemplateWrapper `json:"rule"`
		}
	}{
		Topics: make([]struct {
			Name           string                `json:"name"`
			OutputTemplate types.TemplateWrapper `json:"template"`
			InputTemplate  types.TemplateWrapper `json:"rule"`
		}, 0),
	}
	// collect topics
	for _, topic := range configuration.ErrorConfigurationStep.InterceptedTopics {
		next := struct {
			Name           string                `json:"name"`
			OutputTemplate types.TemplateWrapper `json:"template"`
			InputTemplate  types.TemplateWrapper `json:"rule"`
		}{
			Name:           topic.TopicName,
			OutputTemplate: topic.OutputTemplate,
			InputTemplate:  topic.InputTemplate,
		}
		request.Topics = append(request.Topics, next)
	}

	requestBody := new(bytes.Buffer)
	if err := json.NewEncoder(requestBody).Encode(request); err != nil {
		return err
	}

	postInterception, err := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/topics/intercept/template", serverlib.GATEWAY_CONFIG.MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS),
		requestBody,
	)
	if err != nil {
		return err
	}
	postInterception.Header.Set("Content-Type", "application/json; charset=UTF-8")
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}
	response, err := client.Do(postInterception)
	if err != nil {
		return err
	}
	body, _ := ioutil.ReadAll(response.Body)
	response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf(
			"\t -- send intercept request to %s -- Engine Response: %d\nbody:%s\n",
			fmt.Sprintf("%s/topics/intercept/template", serverlib.GATEWAY_CONFIG.MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS),
			response.StatusCode,
			body,
		)
	}
	return nil
}

func uploadEntities(configuration *types.Configuration) error {
	for _, entity := range configuration.DeviceConfigurationStep.Entities {
		//if !entity.UndoEntityConfigurationSet {
		//	fetchUndoConfiguration(&entity)
		//}

		request, err := http.NewRequest(
			"POST",
			fmt.Sprintf("%s/api/services/%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, entity.Domain, entity.Service),
			bytes.NewReader(entity.EntityConfiguration.JSON),
		)
		//fallback if domain and service are not provided
		//TODO: feedback for failed configurations
		if entity.Service == "" || entity.Domain == "" {
			request, err = http.NewRequest(
				"POST",
				fmt.Sprintf("%s/api/states/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, entity.Entity),
				bytes.NewBuffer(entity.EntityConfiguration.JSON),
			)
		}

		if err != nil {
			return err
		}

		request.Header.Set("Content-Type", "application/json; charset=UTF-8")
		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", serverlib.GATEWAY_CONFIG.SHH_TOKEN))
		//TODO: consider https://forfuncsake.github.io/post/2017/08/trust-extra-ca-cert-in-go-app/
		//tr := &http.Transport{
		//	TLSClientConfig: &tls.Config{ServerName: "localhost"},
		//}
		tr := &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		}

		client := &http.Client{Transport: tr}
		response, err := client.Do(request)

		if err != nil {
			return err
		}
		body, _ := ioutil.ReadAll(response.Body)
		fmt.Printf("ResponseCode=%d\nBody=%+v\n", response.StatusCode, body)
		response.Body.Close()

		// stop of fail
		if response.StatusCode != http.StatusOK {
			return errors.New(
				fmt.Sprintf(
					"\t send config for entity: %s to %s -- SHH response: %d\nbody:%s\n",
					entity.Entity,
					fmt.Sprintf("%s/api/states/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, entity.Entity),
					response.StatusCode,
					body,
				),
			)
		}
	}
	return nil
}

func fetchUndoConfiguration(entity *types.Entity) error {
	fmt.Printf("no undo configuration set for %s . fetch it now\n", entity.Entity)

	requestUndoState, err := http.NewRequest(
		"GET",
		fmt.Sprintf("%s/api/states/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, entity.Entity),
		nil,
	)
	if err != nil {
		return err
	}
	requestUndoState.Header.Set("Content-Type", "application/json; charset=UTF-8")
	requestUndoState.Header.Set("Authorization", fmt.Sprintf("Bearer %s", serverlib.GATEWAY_CONFIG.SHH_TOKEN))

	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}
	responseUndoState, err := client.Do(requestUndoState)

	if err != nil {
		return err
	}
	body, _ := ioutil.ReadAll(responseUndoState.Body)
	defer responseUndoState.Body.Close()
	if responseUndoState.StatusCode != http.StatusOK {
		return errors.New(
			fmt.Sprintf(
				"\tfetch config for entity: %s to %s -- SHH response: %d\nbody:%s\n",
				entity.Entity,
				fmt.Sprintf("%s/api/states/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, entity.Entity),
				responseUndoState.StatusCode,
				body,
			),
		)
	}
	fmt.Printf("\tfetch config successfully for entity: %s, body=%s\n", entity.Entity, body)

	entityState := make(map[string]interface{})

	if err := json.Unmarshal(body, &entityState); err != nil {
		return err
	}
	fmt.Printf("\tEntityState unmarshaled=%+v\n", entityState)
	return nil
}

func GetLastDeployedConfiguration(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, gin.H{
		"friendlyName": serverlib.GATEWAY_CONFIG.LAST_CONFIGURATION_DEPLOYED,
		"by":           serverlib.GATEWAY_CONFIG.LAST_CONFIGURATION_DEPLOYED_BY,
	})
}

func requestUserInformation(ctx *gin.Context) (*usertypes.User, error) {
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	request, err := http.NewRequest(
		"GET",
		fmt.Sprintf("%s/auth/whoami", serverlib.GATEWAY_CONFIG.USER_MANAGEMENT_ADDRESS),
		nil,
	)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-Type", "application/json; charset=UTF-8")
	request.Header.Add("Authorization", ctx.GetHeader("Authorization"))

	client := &http.Client{Transport: tr}
	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	body, _ := ioutil.ReadAll(response.Body)
	response.Body.Close()
	if response.StatusCode != http.StatusOK {
		//handle
	}
	var user *usertypes.User
	if err := json.Unmarshal(body, &user); err != nil {
		return nil, err
	}
	fmt.Printf("user:%+v\n", user)
	return user, nil
}

func CreateAutomationSubstitutionsHandler(ctx *gin.Context) {
	configID := ctx.Param("id")
	// TODO: make a data structure
	request := &struct {
		Service      string                     `json:"service" binding:"required"`
		Definition   types.AutomationDefinition `json:"definition" binding:"required"`
		Entity       string                     `json:"entity" binding:"required"`
		FriendlyName string                     `json:"friendlyName" binding:"required"`
	}{}
	if err := ctx.ShouldBind(&request); err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "malformed request body",
		})
		return
	}
	//fmt.Printf("request:%+v\n", request)
	//
	configuration, err := serverlib.MODEL_PROVIDER.GetConfigurationByResourceID(configID)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "no configuration found",
		})
		return
	}
	//fmt.Printf("configuration:%+v\n", configuration)

	substitution := types.NewAutomationSubstitution(request.Service, request.Entity, request.FriendlyName, &request.Definition)
	substitution.RuleConfigurationStepID = configuration.RulesConfigurationStep.Model.ID
	//fmt.Printf("substitution:%+v\n", substitution)
	if err := serverlib.MODEL_PROVIDER.CreateAutomationSubstitution(substitution); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}

	fmt.Printf("substitution created:%+v\n", substitution)
	ctx.JSON(http.StatusOK, gin.H{
		"message": "success",
		"key":     substitution.ResourceID,
	})
}

func GetAutomationSubstitutionHandler(ctx *gin.Context) {
	substitutionId := ctx.Param("substitution")
	substitution, err := serverlib.MODEL_PROVIDER.GetAutomationSubstitution(substitutionId)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusNotFound, gin.H{
			"message": "not found",
		})
		return
	}
	var def *types.AutomationDefinition
	withoutInit := make([]types.AutomationDefinition, 0)
	for _, definition := range substitution.Definitions {
		if definition.IsInitial {
			def = &definition
			continue
		}
		withoutInit = append(withoutInit, definition)
	}
	if len(withoutInit) > 0 {
		def = &withoutInit[0]
	}

	// unify responses and requests across all related handler function
	response := struct {
		Service      string                     `json:"service"`
		Entity       string                     `json:"entity"`
		Definition   types.AutomationDefinition `json:"definition"`
		Key          uuid.UUID                  `json:"key"`
		FriendlyName string                     `json:"friendlyName"`
	}{
		Service:      substitution.Service,
		Entity:       substitution.Entity,
		Key:          substitution.ResourceID,
		FriendlyName: substitution.FriendlyName,
		Definition:   *def,
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":      "ok",
		"substitution": response,
	})
}

func ResetAutomationSubstitutionHandler(ctx *gin.Context) {
	//Reset the definition to the initial definition
	substitutionId := ctx.Param("substitution")
	substitution, err := serverlib.MODEL_PROVIDER.GetAutomationSubstitution(substitutionId)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusNotFound, gin.H{
			"message": "not found",
		})
		return
	}

	toRemove := make([]*types.AutomationDefinition, 0)

	for _, sub := range substitution.Definitions {
		if !sub.IsInitial {
			toRemove = append(toRemove, &sub)
		}
	}
	if len(toRemove) != 0 {
		err = serverlib.MODEL_PROVIDER.DeleteAutomationDefinitions(toRemove)
		if err != nil {
			fmt.Printf("%s\n", err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "internal server error",
			})
			return
		}
	}
	ctx.JSON(http.StatusOK, gin.H{
		"message": "ok",
		"detail":  "reset",
	})
}

func DeleteAutomationSubstitutionHandler(ctx *gin.Context) {
	substitutionId := ctx.Param("substitution")
	substitution, err := serverlib.MODEL_PROVIDER.GetAutomationSubstitution(substitutionId)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	err = serverlib.MODEL_PROVIDER.DeleteAutomationSubstitution(substitution)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"message": "ok",
		"detail":  "deleted",
	})
}

func ResetEntitiesHandler(ctx *gin.Context) {
	// Retrieve the last device state from db
	// deploy the last device state to shh

	ctx.JSON(http.StatusOK, gin.H{
		"message": "ok",
		"detail":  "reset",
	})
}
