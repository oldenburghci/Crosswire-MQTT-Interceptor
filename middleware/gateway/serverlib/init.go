package serverlib

import (
	"fmt"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/db"
)

func init() {
	fmt.Println("init serverlib module")

	GATEWAY_CONFIG = gateway.NewGatewayConfig()

	provider, err := db.NewPostgresModelProvider(gateway.GetDatabaseEnvironment(gateway.NewGatewayConfig()))
	if err != nil {
		panic(err)
	}

	MODEL_PROVIDER = provider
}
