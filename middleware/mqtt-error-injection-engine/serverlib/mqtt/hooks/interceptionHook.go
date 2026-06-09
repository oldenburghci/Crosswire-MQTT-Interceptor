package hooks

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/google/go-cmp/cmp"
	mochimqtt "github.com/mochi-mqtt/server/v2"
	"github.com/mochi-mqtt/server/v2/packets"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/http/handler"
	mymqtt "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/mqtt"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/types"
	"slices"
)

type InterceptionHook struct {
	mochimqtt.HookBase
	Server *mymqtt.MITMMQTTServer
}

func NewInterceptionHook(server *mymqtt.MITMMQTTServer) *InterceptionHook {
	result := &InterceptionHook{
		Server: server,
	}
	return result
}

func (hook *InterceptionHook) Provides(b byte) bool {
	// This method is called by the framework to indicate, which method of the hook is ready to be hooked into the
	//respective event
	return bytes.Contains([]byte{
		mochimqtt.OnPublish,
	}, []byte{b})
}

func (hook *InterceptionHook) OnPublish(cl *mochimqtt.Client, pk packets.Packet) (packets.Packet, error) {
	//fast filter
	if !slices.Contains(serverlib.MITM_MQTT_SERVER.GetInterceptedTopicNames(), pk.TopicName) {
		return pk, nil
	}
	// ignore error, because the previous call prevents a non-existence
	// take only the topics that have the same name
	topics, _ := serverlib.MITM_MQTT_SERVER.GetManagedTopics(pk.TopicName)
	// parse payload for deep inspection
	var payloadJSON interface{}
	var payloadText string
	// not parsable
	json.Unmarshal(pk.Payload, &payloadJSON)
	payloadText = string(pk.Payload)

	for _, topic := range topics {
		hook.handleTemplateInterception(payloadJSON, payloadText, &pk, topic)

		if topic.IsManuallyIntercepted() {
			clientResponse, err := handler.StreamInterception(pk)
			if err != nil {
				// a parsing error always results in a pass through of original message
				return pk, nil
			}
			switch clientResponse.Control {
			case "overwrite":
				pk.Payload = []byte(clientResponse.NewMessage)
			case "suppress":
				pk.Ignore = true
			default:
				break
			}
		}
	}
	return pk, nil
}

func (hook *InterceptionHook) handleTemplateInterception(payloadAsJSON interface{}, payloadAsText string, pk *packets.Packet, topic *types.MQTTTopic) {
	if !topic.IsTemplateBasedIntercepted() {
		return
	}
	//wildcard filter
	if topic.InputTemplate.IsPlain() {
		if topic.InputTemplate.Plain == "*" {
			hook.substituteMessages(pk, topic)
			fmt.Printf(
				"packet intercepetion rule applicable:\ntopicName=%s\n\tRule=wildcard\n",
				topic.Name,
			)
			return
		}
	}

	if payloadAsJSON != nil {
		//match parse payloadJSON against ruleJSON
		var ruleJSON interface{}
		if err := json.Unmarshal(topic.InputTemplate.JSON, &ruleJSON); err != nil {
			fmt.Printf("Error unmarshalling template: %s\n", err.Error())
		}

		if equal := cmp.Equal(ruleJSON, payloadAsJSON); !equal {
			// job done, this filter is not applicable
			return
		}
		//the filter is applicable. We will substitute the original message with the template and stop all further
		// processing
		hook.substituteMessages(pk, topic)
		fmt.Printf(
			"packet interception rule applicable:\n\ttopicName=%s\n\tRule=%+v\n",
			topic.Name,
			ruleJSON,
		)
		return
	}

	if payloadAsText != "" {
		if payloadAsText != topic.InputTemplate.Plain {
			return
		}
		// this filter is applicable. Substitute and pass all further operations
		hook.substituteMessages(pk, topic)
		fmt.Printf(
			"packet interception rule applicable:\n\ttopicName=%s\n\tRule=%+v\n",
			topic.Name,
			topic.InputTemplate.Plain,
		)
	}
}

func (hook *InterceptionHook) substituteMessages(pk *packets.Packet, topic *types.MQTTTopic) {
	template := topic.OutputTemplate.JSON
	if topic.OutputTemplate.IsPlain() {
		template = []byte(topic.OutputTemplate.Plain)
	}
	pk.Payload = template
}
