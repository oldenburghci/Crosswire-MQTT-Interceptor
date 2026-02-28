package startup

import (
	"fmt"
	"github.com/mochi-mqtt/server/v2/hooks/auth"
	"github.com/mochi-mqtt/server/v2/listeners"
	mymqtt "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/mqtt/hooks"
)

func StartMQTT() error {
	// port, auth hook should be represented in a config
	tcp := listeners.NewTCP(listeners.Config{
		ID: "t1",
		Address: fmt.Sprintf(
			"%s:%s",
			mymqtt.MITM_MQTT_ENGINE_CONFIG.EngineHost,
			mymqtt.MITM_MQTT_ENGINE_CONFIG.EnginePort,
		),
	})
	err := mymqtt.MITM_MQTT_SERVER.Server.AddListener(tcp)
	if err != nil {
		return err
	}

	// allows anonymous clients to connect to the startup
	authHook := new(auth.AllowHook)
	suppressHook := hooks.NewSuppressTopicHook(mymqtt.MITM_MQTT_SERVER)
	interceptionHook := hooks.NewInterceptionHook(mymqtt.MITM_MQTT_SERVER)
	//forwardHook, err := hooks.NewForwardingHook()
	//if err != nil {
	//	mymqtt.MITM_MQTT_SERVER.Server.Log.Error(fmt.Sprintf("error during NewForwardingHook(). err=%+v", err))
	//	os.Exit(1)
	//}
	// arrange the chain
	_ = mymqtt.MITM_MQTT_SERVER.Server.AddHook(authHook, nil)
	_ = mymqtt.MITM_MQTT_SERVER.Server.AddHook(suppressHook, nil)
	_ = mymqtt.MITM_MQTT_SERVER.Server.AddHook(interceptionHook, nil)
	//_ = mymqtt.MITM_MQTT_SERVER.Server.AddHook(forwardHook, nil)

	return mymqtt.MITM_MQTT_SERVER.Server.Serve()
}
