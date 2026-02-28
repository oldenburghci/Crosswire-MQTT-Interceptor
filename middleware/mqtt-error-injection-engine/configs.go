package mitm_mqtt_proxy

import (
	"fmt"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/utils"
)

type RemoteMQTTBrokerConfig struct {
	// <protocol>://<ip>:<port>
	FullBrokerAddr string
	Username       string
	Password       string
}

type MQTTMITMProxyConfig struct {
	EngineHost string
	EnginePort string
}

type RESTEndpointConfig struct {
	EngineHost string
	EnginePort string
}

func NewRemoteMQTTBrokerConfig() *RemoteMQTTBrokerConfig {
	addr, err := utils.GetFromEnvironment("FULL_BROKER_ADDR")
	if err != nil {
		addr = "tcp://localhost:18883"
		fmt.Printf(
			"[SERVE] the mandatory environment variable %s isn't present. Set to default value %s.\n",
			"FULL_BROKER_ADDR",
			addr,
		)
	}
	username, err := utils.GetFromEnvironment("BROKER_USERNAME")
	if err != nil {
		username = "mainten01"
		fmt.Printf(
			"[SERVE] the mandatory environment variable %s isn't present. Set to default value %s.\n",
			"BROKER_USERNAME",
			username,
		)
	}
	passwd, err := utils.GetFromEnvironment("BROKER_PASSWD")
	if err != nil {
		passwd = "mainten01"
		fmt.Printf(
			"[SERVE] the mandatory environment variable %s isn't present. Set to default value %s.\n",
			"BROKER_PASSWORD",
			passwd,
		)
	}

	return &RemoteMQTTBrokerConfig{
		FullBrokerAddr: addr.(string),
		Username:       username.(string),
		Password:       passwd.(string),
	}
}

func NewMQTTMITMProxyConfig() *MQTTMITMProxyConfig {
	engineHost, err := utils.GetFromEnvironment("MQTT_ENGINE_HOST")
	if err != nil {
		engineHost = "0.0.0.0"
		fmt.Printf(
			"[SERVE] the mandatory environment variable %s isn't present. Set to default value %s.\n",
			"ENGINE_HOST",
			engineHost,
		)
	}
	enginePort, err := utils.GetFromEnvironment("MQTT_ENGINE_PORT")
	if err != nil {
		enginePort = "1883"
		fmt.Printf(
			"[SERVE] the mandatory environment variable %s isn't present. Set to default value %s.\n",
			"ENGINE_PORT",
			enginePort,
		)
	}
	return &MQTTMITMProxyConfig{
		EngineHost: engineHost.(string),
		EnginePort: enginePort.(string),
	}

}

func NewRESTEndpointConfig() *RESTEndpointConfig {
	engineHost, err := utils.GetFromEnvironment("REST_ENGINE_HOST")
	if err != nil {
		engineHost = "0.0.0.0"
		fmt.Printf(
			"[SERVE] the mandatory environment variable %s isn't present. Set to default value %s.\n",
			"REST_ENGINE_HOST",
			engineHost,
		)
	}

	enginePort, err := utils.GetFromEnvironment("REST_ENGINE_PORT")
	if err != nil {
		enginePort = "8080"
		fmt.Printf(
			"[SERVE] the mandatory environment variable %s isn't present. Set to default value %s.\n",
			"REST_ENGINE_PORT",
			enginePort,
		)
	}

	return &RESTEndpointConfig{
		EngineHost: engineHost.(string),
		EnginePort: enginePort.(string),
	}
}
