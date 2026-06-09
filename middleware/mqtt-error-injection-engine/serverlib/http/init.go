package http

import (
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/types"
)

func init() {
	REST_SERVER = types.NewRESTEndpoint()
}
