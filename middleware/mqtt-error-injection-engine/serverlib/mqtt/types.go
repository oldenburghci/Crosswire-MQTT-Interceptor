package mqtt

import (
	"encoding/json"
	"errors"
	"fmt"
	mochimqtt "github.com/mochi-mqtt/server/v2"
	"github.com/mochi-mqtt/server/v2/packets"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/types"
	"slices"
	"strings"
	"sync"
)

type MITMMQTTServer struct {
	// realized as composition
	Server *mochimqtt.Server
	Hooks  []mochimqtt.HookBase

	mutexManagedTopics sync.RWMutex
	managedTopics      types.MQTTTopics

	mutexNetworkScan  sync.RWMutex
	waitNetworkScan   sync.WaitGroup
	networkScanResult []byte
}

// TODO: Write documentation!
func NewMITMMQTTServer() *MITMMQTTServer {
	return &MITMMQTTServer{
		Server: mochimqtt.New(
			&mochimqtt.Options{
				InlineClient: true,
			},
		),
		mutexManagedTopics: sync.RWMutex{},
		managedTopics: types.MQTTTopics{
			Topics: make([]*types.MQTTTopic, 0),
		},
		mutexNetworkScan:  sync.RWMutex{},
		waitNetworkScan:   sync.WaitGroup{},
		networkScanResult: make([]byte, 0),
	}
}

// TODO: Write documentation!
func (s *MITMMQTTServer) GetTopicNames() []string {
	result := make([]string, 0)
	// GetAll is a thread-safe call
	packets := s.Server.Topics.Retained.GetAll()
	for _, packet := range packets {
		// default topics from the broker start with this $SYS prefix
		if strings.HasPrefix(packet.TopicName, "$SYS") {
			continue
		}
		result = append(result, packet.TopicName)
		s.Server.Log.Info(fmt.Sprintf("Retained packet: %s", packet.TopicName))
	}

	return result
}

//func (s *MITMMQTTServer) GetManagedTopics() types.MQTTTopics {
//	s.mutexManagedTopics.RLock()
//	defer s.mutexManagedTopics.RUnlock()
//	result := types.MQTTTopics{
//		Topics: make([]*types.MQTTTopic, 0),
//	}
//	for _, topic := range s.managedTopics.Topics {
//		result.Topics = append(result.Topics, topic)
//	}
//	return result
//}

// TODO: Write documentation!
// TODO: This should iterate through the managedTopics
func (s *MITMMQTTServer) GetTopics() types.MQTTTopics {
	result := types.MQTTTopics{
		Topics: make([]*types.MQTTTopic, 0),
	}
	// GetAll is a thread-safe call
	packets := s.Server.Topics.Retained.GetAll()
	for _, packet := range packets {
		// default topics from the broker start with this $SYS prefix
		if strings.HasPrefix(packet.TopicName, "$SYS") {
			continue
		}
		result.Topics = append(result.Topics, &types.MQTTTopic{Name: packet.TopicName})
	}

	return result
}

func (s *MITMMQTTServer) GetManagedTopic(topicName string) (*types.MQTTTopic, error) {
	s.mutexManagedTopics.RLock()
	defer s.mutexManagedTopics.RUnlock()
	i := slices.IndexFunc(s.managedTopics.Topics, func(t *types.MQTTTopic) bool { return t.Name == topicName })
	if i != -1 {
		return s.managedTopics.Topics[i], nil
	}
	return nil, errors.New("topic not found")
}

func (s *MITMMQTTServer) GetManagedTopics(topicName string) ([]*types.MQTTTopic, error) {
	s.mutexManagedTopics.RLock()
	defer s.mutexManagedTopics.RUnlock()
	result := make([]*types.MQTTTopic, 0)

	for i := range s.managedTopics.Topics {
		topic := s.managedTopics.Topics[i]
		if topic.Name != topicName {
			continue
		}
		result = append(result, topic)
	}
	return result, nil
}

