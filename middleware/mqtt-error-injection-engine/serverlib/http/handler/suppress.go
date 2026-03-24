package handler

import (
	"fmt"
	"github.com/gin-gonic/gin"
	mochimqtt "github.com/mochi-mqtt/server/v2"
	mymqtt "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/types"
	"net/http"
)

func GetTopicsHandler(context *gin.Context) {
	context.JSON(http.StatusOK, mymqtt.MITM_MQTT_SERVER.GetTopics())
}

func GetSuppressedTopicsHandler(context *gin.Context) {
	context.JSON(http.StatusOK, mymqtt.MITM_MQTT_SERVER.GetSuppressedTopics())
}

// PostSuppressionForTopicHandler adds a single topic into the internal managed topic slice. Invalid topic name,
// already suppressed or intercepted topics will be ignored.
func PostSuppressionForTopicHandler(context *gin.Context) {
	request := PostSuppressionForTopicRequest{}

	if err := context.ShouldBindJSON(&request); err != nil {
		mymqtt.MITM_MQTT_SERVER.Server.Log.Info(fmt.Sprintf("malformed request body. err=%+v", err))
		context.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body."})
		return
	}

	if !mochimqtt.IsValidFilter(request.TopicToSuppress.Name, false) {
		context.JSON(http.StatusBadRequest, gin.H{"message": "the topic name is invalid."})
		return
	}

	existing, _ := mymqtt.MITM_MQTT_SERVER.GetManagedTopic(request.TopicToSuppress.Name)

	if existing != nil {
		//topic is already managed by the server
		additional := ""
		if existing.IsSuppressed() {
			additional = "topic is already suppressed."
		}
		if existing.IsIntercepted() {
			additional = "topic is already intercepted."
		}

		context.JSON(http.StatusConflict, gin.H{"message": additional})
		return
	}
	//the NewMQTTTopic creates additional fields (mutex)
	topic := types.NewMQTTTopic(request.TopicToSuppress.Name)
	if ok := mymqtt.MITM_MQTT_SERVER.AddSuppressTopic(topic); !ok {
		context.JSON(http.StatusInternalServerError, gin.H{"message": "failed to add topic."})
		return
	}

	context.JSON(
		http.StatusOK,
		gin.H{
			"message": "ok",
			"detail":  fmt.Sprintf("suppress topic %s", request.TopicToSuppress.Name),
		},
	)
}

// PostSuppressionForTopicsHandler adds multiple topics into the internal managed topic slice. Invalid topic name,
// already suppressed or intercepted topics will be ignored.
func PostSuppressionForTopicsHandler(context *gin.Context) {
	request := PostSuppressionForTopicsRequest{}

	if err := context.ShouldBindJSON(&request); err != nil {
		mymqtt.MITM_MQTT_SERVER.Server.Log.Info(fmt.Sprintf("malformed request body. err=%+v", err))
		context.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body."})
		return
	}

	suppressedTopicsCount := 0
	suppressedTopics := make([]*types.MQTTTopic, 0)

	for _, topic := range request.TopicToSuppress {
		//omit the topic if the topic name is invalid due to invalid wildcard usage
		if !mochimqtt.IsValidFilter(topic.Name, false) {
			continue
		}

		existing, _ := mymqtt.MITM_MQTT_SERVER.GetManagedTopic(topic.Name)

		if existing != nil {
			//topic is already managed by the server
			continue
		}
		//the NewMQTTTopic creates additional fields (mutex)
		managed := types.NewMQTTTopic(topic.Name)
		if ok := mymqtt.MITM_MQTT_SERVER.AddSuppressTopic(managed); !ok {
			continue
		}

		suppressedTopics = append(suppressedTopics, &topic)
		suppressedTopicsCount++
	}

	responseStatus := http.StatusOK
	responseBody := gin.H{
		"message":    "ok",
		"detail":     fmt.Sprintf("suppress (%d/%d) topics", suppressedTopicsCount, len(request.TopicToSuppress)),
		"suppressed": suppressedTopics,
	}

	context.JSON(responseStatus, responseBody)
}

// PostCancelSuppressionForTopicHandler cancels the suppression for one topic and removes it from the managed topics.
func PostCancelSuppressionForTopicHandler(context *gin.Context) {
	request := PostCancelSuppressionForTopicRequest{}

	if err := context.ShouldBindJSON(&request); err != nil {
		mymqtt.MITM_MQTT_SERVER.Server.Log.Info(fmt.Sprintf("malformed request body. err=%+v", err))
		context.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body."})
		return
	}

	manged, err := mymqtt.MITM_MQTT_SERVER.GetManagedTopic(request.TopicToCancelSuppression.Name)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"message": "topic is not managed by the server."})
		return
	}
	manged.CancelSuppress()
	if !mymqtt.MITM_MQTT_SERVER.RemoveTopic(manged) {
		context.JSON(http.StatusInternalServerError, gin.H{"message": "failed to remove suppressed topic."})
		return
	}

	context.JSON(
		http.StatusOK,
		gin.H{
			"message": "ok",
			"detail":  fmt.Sprintf("cancel suppression for topic %s", request.TopicToCancelSuppression.Name),
		},
	)
}

func PostCancelSuppressionForTopicsHandler(context *gin.Context) {
	request := PostCancelSuppressionForTopicsRequest{}

	if err := context.ShouldBindJSON(&request); err != nil {
		mymqtt.MITM_MQTT_SERVER.Server.Log.Info(fmt.Sprintf("malformed request body. err=%+v", err))
		context.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body."})
		return
	}

	cancelSuppressionTopicsCount := 0
	cancelSuppressionTopics := make([]*types.MQTTTopic, 0)
	for _, topic := range request.TopicToCancelSuppression {

		managed, err := mymqtt.MITM_MQTT_SERVER.GetManagedTopic(topic.Name)
		if err != nil {
			continue
		}

		managed.CancelSuppress()
		if !mymqtt.MITM_MQTT_SERVER.RemoveTopic(managed) {
			continue
		}
		cancelSuppressionTopicsCount++
		cancelSuppressionTopics = append(cancelSuppressionTopics, &topic)
	}

	context.JSON(
		http.StatusOK,
		gin.H{
			"message":   "ok",
			"detail":    fmt.Sprintf("cancel suppression for (%d/%d) topics", cancelSuppressionTopicsCount, len(request.TopicToCancelSuppression)),
			"cancelled": cancelSuppressionTopics,
		},
	)
}
