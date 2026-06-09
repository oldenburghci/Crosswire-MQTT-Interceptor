package gateway

import (
	"fmt"
	"os"
)

type GatewayConfig struct {
	DB_HOST   string
	DB_PORT   string
	DB_USER   string
	DB_PASSWD string

	JWT_SECRET string

	HOST string
	PORT string

	SHH_TOKEN   string
	SHH_ADDRESS string

	MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS string

	LAST_CONFIGURATION_DEPLOYED    string
	LAST_CONFIGURATION_DEPLOYED_BY string

	USER_MANAGEMENT_ADDRESS string
}

func NewGatewayConfig() *GatewayConfig {
	config := GatewayConfig{
		DB_HOST:                                  GetFromEnvironment("DB_HOST"),
		DB_PORT:                                  GetFromEnvironment("DB_PORT"),
		DB_USER:                                  GetFromEnvironment("DB_USER"),
		DB_PASSWD:                                GetFromEnvironment("DB_PASSWD"),
		JWT_SECRET:                               GetFromEnvironment("JWT_SECRET"),
		HOST:                                     GetFromEnvironment("HOST"),
		PORT:                                     GetFromEnvironment("PORT"),
		SHH_TOKEN:                                GetFromEnvironment("SHH_TOKEN"),
		SHH_ADDRESS:                              GetFromEnvironment("SHH_ADDRESS"),
		MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS: GetFromEnvironment("MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS"),
		USER_MANAGEMENT_ADDRESS:                  GetFromEnvironment("USER_MANAGEMENT_ADDRESS"),
	}
	return &config
}

func GetFromEnvironment(name string) string {
	variable, present := os.LookupEnv(name)
	if present == false {
		panic(fmt.Sprintf("[SERVE] the mandatory enviroment variable %s isn't present\n", name))
	}
	return variable
}

func GetDatabaseEnvironment(config *GatewayConfig) map[string]string {
	dbConfigMap := make(map[string]string)
	dbConfigMap["DB_HOST"] = config.DB_HOST
	dbConfigMap["DB_PORT"] = config.DB_PORT
	dbConfigMap["DB_USER"] = config.DB_USER
	dbConfigMap["DB_PASSWD"] = config.DB_PASSWD
	return dbConfigMap
}
