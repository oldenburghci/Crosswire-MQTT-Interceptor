package serverlib

import (
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/types"
	mgmttypes "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/user-management/serverlib/types"
)

var AUTH_MODEL_DB mgmttypes.RBACModelPersistenceProvider
var MODEL_PROVIDER types.ApplicationDataPersistenceProvider

var GATEWAY_CONFIG *gateway.GatewayConfig
