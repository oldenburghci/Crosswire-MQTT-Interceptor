package types

import (
	"errors"
	"fmt"
	"github.com/gorilla/websocket"
	"slices"
	"sync"
)

type RESTEndpoint struct {
	KeyToInterceptedTopics          map[string][]*MQTTTopic
	keyToInterceptedTopicsMutex     sync.RWMutex
	KeyToClients                    map[string][]*websocket.Conn // register clients receive intercepted topics
	keyToClientsMutex               sync.RWMutex
	InterceptedTopicNameToKeys      map[string][]string
	interceptedTopicNamesToKeyMutex sync.RWMutex
}

func NewRESTEndpoint() *RESTEndpoint {
	return &RESTEndpoint{
		KeyToInterceptedTopics:          make(map[string][]*MQTTTopic),
		keyToInterceptedTopicsMutex:     sync.RWMutex{},
		KeyToClients:                    make(map[string][]*websocket.Conn),
		keyToClientsMutex:               sync.RWMutex{},
		InterceptedTopicNameToKeys:      make(map[string][]string),
		interceptedTopicNamesToKeyMutex: sync.RWMutex{},
	}
}

// AddTopicsToIntercept adds new topics to the internal data structure. These topics will be intercepted in future
// requests. The endpoint also stores which keys belong to a topic. Those keys identify the clients that are currently
// intercepting those topics.
func (endpoint *RESTEndpoint) AddTopicsToIntercept(key string, topics []*MQTTTopic) bool {
	// garde against concurrent writes
	endpoint.keyToInterceptedTopicsMutex.Lock()
	defer endpoint.keyToInterceptedTopicsMutex.Unlock()
	endpoint.interceptedTopicNamesToKeyMutex.Lock()
	defer endpoint.interceptedTopicNamesToKeyMutex.Unlock()
	// the key is not in the map, create a slice for that key
	if _, ok := endpoint.KeyToInterceptedTopics[key]; !ok {
		//mapping for keys to topics
		endpoint.KeyToInterceptedTopics[key] = make([]*MQTTTopic, 0)
	}
	// if not add the topics into the map by the given key
	for _, topic := range topics {
		if topic == nil {
			continue
		}
		// check if this topic is already in the collection. If true discard this topic
		i := slices.IndexFunc(endpoint.KeyToInterceptedTopics[key], func(t *MQTTTopic) bool {
			return t.Name == topic.Name
		})
		if i != -1 {
			continue
		}

		if _, ok := endpoint.InterceptedTopicNameToKeys[topic.Name]; !ok {
			//(reverse) mapping for topic name to keys
			endpoint.InterceptedTopicNameToKeys[topic.Name] = make([]string, 0)
		}
		endpoint.KeyToInterceptedTopics[key] = append(endpoint.KeyToInterceptedTopics[key], topic)
		endpoint.InterceptedTopicNameToKeys[topic.Name] = append(endpoint.InterceptedTopicNameToKeys[topic.Name], key)
		topic.intercepted = true
	}
	return true
}

// RemoveKeyAndTopics removes a key from KeyToInterceptedTopics map.
// Informs the stored topics by the provided key that they are no longer intercepted.
// Returns true if the key is successfully removed.
func (endpoint *RESTEndpoint) RemoveKeyAndTopics(key string) bool {
	endpoint.keyToInterceptedTopicsMutex.Lock()
	defer endpoint.keyToInterceptedTopicsMutex.Unlock()
	if _, ok := endpoint.KeyToInterceptedTopics[key]; !ok {
		return true
	}
	topics := endpoint.KeyToInterceptedTopics[key]
	for _, topic := range topics {
		topic.intercepted = false
	}
	delete(endpoint.KeyToInterceptedTopics, key)
	return true
}

func (endpoint *RESTEndpoint) AddClient(key string, conn *websocket.Conn) bool {
	if conn == nil {
		return false
	}
	endpoint.keyToClientsMutex.Lock()
	defer endpoint.keyToClientsMutex.Unlock()
	if _, ok := endpoint.KeyToClients[key]; !ok {
		endpoint.KeyToClients[key] = make([]*websocket.Conn, 0)
	}
	// there is already a connection by this key in the connection
	if slices.Contains(endpoint.KeyToClients[key], conn) {
		return true
	}
	endpoint.KeyToClients[key] = append(endpoint.KeyToClients[key], conn)
	return true
}

// RemoveClient removes a client from the internal data structure.
// Returns true if the client has been removed, false otherwise.
func (endpoint *RESTEndpoint) RemoveClient(key string, conn *websocket.Conn) bool {
	if conn == nil {
		return false
	}
	endpoint.keyToClientsMutex.Lock()
	defer endpoint.keyToClientsMutex.Unlock()
	if _, ok := endpoint.KeyToClients[key]; !ok {
		// no clients by this key
		return true
	}
	clients := endpoint.KeyToClients[key]
	if i := slices.Index(clients, conn); i != -1 {
		clients = append(clients[:i], clients[i+1:]...)
		endpoint.KeyToClients[key] = clients
		return true
	}
	// the client is not in slice as intended
	return true
}

func (endpoint *RESTEndpoint) GetClients(key string) ([]*websocket.Conn, bool) {
	endpoint.keyToClientsMutex.RLock()
	defer endpoint.keyToClientsMutex.RUnlock()
	clients, ok := endpoint.KeyToClients[key]
	return clients, ok
}

func (endpoint *RESTEndpoint) GetInterceptedTopics(key string) ([]*MQTTTopic, bool) {
	endpoint.keyToInterceptedTopicsMutex.RLock()
	defer endpoint.keyToInterceptedTopicsMutex.RUnlock()
	topics, ok := endpoint.KeyToInterceptedTopics[key]
	return topics, ok
}

func (endpoint *RESTEndpoint) GetClientsByInterceptedTopicName(topicName string) ([]*websocket.Conn, error) {
	endpoint.interceptedTopicNamesToKeyMutex.RLock()
	defer endpoint.interceptedTopicNamesToKeyMutex.RUnlock()

	result := make([]*websocket.Conn, 0)

	keys, ok := endpoint.InterceptedTopicNameToKeys[topicName]
	if !ok {
		return nil, errors.New(fmt.Sprintf("No clients by topicName=%s", topicName))
	}

	for _, key := range keys {
		clients, ok := endpoint.GetClients(key)
		if !ok {
			continue
		}
		for _, client := range clients {
			if slices.Contains(result, client) {
				continue
			}
			result = append(result, client)
		}
	}
	return result, nil
}
