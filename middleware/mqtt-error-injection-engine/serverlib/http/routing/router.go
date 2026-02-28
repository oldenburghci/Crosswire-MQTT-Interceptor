package routing

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/http/handler"
)

func StartHTTP() error {
	//TODO: Security Headers
	//TODO: Token Validation?
	router := gin.Default()
	//just for debug purposes
	router.GET("/ping", handler.PongHandler)
	router.POST("/scheduled", handler.ScheduleParsingHandler)
	router.GET("/network", handler.GetNetworkHandler)

	topics := router.Group("topics")
	topics.GET("", handler.GetTopicsHandler)
	topics.GET("/suppressed", handler.GetSuppressedTopicsHandler)
	topics.POST("/suppress", handler.PostSuppressionForTopicsHandler)
	topics.POST("/cancel-suppression", handler.PostCancelSuppressionForTopicsHandler)

	topics.GET("/intercepted", handler.GetActiveInterceptionsHandler)
	topics.POST("/intercept/manual", handler.PostManualInterceptionHandler)
	topics.POST("/intercept/template", handler.PostTemplateInterceptionHandler)
	topics.POST("/cancel-interception", handler.PostCancelInterceptionHandler)
	// websockets are only operational with GET
	topics.GET("/intercept/subscribe/:key", handler.SubscribeInterceptionHandler)

	topic := router.Group("topic")
	topic.POST("/suppress", handler.PostSuppressionForTopicHandler)
	topic.POST("/cancel-suppression", handler.PostCancelSuppressionForTopicHandler)

	return router.RunTLS(
		fmt.Sprintf(
			"%s:%s",
			serverlib.REST_ENDPOINT_CONFIG.EngineHost,
			serverlib.REST_ENDPOINT_CONFIG.EnginePort,
		),
		"./config/certs/cert.pem",
		"./config/certs/key.pem",
	)
}
