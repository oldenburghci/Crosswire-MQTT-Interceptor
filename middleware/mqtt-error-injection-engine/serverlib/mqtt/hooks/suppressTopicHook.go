package hooks

import (
	"bytes"
	"fmt"
	mochimqtt "github.com/mochi-mqtt/server/v2"
	"github.com/mochi-mqtt/server/v2/packets"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib"
	mymqtt "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/mqtt"
	"slices"
	"strings"
)

type SuppressTopicHook struct {
	mochimqtt.HookBase
	Server *mymqtt.MITMMQTTServer
}

func NewSuppressTopicHook(server *mymqtt.MITMMQTTServer) *SuppressTopicHook {
	result := &SuppressTopicHook{
		Server: server,
	}
	return result
}

func (hook *SuppressTopicHook) Provides(b byte) bool {
	// This method is called by the framework to indicate, which method of the hook is ready to be hooked into the
	//respective event
	return bytes.Contains([]byte{
		mochimqtt.OnPublish,
	}, []byte{b})
}

func (hook *SuppressTopicHook) OnPublish(cl *mochimqtt.Client, pk packets.Packet) (packets.Packet, error) {
	// check if the topic is suppressed
	direct, wildcards := serverlib.MITM_MQTT_SERVER.GetSuppressedTopicNames()
	if slices.Contains(direct, pk.TopicName) {
		// set the ignore flag
		pk.Ignore = true
		hook.Server.Server.Log.Info(fmt.Sprintf("Message for topic=%s suppressed.", pk.TopicName))
		return pk, nil
	}

	for _, w := range wildcards {
		//strip wildcard from w and check if the strippedToLevelSeparator w is substring of pk.TopicName
		// e.g. the suppression might look like: 'a/#' which includes 'a/a', 'a/a/a' but also 'a'
		if !MatchTopic(w, pk.TopicName) {
			continue
		}
		hook.Server.Server.Log.Info(fmt.Sprintf("Message for topic=%s suppressed, filter applied", pk.TopicName))
		pk.Ignore = true
		return pk, nil
	}
	return pk, nil
}

//Made wit perplexity.ai, prompts:
// 1) Do you know about the MQTT Version Wildcard subscription with '+' and '#' 2) Can you write an algorithm in golang that matches a topic name against wildcard patterns?

// MatchTopic checks if a topic matches a MQTT wildcard pattern ('#' | '+')
func MatchTopic(pattern, topic string) bool {
	patternParts := strings.Split(pattern, "/")
	topicParts := strings.Split(topic, "/")
	return matchParts(patternParts, topicParts)
}

func matchParts(patternParts, topicParts []string) bool {
	i, j := 0, 0

	for i < len(patternParts) && j < len(topicParts) {
		currentPattern := patternParts[i]

		switch {
		case currentPattern == "#":
			// Multi-level wildcard must be last element
			return i == len(patternParts)-1

		case currentPattern == "+":
			// Single-level wildcard
			i++
			j++

		case currentPattern == topicParts[j]:
			// Exact match
			i++
			j++

		default:
			// No match
			return false
		}
	}

	// Handle remaining pattern parts
	if i < len(patternParts) {
		// Check if remaining pattern is a single '#'
		return len(patternParts[i:]) == 1 && patternParts[i] == "#"
	}

	// All pattern parts matched - verify topic is fully consumed
	return j == len(topicParts)
}