// GetSuppressedTopicNames iterates through the current list of all suppressed topics and returns two disjoint slices
// where first slice holds all currently suppressed topics and the second slice holds suppressed topics with wildcard
// characters in the topic name. The call is thread safe.
func (s *MITMMQTTServer) GetSuppressedTopicNames() ([]string, []string) {
	directTopics := make([]string, 0)
	wildcardTopics := make([]string, 0)
	//we don't have to verify if the topic names are valid, that is done before.
	//we can therefore assume that the name is valid.
	for _, topic := range s.GetSuppressedTopics().Topics {
		if strings.ContainsRune(topic.Name, '#') || strings.ContainsRune(topic.Name, '+') {
			wildcardTopics = append(wildcardTopics, topic.Name)
			continue
		}
		directTopics = append(directTopics, topic.Name)
	}
	return directTopics, wildcardTopics
}

// GetSuppressedTopics iterates through the current slice of managed topics and returns those that are currently suppressed.
func (s *MITMMQTTServer) GetSuppressedTopics() types.MQTTTopics {
	s.mutexManagedTopics.RLock()
	defer s.mutexManagedTopics.RUnlock()
	result := types.MQTTTopics{
		Topics: make([]*types.MQTTTopic, 0),
	}
	for _, topic := range s.managedTopics.Topics {
		if topic.IsSuppressed() {
			result.Topics = append(result.Topics, topic)
		}
	}
	return result
}

// TODO: Check and update the usage of this function
// TODO: Write documentation!
func (s *MITMMQTTServer) AddSuppressTopic(topic *types.MQTTTopic) bool {
	// already suppressed
	if topic.IsSuppressed() {
		return false
	}

	s.mutexManagedTopics.Lock()
	defer s.mutexManagedTopics.Unlock()

	if !slices.ContainsFunc(s.managedTopics.Topics, func(t *types.MQTTTopic) bool {
		return t.Name == topic.Name
	}) {
		if err := topic.Suppress(); err != nil {
			return false
		}
		s.Server.Log.Info(fmt.Sprintf("Adding topic for supression: %s", topic.Name))
		s.managedTopics.Topics = append(s.managedTopics.Topics, topic)
		return true
	}
	//already in the collection
	return false
}

//// TODO: Check and update the usage of this function
//// TODO: Write documentation!
//func (s *MITMMQTTServer) RemoveSuppressedTopic(topic *types.MQTTTopic) bool {
//	s.mutexManagedTopics.Lock()
//	defer s.mutexManagedTopics.Unlock()
//	i := slices.IndexFunc(s.managedTopics.Topics, func(t *types.MQTTTopic) bool {
//		return t.Name == topic.Name
//	})
//	// is in
//	if i != -1 {
//		s.managedTopics.Topics = append(s.managedTopics.Topics[:i], s.managedTopics.Topics[i+1:]...)
//		topic.CancelSuppress()
//		return true
//	}
//	return false
//}

// TODO: Write documentation! Really required?
//func (s *MITMMQTTServer) IsTopicSuppressed(topic *types.MQTTTopic) bool {
//	s.mutexManagedTopics.RLock()
//	defer s.mutexManagedTopics.RUnlock()
//
//	return slices.ContainsFunc(s.managedTopics.Topics, func(t *types.MQTTTopic) bool {
//		return t.Name == topic.Name
//	})
//}

// Manage InterceptedTopics

// AddInterceptedTopic adds the topic into the slice of managed topics and marks it as currently intercepted. The topic
// is rejected from the managed topics if the topic is already suppressed or if there already exists a topic with this
// name in the managed topics. The call is thread-safe.
func (s *MITMMQTTServer) AddInterceptedTopic(topic *types.MQTTTopic) bool {
	// suppressed topics can't be intercepted
	if topic.IsSuppressed() {
		return false
	}

	s.mutexManagedTopics.Lock()
	defer s.mutexManagedTopics.Unlock()
	fmt.Printf("topic=%v\n", topic)
	if !slices.ContainsFunc(s.managedTopics.Topics, func(t *types.MQTTTopic) bool {
		return t.EqualMatch(topic)
	}) {
		if err := topic.Intercept(); err != nil {
			return false
		}
		s.Server.Log.Info(fmt.Sprintf("Adding topic for interception: %s", topic.Name))
		s.managedTopics.Topics = append(s.managedTopics.Topics, topic)
		return true
	}
	return false
}

