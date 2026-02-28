package types

import (
	"fmt"
	"github.com/gorilla/websocket"
	"slices"
	"sync"
	"testing"
)

func TestRESTEndpoint_AddClient(t *testing.T) {
	conn := &websocket.Conn{}
	key := "random_key"
	endpoint := NewRESTEndpoint()

	endpoint.AddClient(key, conn)
	endpoint.AddClient(key, conn)
	endpoint.AddClient(key, nil)

	retrieved, ok := endpoint.GetClients(key)

	if !ok {
		t.Errorf("key %s not found in endpoint", key)
	}

	if len(retrieved) != 1 {
		t.Error("There should be 1 client by this key")
	}
}

func TestRESTEndpoint_AddClient_Concurrent(t *testing.T) {
	conn0 := &websocket.Conn{}
	conn1 := &websocket.Conn{}

	key := "random_key0"
	endpoint := NewRESTEndpoint()

	wg := sync.WaitGroup{}

	for i := 0; i < 100; i++ {
		next := conn0
		if i%2 == 1 {
			next = conn1
		}
		wg.Add(1)
		go func(client *websocket.Conn) {
			endpoint.AddClient(key, client)
			wg.Done()
		}(next)
	}
	wg.Wait()

	retrieved, ok := endpoint.GetClients(key)
	if !ok {
		t.Errorf("key %s not found in endpoint", key)
	}
	if len(retrieved) != 2 {
		t.Error("There should be 2 clients by this key")
	}
}

func TestRESTEndpoint_AddTopicsToIntercept(t *testing.T) {
	key := "random_key"
	endpoint := NewRESTEndpoint()
	topics := make([]*MQTTTopic, 0)

	//add topics with the same name... they should be filtered
	topicNames := []string{"/test/topic", "/test/topic2"}
	topics = append(topics, nil)
	topics = append(topics, &MQTTTopic{
		Name: "/test/topic",
	})
	topics = append(topics, &MQTTTopic{
		Name: "/test/topic",
	})
	topics = append(topics, &MQTTTopic{
		Name: "/test/topic2",
	})

	endpoint.AddTopicsToIntercept(key, topics)
	retrieved, ok := endpoint.GetInterceptedTopics(key)
	// test correctness
	if !ok {
		t.Error("GetInterceptedTopics failed because there are no intercepted topics by the provided key")
	}
	if len(retrieved) != 2 {
		t.Error("There should be two topics in the intercepted topics by the provided key")
	}

	if len(retrieved) == len(topics) {
		t.Error("There are topics with equal topic name in the map of intercepted topics")
	}

	for _, topic := range retrieved {
		isIn := slices.ContainsFunc(topicNames, func(name string) bool {
			return name == topic.Name
		})
		if !isIn {
			t.Error(fmt.Sprintf("The topic name %s is not in the list of intercepted topics", topic.Name))
		}
		if !topic.IsIntercepted() {
			t.Error(fmt.Sprintf("The topic %s is not set to be intercepted", topic.Name))
		}
	}
}

