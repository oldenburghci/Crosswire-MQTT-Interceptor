package serverlib

import (
	mitm_mqtt_proxy "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/mqtt"
)

func init() {
	// assign something to global variable
	MITM_MQTT_SERVER = mqtt.NewMITMMQTTServer()
	MITM_MQTT_ENGINE_CONFIG = mitm_mqtt_proxy.NewMQTTMITMProxyConfig()
	REMOTE_BROKER_CONFIG = mitm_mqtt_proxy.NewRemoteMQTTBrokerConfig()
	REST_ENDPOINT_CONFIG = mitm_mqtt_proxy.NewRESTEndpointConfig()
}
