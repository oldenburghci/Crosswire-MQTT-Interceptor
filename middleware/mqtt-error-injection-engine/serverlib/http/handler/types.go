package handler

import "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/types"

type PostSuppressionForTopicRequest struct {
	TopicToSuppress types.MQTTTopic `json:"topic"`
}

type PostCancelSuppressionForTopicRequest struct {
	TopicToCancelSuppression types.MQTTTopic `json:"topic"`
}

type PostSuppressionForTopicsRequest struct {
	TopicToSuppress []types.MQTTTopic `json:"topics"`
}

type PostCancelSuppressionForTopicsRequest struct {
	TopicToCancelSuppression []types.MQTTTopic `json:"topics"`
}
