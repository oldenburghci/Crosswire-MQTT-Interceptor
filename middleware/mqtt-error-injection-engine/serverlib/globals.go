package serverlib

import (
	mitm_mqtt_proxy "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/mqtt"
)

var MITM_MQTT_SERVER *mqtt.MITMMQTTServer
var MITM_MQTT_ENGINE_CONFIG *mitm_mqtt_proxy.MQTTMITMProxyConfig
var REMOTE_BROKER_CONFIG *mitm_mqtt_proxy.RemoteMQTTBrokerConfig
var REST_ENDPOINT_CONFIG *mitm_mqtt_proxy.RESTEndpointConfig