func TestRESTEndpoint_AddTopicsToIntercept_Concurrent(t *testing.T) {
	key := "random_key"
	endpoint := NewRESTEndpoint()

	topics0 := make([]*MQTTTopic, 0)
	topics1 := make([]*MQTTTopic, 0)
	topicNames := []string{"/test/topic", "/test/topic2", "/test/topic3"}
	topics0 = append(topics0, nil)
	topics0 = append(topics0, &MQTTTopic{
		Name: "/test/topic",
	})
	topics0 = append(topics0, &MQTTTopic{
		Name: "/test/topic2",
	})

	topics1 = append(topics1, nil)
	topics1 = append(topics0, &MQTTTopic{
		Name: "/test/topic2",
	})
	topics1 = append(topics1, &MQTTTopic{
		Name: "/test/topic3",
	})

	wg := sync.WaitGroup{}

	for i := 0; i < 100; i++ {
		//alternate which slice to add
		next := topics0
		if i%2 == 1 {
			next = topics1
		}
		wg.Add(1)
		go func(topicsToAdd []*MQTTTopic) {
			endpoint.AddTopicsToIntercept(key, topicsToAdd)
			wg.Done()
		}(next)
	}
	wg.Wait()
	retrieved, ok := endpoint.GetInterceptedTopics(key)

	// test correctness
	if !ok {
		t.Error("GetInterceptedTopics failed because there are no intercepted topics by the provided key")
	}
	if len(retrieved) != 3 {
		t.Error("There should be 3 intercepted topics in the map by this key")
	}

	//if len(retrieved) == len(topics0) || len(retrieved) == len(topics1) {
	//	t.Error("There should be more topics in the map of intercepted topics than in the two slices")
	//}
	for _, topic := range retrieved {
		isIn := slices.ContainsFunc(topicNames, func(name string) bool {
			return name == topic.Name
		})
		if !isIn {
			t.Error(fmt.Sprintf("The topic name %s is not in the list of intercepted topics", topic.Name))
		}
		if !topic.IsIntercepted() {
			t.Error(fmt.Sprintf("The topic %s is not set to be intercepted", topic.Name))
		}
	}
}

func TestRESTEndpoint_GetClientsByInterceptedTopicName(t *testing.T) {
	key0 := "random_key"
	key1 := "another_random_key"
	endpoint := NewRESTEndpoint()

	clients := []*websocket.Conn{&websocket.Conn{}, &websocket.Conn{}}

	topics := make([]*MQTTTopic, 0)
	topicNames := []string{"/test/topic", "/test/topic2", "/test/topic3"}

	topics = append(topics, nil)
	topics = append(topics, &MQTTTopic{
		Name: topicNames[0],
	})
	topics = append(topics, &MQTTTopic{
		Name: topicNames[1],
	})
	topics = append(topics, &MQTTTopic{
		Name: topicNames[2],
	})
	// insert topics and clients by a key0 into the data structure
	endpoint.AddTopicsToIntercept(key0, topics)
	endpoint.AddTopicsToIntercept(key1, topics[0:3])
	for _, client := range clients[0:1] {
		endpoint.AddClient(key0, client)
	}
	for _, client := range clients {
		endpoint.AddClient(key1, client)
	}
	//retrieve and test
	clientsForTopic0, err := endpoint.GetClientsByInterceptedTopicName(topicNames[0])
	if err != nil {
		t.Errorf(err.Error())
	}
	if len(clientsForTopic0) != 2 {
		t.Errorf("There should be 2 clients for topicName=%s, got=%d", topicNames[0], len(clientsForTopic0))
		for _, client := range clientsForTopic0 {
			fmt.Printf("%p\n", client)
		}
	}

	clientsForTopic1, err := endpoint.GetClientsByInterceptedTopicName(topicNames[1])
	if err != nil {
		t.Errorf(err.Error())
	}
	if len(clientsForTopic1) != 2 {
		t.Errorf("There should be 2 clients for topicName=%s, got=%d", topicNames[1], len(clientsForTopic1))
		for _, client := range clientsForTopic1 {
			fmt.Printf("%p\n", client)
		}
	}

	clientsForTopic2, err := endpoint.GetClientsByInterceptedTopicName(topicNames[2])
	if err != nil {
		t.Errorf(err.Error())
	}
	if len(clientsForTopic2) != 1 {
		t.Errorf("There should be 1 client for topicName=%s, got=%d", topicNames[2], len(clientsForTopic2))
		for _, client := range clientsForTopic2 {
			fmt.Printf("%p\n", client)
		}
	}

	clientsForTopic3, err := endpoint.GetClientsByInterceptedTopicName("this/is/not/a/valid/topic")
	if err == nil {
		t.Errorf("There should be no clients for topicName=%s, got=%d", "this/is/not/a/valid/topic", len(clientsForTopic3))
	}

	for _, topic := range topics {
		if topic == nil {
			continue
		}
		if !topic.IsIntercepted() {
			t.Error(fmt.Sprintf("The topic %s is not set to be intercepted", topic.Name))
		}
	}
}