// RemoveTopic removes a topic from the managed topics slice. The request is rejected if the topic is not in the managed
// topics slice or if the topic is still used (suppressed or intercepted). The method is thread-safe.
func (s *MITMMQTTServer) RemoveTopic(topic *types.MQTTTopic) bool {
	s.mutexManagedTopics.Lock()
	defer s.mutexManagedTopics.Unlock()
	i := slices.IndexFunc(s.managedTopics.Topics, func(t *types.MQTTTopic) bool {
		return t.Name == topic.Name
	})
	// is not in
	if i == -1 {
		return false
	}
	// is still used
	if topic.IsSuppressed() || topic.IsIntercepted() {
		return false
	}
	// remove
	s.managedTopics.Topics = append(s.managedTopics.Topics[:i], s.managedTopics.Topics[i+1:]...)
	topic.CancelIntercept()
	return true
}

//// TODO: Really required?
//func (s *MITMMQTTServer) IsTopicIntercepted(topic *types.MQTTTopic) bool {
//	s.mutexManagedTopics.RLock()
//	defer s.mutexManagedTopics.RUnlock()
//
//	return slices.ContainsFunc(s.managedTopics.Topics, func(t *types.MQTTTopic) bool { return t.Name == topic.Name })
//}

func (s *MITMMQTTServer) GetInterceptedTopics() *types.MQTTTopics {
	result := types.MQTTTopics{
		Topics: make([]*types.MQTTTopic, 0),
	}
	s.mutexManagedTopics.RLock()
	defer s.mutexManagedTopics.RUnlock()
	for _, topic := range s.managedTopics.Topics {
		if topic.IsIntercepted() {
			result.Topics = append(result.Topics, topic)
		}
	}
	return &result
}

func (s *MITMMQTTServer) GetInterceptedTopicNames() []string {
	result := make([]string, 0)
	topics := s.GetInterceptedTopics()
	for _, topic := range topics.Topics {
		result = append(result, topic.Name)
	}
	return result
}

//// GetInterceptedTopic TODO: Deprecated
//func (s *MITMMQTTServer) GetInterceptedTopic(topicName string) (*types.MQTTTopic, bool) {
//	s.mutexManagedTopics.RLock()
//	defer s.mutexManagedTopics.RUnlock()
//
//	i := slices.IndexFunc(s.managedTopics.Topics, func(t *types.MQTTTopic) bool {
//		return t.Name == topicName
//	})
//	if i == -1 {
//		return nil, false
//	}
//	topic := s.managedTopics.Topics[i]
//
//	return topic, true
//}

func (s *MITMMQTTServer) RequestNetworkScan() (map[string]interface{}, error) {
	// lock the access to this method because it denies communication within the lab
	if !s.mutexNetworkScan.TryLock() {
		return nil, errors.New("already a network scan running")
	}
	// if the lock is available do the request.

	err := s.Server.Subscribe("zigbee2mqtt/bridge/response/networkmap", 99, s.CallbackNetworkScan)
	if err != nil {
		s.Server.Log.Error("Failed to subscribe to zigbee2mqtt/bridge/response: %s\n", err.Error())
		return nil, err
	}

	err = s.Server.Publish("zigbee2mqtt/bridge/request/networkmap", []byte("raw"), true, 2)
	if err != nil {
		s.Server.Log.Error("%s\n", err.Error())
		return nil, err
	}
	// fetch the result from s as soon as the results are here
	s.waitNetworkScan.Add(1)
	s.waitNetworkScan.Wait()
	scanResult := make(map[string]interface{})

	if err := json.Unmarshal(s.networkScanResult, &scanResult); err != nil {
		s.Server.Log.Error("%s\n", err.Error())
		return nil, err
	}
	return scanResult, err
	//yes, it is intentional that the lock is not release in this code here
}

func (s *MITMMQTTServer) CallbackNetworkScan(cl *mochimqtt.Client, sub packets.Subscription, pk packets.Packet) {
	defer s.mutexNetworkScan.Unlock()
	defer s.waitNetworkScan.Done()
	s.Server.Log.Info("Network scan done")
	//s.Server.Log.Info("inline client received message from subscription", "client", cl.ID, "subscriptionId", sub.Identifier, "topic", pk.TopicName, "payload", string(pk.Payload))
	s.networkScanResult = pk.Payload
	err := s.Server.Unsubscribe("zigbee2mqtt/bridge/response/networkmap", 99)
	if err != nil {
		s.Server.Log.Warn("%s\n", err.Error())
	}
}
