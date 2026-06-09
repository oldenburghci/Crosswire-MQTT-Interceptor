package handler

import (
	"fmt"
	"github.com/gin-gonic/gin"
	mymqtt "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib"
	"net/http"
)

func PongHandler(context *gin.Context) {
	context.JSON(http.StatusOK, gin.H{
		"message": "pong",
	})
}

func ScheduleParsingHandler(context *gin.Context) {
	request := PostSuppressionForTopicRequest{}

	if err := context.ShouldBindJSON(&request); err != nil {
		mymqtt.MITM_MQTT_SERVER.Server.Log.Info(fmt.Sprintf("Parsing request failed: %v", err))
		context.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body."})
		return
	}

	mymqtt.MITM_MQTT_SERVER.Server.Log.Info(fmt.Sprintf("server parsed request: %+v", request))

	context.JSON(http.StatusOK, request)
}

func GetNetworkHandler(context *gin.Context) {
	result, err := mymqtt.MITM_MQTT_SERVER.RequestNetworkScan()
	if err != nil {
		context.JSON(
			http.StatusAccepted,
			gin.H{
				"message": "scanning in progress",
			},
		)
		return
	}
	context.JSON(http.StatusOK, gin.H{
		"message": "scanned",
		"result":  result,
	})
}
