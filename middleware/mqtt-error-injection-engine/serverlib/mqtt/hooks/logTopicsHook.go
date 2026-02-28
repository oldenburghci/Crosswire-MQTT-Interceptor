package hooks

import (
	"bytes"
	mochimqtt "github.com/mochi-mqtt/server/v2"
	"github.com/mochi-mqtt/server/v2/packets"
	mymqtt "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/mqtt"
)

// The whole class became obsolete
type LogTopicsHook struct {
	mochimqtt.HookBase
	Server *mymqtt.MITMMQTTServer
}

func NewLogTopicsHook(server *mymqtt.MITMMQTTServer) *LogTopicsHook {
	result := &LogTopicsHook{
		Server: server,
	}
	return result
}

func (hook *LogTopicsHook) OnPublish(cl *mochimqtt.Client, pk packets.Packet) (packets.Packet, error) {
	//hook.Server.GetTopicNames()

	//if !slices.Contains(hook.Server.Topics.Topics, gentypes.MQTTTopic{Name: pk.TopicName}) {
	//	hook.Server.Topics.Topics = append(
	//		hook.Server.Topics.Topics,
	//		gentypes.MQTTTopic{
	//			Name: pk.TopicName,
	//		},
	//	)
	//}

	return pk, nil
}

//func (hook *LogTopicsHook) OnConnect() {}

func (hook *LogTopicsHook) Provides(b byte) bool {

	return bytes.Contains([]byte{
		mochimqtt.OnPublish,
	}, []byte{b})
}

func (hook *LogTopicsHook) ID() string {
	return "LogTopicsHook"
}
