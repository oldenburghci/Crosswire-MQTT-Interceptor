package routing

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/handler"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/handler/proxy"
	mymgmt "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/user-management/serverlib/auth"
)

func Start() {

	router := gin.Default()

	router.Use(
		mymgmt.SecurityHeaders(
			fmt.Sprintf(
				"%s:%s",
				gateway.GetFromEnvironment("HOST"),
				gateway.GetFromEnvironment("PORT"),
			),
		),
	)
	// we will have to protect the api routes of home assistant later, they also use /api. Therefore, a distinction is required.
	api := router.Group("/middleware/api")
	api.Use(
		mymgmt.ValidateJWT(),
		mymgmt.RequestAccessControlPolicyCheck(
			fmt.Sprintf("%s/auth/check-access", serverlib.GATEWAY_CONFIG.USER_MANAGEMENT_ADDRESS),
		),
	)
	api.GET("/ping", handler.PongHandler)

	api.GET(
		"/configurations",
		//forward resource request to auth provider
		mymgmt.RequestResourcesAccess(
			fmt.Sprintf("%s/auth/resources", serverlib.GATEWAY_CONFIG.USER_MANAGEMENT_ADDRESS),
		),
		handler.GetAllConfigurationsHandler,
	)
	api.POST(
		"/configurations",
		handler.CreateConfigurationHandler,
	)

	configurationGroup := api.Group("/configuration")
	configurationGroup.Use(
		mymgmt.RequestResourceAccess(
			fmt.Sprintf("%s/auth/resource/:id", serverlib.GATEWAY_CONFIG.USER_MANAGEMENT_ADDRESS),
			"id",
		),
	)
	configurationGroup.GET("/:id", handler.GetConfigurationHandler)
	configurationGroup.GET("/:id/memo", handler.GetLinkedMemoHandler)
	configurationGroup.PUT("/:id/meta", handler.UpdateConfigurationMetaHandler)
	configurationGroup.PUT("/:id/entities", handler.UpdateConfigurationEntitiesHandler)
	configurationGroup.POST("/:id/entities/reset", handler.ResetEntitiesHandler)

	configurationGroup.PUT("/:id/rules", handler.UpdateConfigurationRulesHandler)
	configurationGroup.PUT("/:id/errors", handler.UpdateConfigurationErrorsHandler)
	configurationGroup.PUT("/:id/share", handler.UpdateShareConfigurationHandler)
	configurationGroup.DELETE("/:id", handler.DeleteConfigurationHandler)
	configurationGroup.POST("/:id/run", handler.RunConfigurationHandler)
	configurationGroup.POST("/:id/run/entities", handler.RunConfigurationEntitiesHandler)
	configurationGroup.POST("/:id/run/automations", handler.RunConfigurationAutomationsHandler)
	configurationGroup.POST("/:id/run/errors", handler.RunConfigurationErrorsHandler)

	configurationGroup.PUT("/:id/automation/:substitution", handler.UpdateAutomationSubstitutionHandler)
	configurationGroup.POST("/:id/automation", handler.CreateAutomationSubstitutionsHandler)
	configurationGroup.GET("/:id/automation/:substitution", handler.GetAutomationSubstitutionHandler)
	configurationGroup.POST("/:id/automation/:substitution/reset", handler.ResetAutomationSubstitutionHandler)
	configurationGroup.DELETE("/:id/automation/:substitution", handler.DeleteAutomationSubstitutionHandler)
	// authorization to resource "configuration" should suffice for this request (and this is done in the AuthorizedUserGroup)
	api.GET("/configurations/last", handler.GetLastDeployedConfiguration)
	// --- Memos ---
	api.GET("/memos",
		mymgmt.RequestResourcesAccess(
			fmt.Sprintf("%s/auth/resources", serverlib.GATEWAY_CONFIG.USER_MANAGEMENT_ADDRESS),
		),
		handler.GetMemosHandler,
	)
	api.POST("/memos", handler.CreateMemoHandler)
	memoGroup := api.Group("/memo")
	memoGroup.Use(
		mymgmt.RequestResourceAccess(
			fmt.Sprintf("%s/auth/resource/:id", serverlib.GATEWAY_CONFIG.USER_MANAGEMENT_ADDRESS),
			"id",
		),
	)
	memoGroup.GET("/:id", handler.GetMemoHandler)
	memoGroup.PUT("/:id/share", handler.UpdateShareMemoHandler)
	memoGroup.DELETE("/:id", handler.DeleteMemoHandler)
	memoGroup.PUT("/:id/items", handler.UpdateMemoItemsHandler)
	memoGroup.POST("/:id/items", handler.CreateMemoItemsHandler)
	memoGroup.DELETE("/:id/items", handler.DeleteMemoItemsHandler)
	// --- FORWARD TO MQTT ERROR INJECTION ENGINE ---
	api.GET(
		"/topics/suppressed",
		//handler.AuthorizeAccessToConfigurations(),
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS, "topics/suppressed"),
		),
	)
	api.POST(
		"/topics/cancel-suppression",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS, "topics/cancel-suppression"),
		),
	)
	api.GET(
		"/topics/intercepted",
		//handler.AuthorizeAccessToConfigurations(),
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS, "topics/intercepted"),
		),
	)
	api.POST(
		"/topics/cancel-interception",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS, "topics/cancel-interception"),
		),
	)
	// routes to rest interface of mqtt error injection engine
	api.GET(
		"/network",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS, "network"),
		),
	)
	// --- FORWARD TO USER MANAGEMENT ---
	admin := router.Group("/admin")
	admin.Use(
		mymgmt.ValidateJWT(),
		mymgmt.RequestAccessControlPolicyCheck(
			fmt.Sprintf("%s/auth/check-access", serverlib.GATEWAY_CONFIG.USER_MANAGEMENT_ADDRESS),
		),
	)
	admin.GET("/ping", handler.PongHandler)

	authGroup := router.Group("/auth")
	authGroup.Use(mymgmt.ValidateJWT())
	authGroup.GET(
		"/whoami",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.USER_MANAGEMENT_ADDRESS, "auth/whoami"),
		),
	)
	authGroup.PUT(
		"/password",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.USER_MANAGEMENT_ADDRESS, "auth/password"),
		),
	)
	authGroup.PUT(
		"/user",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.USER_MANAGEMENT_ADDRESS, "auth/user"),
		),
	)
	//unprotected routes
	router.POST("/login",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.USER_MANAGEMENT_ADDRESS, "login"),
		),
	)

	// --- FORWARD TO SHH ---
	// these routes address the SH Hub directly.
	// See routes for Home Assistant https://developers.home-assistant.io/docs/api/rest/
	shhRoutes := router.Group("/api")
	shhRoutes.Use(handler.SetSHHubToken())
	// /api/
	shhRoutes.GET(
		"/",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/"),
		),
	)
	shhRoutes.GET(
		"/config",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/config"),
		),
	)
	shhRoutes.GET(
		"/services",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/services"),
		),
	)
	shhRoutes.GET(
		"/history/period/:timespan",
		proxy.ForwardWithParameters(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/history/period/:timespan"), "timespan",
		),
	)
	shhRoutes.GET(
		"/logbook/:timespan",
		proxy.ForwardWithParameters(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/logbook/:timespan"), "timespan",
		),
	)
	shhRoutes.GET(
		"/states",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/states"),
		),
	)
	shhRoutes.GET(
		"/states/:entity_id",
		proxy.ForwardWithParameters(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/states/:entity_id"), "entity_id",
		),
	)
	shhRoutes.GET(
		"/error_log",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/error_log"),
		),
	)
	shhRoutes.GET(
		"/camera_proxy/:camera_entity_id",
		proxy.ForwardWithParameters(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/camera_proxy/:camera_entity_id"), "camera_entity_id",
		),
	)
	shhRoutes.GET(
		"/calendars",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/calendars"),
		),
	)
	shhRoutes.GET(
		"/calendars/:calendar_entity_id?start=<timestamp>&end=<timestamp>",
		proxy.ForwardWithParameters(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/calendars/:calendar_entity_id?start=<timestamp>&end=<timestamp>"), "camera_entity_id",
		),
	)
	shhRoutes.GET(
		"/config/automation/config/:entity_id",
		proxy.ForwardWithParameters(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/config/automation/config/:entity_id"), "entity_id",
		),
	)
	// --- POST ---
	shhRoutes.POST(
		"/states/:entity_id",
		proxy.ForwardWithParameters(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/states/:entity_id"), "entity_id",
		),
	)
	shhRoutes.POST(
		"/events/:event_type",
		proxy.ForwardWithParameters(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/events/:event_type"), "event_type",
		),
	)
	shhRoutes.POST(
		"/services/:domain/:service",
		proxy.ForwardWithParameters(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/services/:domain/:service"), []string{"domain", "service"}...,
		),
	)
	shhRoutes.POST(
		"/template",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/template"),
		),
	)
	shhRoutes.POST(
		"/config/core/check_config",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/config/core/check_config"),
		),
	)
	shhRoutes.POST(
		"/intent/handle",
		proxy.ForwardHandler(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/intent/handle"),
		),
	)

	shhRoutes.POST(
		"/config/automation/config/:entity_id",
		proxy.ForwardWithParameters(
			fmt.Sprintf("%s/%s", serverlib.GATEWAY_CONFIG.SHH_ADDRESS, "api/config/automation/config/:entity_id"), "entity_id",
		),
	)

	err := router.RunTLS(
		fmt.Sprintf(
			"%s:%s",
			serverlib.GATEWAY_CONFIG.HOST,
			serverlib.GATEWAY_CONFIG.PORT,
		),
		"./config/certs/cert.pem",
		"./config/certs/key.pem",
	)
	if err != nil {
		panic(err)
	}
}
