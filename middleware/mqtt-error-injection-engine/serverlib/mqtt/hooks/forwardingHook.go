package hooks

import (
	"bytes"
	"fmt"
	pahomqtt "github.com/eclipse/paho.mqtt.golang"
	mochimqtt "github.com/mochi-mqtt/server/v2"
	"github.com/mochi-mqtt/server/v2/packets"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib"
)

type ForwardingHook struct {
	mochimqtt.HookBase
	forwardClient pahomqtt.Client
	SendFlag      bool
}

func (hook *ForwardingHook) Provides(b byte) bool {
	return bytes.Contains([]byte{
		mochimqtt.OnPublish,
	}, []byte{b})
}

func (hook *ForwardingHook) OnPublish(cl *mochimqtt.Client, pk packets.Packet) (packets.Packet, error) {
	// exit before forwarding if Ignore is true
	if pk.Ignore {
		return pk, nil
	}
	serverlib.MITM_MQTT_SERVER.Server.Log.Info(
		fmt.Sprintf(
			"Forward published package from client=%s, topic=%s to remote broker",
			cl.Net.Remote,
			pk.TopicName,
		),
	)

	payload := pk.Payload

	token := hook.forwardClient.Publish(pk.TopicName, byte(0), true, payload)
	go func() {
		<-token.Done()
		if token.Error() != nil {
			serverlib.MITM_MQTT_SERVER.Server.Log.Error(fmt.Sprintf("error during forwarding. err=%+v", token.Error()))
		}
	}()
	return pk, nil
}

func NewForwardingHook() (*ForwardingHook, error) {
	options := pahomqtt.NewClientOptions()
	options.AddBroker(serverlib.REMOTE_BROKER_CONFIG.FullBrokerAddr)
	options.SetClientID("MQTT-MITM-Broker")
	options.SetUsername(serverlib.REMOTE_BROKER_CONFIG.Username)
	options.SetPassword(serverlib.REMOTE_BROKER_CONFIG.Password)

	client := pahomqtt.NewClient(options)
	token := client.Connect()
	<-token.Done()
	if token.Error() != nil {
		return nil, token.Error()
	}

	result := ForwardingHook{
		forwardClient: client,
		SendFlag:      false,
	}
	return &result, nil
}
