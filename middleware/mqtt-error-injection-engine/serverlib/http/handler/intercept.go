package handler

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	mochiPackets "github.com/mochi-mqtt/server/v2/packets"
	mymqtt "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib"
	myhttp "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/http"
	types "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/types"
	"net/http"
)

const (
	// see https://github.com/gorilla/websocket/blob/main/examples/chat/client.go for reference
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

var wsupgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// PostManualInterceptionHandler handles an incoming request for topic interception.
func PostManualInterceptionHandler(context *gin.Context) {
	request := InterceptionConfigurationRequest{}
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body."})
		return
	}
	//set the requested topics into interception
	intercepted, notIntercepted, err := initializeInterceptions(request.Topics, "manual")
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "internal server error."})
		return
	}
	//generate a guid and store the intercepted and not intercepted topics into different data structures by this guid
	encodedKey := base64.StdEncoding.EncodeToString([]byte(uuid.NewString()))
	// the guid is returned to identify clients. The server uses it to identify which topics should be monitored
	// set topics in mqtt server to intercepted
	myhttp.REST_SERVER.AddTopicsToIntercept(encodedKey, intercepted)
	response := InterceptionConfigurationResponse{
		InterceptedTopics:      intercepted,
		NotInterceptableTopics: notIntercepted,
		Mode:                   "manual",
		Redirect:               fmt.Sprintf("/topics/intercept/subscribe/%s", encodedKey),
	}
	context.JSON(http.StatusOK, response)
}

// PostTemplateInterceptionHandler allows to set new template interception pattern for the engine.
func PostTemplateInterceptionHandler(context *gin.Context) {
	request := struct {
		Topics []types.MQTTTopic `json:"topics"`
	}{
		Topics: make([]types.MQTTTopic, 0),
	}

	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body."})
		return
	}
	fmt.Printf("%+v\n", request.Topics)
	if slices.ContainsFunc(request.Topics, func(t types.MQTTTopic) bool { return t.OutputTemplate == nil }) {
		context.JSON(http.StatusBadRequest, gin.H{"error": "All topics require a template."})
		return
	}
	if slices.ContainsFunc(request.Topics, func(t types.MQTTTopic) bool { return t.InputTemplate == nil }) {
		context.JSON(http.StatusBadRequest, gin.H{"error": "All topics require a rule."})
		return
	}
	// convert into internal mqtt topic
	intercepted, notIntercepted, err := initializeInterceptions(request.Topics, "template")
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "internal server error."})
		return
	}

	response := InterceptionConfigurationResponse{
		InterceptedTopics:      intercepted,
		NotInterceptableTopics: notIntercepted,
		Mode:                   "template",
	}
	context.JSON(http.StatusOK, response)
}

// GetActiveInterceptionsHandler the current active interceptions.
func GetActiveInterceptionsHandler(context *gin.Context) {
	context.JSON(http.StatusOK, mymqtt.MITM_MQTT_SERVER.GetInterceptedTopics())
}

// PostCancelInterceptionHandler removes active interceptions.
func PostCancelInterceptionHandler(context *gin.Context) {
	request := struct {
		Topics []types.MQTTTopic `json:"topics"`
	}{
		Topics: make([]types.MQTTTopic, 0),
	}

	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body."})
		return
	}

	count := 0
	collector := make([]*types.MQTTTopic, 0)

	for _, topic := range request.Topics {
		managed, err := mymqtt.MITM_MQTT_SERVER.GetManagedTopic(topic.Name)
		// no topic by this name
		if err != nil {
			continue
		}
		managed.CancelIntercept()
		if ok := mymqtt.MITM_MQTT_SERVER.RemoveTopic(managed); !ok {
			continue
		}
		count++
		collector = append(collector, managed)
	}
	context.JSON(
		http.StatusOK,
		gin.H{
			"message":   "ok",
			"detail":    fmt.Sprintf("cancel interception for (%d/%d) topics", count, len(request.Topics)),
			"cancelled": collector,
		},
	)
}

// SubscribeInterceptionHandler experimental
func SubscribeInterceptionHandler(context *gin.Context) {
	key := context.Params.ByName("key")
	_, ok := myhttp.REST_SERVER.GetInterceptedTopics(key)
	if !ok {
		context.JSON(http.StatusBadRequest, gin.H{"error": "no intercepted topics by the provided key."})
		return
	}
	w, r := context.Writer, context.Request
	// Initiate websocket connection
	// this has to be organized along topics
	conn, err := wsupgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println(err)
		return
	}
	conn.SetCloseHandler(func(code int, text string) error {
		//remove from data structure
		fmt.Printf("close connection to client=%s, code=%d\n", conn.RemoteAddr().String(), code)
		myhttp.REST_SERVER.RemoveClient(key, conn)
		return nil
	})

	myhttp.REST_SERVER.AddClient(key, conn)
	//this is now a websocket.
}

// StreamInterception forwards a received MQTT packet to the subscript clients. If the intercepted topic is in manual
// interaction mode the function blocks until one of the clients send a message back to the server, that explains how
// this packet should be processed further (discard, manipulate, pass-through)
func StreamInterception(pk mochiPackets.Packet) (SubscribeInterceptionResponse, error) {
	result := SubscribeInterceptionResponse{
		Control: "pass",
	}
	topicName := pk.TopicName
	fmt.Printf("Stream interception for topic %s\n", topicName)
	clients, err := myhttp.REST_SERVER.GetClientsByInterceptedTopicName(topicName)
	if err != nil {
		fmt.Printf(
			"no clients for topic=%s. err=%s\n",
			topicName,
			err.Error(),
		)
		result.Control = "pass"
		sendFeedbackToClients(clients, &result)
		return result, err
	}

	wg := sync.WaitGroup{}
	ctx, cancel := context.WithCancel(context.Background())
	responseChan := make(chan string)
	resultChan := make(chan SubscribeInterceptionResponse)

	//it is not possible to unblock the readMessage()/readJSON() call in sendAndWaitForResponse from outside the function
	//That means that clients could replay stream messages with old messages, which leads to odd behavior, where an
	// intended response has to be written twice. The blocking call is also problematic because, if the ws is used
	// to write a message back to the client, the write call will cause an error because the underlying connection
	// is still in read mode. We avoid this problem here by only allow the first client in the list to overwrite stream
	// messages.

	//notify all subscriber that a new topic packet was intercepted
	for _, client := range clients {
		wg.Add(1)
		go func() {
			defer wg.Done()
			sendFeedbackToSubscriberForInterceptedTopic(client, pk)
		}()
	}
	//only the first client has the privilege to response
	conn := clients[0]
	wg.Add(1)
	// send the response to all registered clients and wait that one is responding
	go func() {
		defer wg.Done()
		waitForResponse(ctx, cancel, responseChan, resultChan, conn)
	}()

	//this go func ensures that all other client handler unblock as soon as one handler unblocks
	go func() {
		select {
		case <-responseChan:
			fmt.Println("send cancel()")
			cancel()
		}
	}()

	fmt.Printf("wait for first client to send a response\n")
	wg.Wait()
	result = <-resultChan
	fmt.Printf("in StreamInterception... waiting done\n")

	returnError := errors.New("nothing")

	switch result.Control {
	case "overwrite":
		decode, err := base64.StdEncoding.DecodeString(result.NewMessage)
		if err != nil {
			fmt.Printf("Decode err=%s\n", err)
			returnError = errors.New("decode error")
			break
		}
		returnError = nil
		result.NewMessage = string(decode)
	case "readError":
		returnError = errors.New("read error")
	case "parseError":
		returnError = errors.New("parse error")
	default:
		//pass or suppress
		returnError = nil
	}
	sendFeedbackToClients(clients, &result)
	return result, returnError
}

func sendFeedbackToSubscriberForInterceptedTopic(conn *websocket.Conn, pk mochiPackets.Packet) {
	topic, err := mymqtt.MITM_MQTT_SERVER.GetManagedTopic(pk.TopicName)
	if err != nil {
		//TODO: error handling
		fmt.Printf("no intercepted topic %s found\n", pk.TopicName)
		//responseChan <- fmt.Sprintf("no intercepted topic %s found", pk.TopicName)
		return
	}
	// send an initial message to the client
	initialResponse := SubscribeInterceptionInitialResponse{
		InterceptedTopic: topic,
		OriginalPayload:  string(pk.Payload),
	}
	err = conn.WriteJSON(initialResponse)
	//TODO: error handling
	if err != nil {
		fmt.Printf("WriteJSON error: %s\n", err)
	}
}

func waitForResponse(ctx context.Context, cancel context.CancelFunc, responseChan chan string, resultChan chan SubscribeInterceptionResponse, conn *websocket.Conn) {
	go func() {
		// default is the pass-through of the original message, even on error
		response := SubscribeInterceptionResponse{}
		// cannot write to two channels within one routine
		writeResultFx := func() {
			fmt.Printf("Write to resultChan\n")
			resultChan <- response
		}
		writeToUnblockFx := func() {
			responseChan <- fmt.Sprintf("...message from client=%s", conn.RemoteAddr().String())
		}

		fmt.Printf("Block until message incoming\n")
		msgCode, message, err := conn.ReadMessage()
		if err != nil {
			fmt.Printf("conn.ReadMessage err=%s\n", err)
			cancel()
			writeResultFx()
			writeToUnblockFx()
			return
		}
		fmt.Printf("Message code=%d\n", msgCode)

		if err != nil {
			fmt.Printf("conn.ReadMessage err=%s\n", err)
			response.Control = "readError"
			go writeResultFx()
			go writeToUnblockFx()
			return
		}
		if err := json.Unmarshal(message, &response); err != nil {
			fmt.Printf("Invalid client request: %+v\n", err.Error())
			response.Control = "parseError"
			go writeResultFx()
			go writeToUnblockFx()
			return
		}
		fmt.Printf("Message code=%d unmarshaled=%+v\n", msgCode, response)
		go writeResultFx()
		go writeToUnblockFx()
	}()
	for {
		select {
		case <-time.After(time.Second * 10):
			fmt.Printf("waited 10 seconds for client=%s to respond...\n", conn.RemoteAddr().String())
		case <-ctx.Done():
			fmt.Printf("got ctx.Done\n")
			return
		case result := <-responseChan:
			fmt.Printf("waited for AfterFunc to get timed out...\n")
			fmt.Println(result)
			return
		}
	}
}

func sendFeedbackToClients(clients []*websocket.Conn, initialResponse *SubscribeInterceptionResponse) {
	for _, conn := range clients {
		err := conn.WriteJSON(initialResponse)
		if err != nil {
			fmt.Printf("conn.WriteJSON err=%s\n", err)
		}
	}
}

func parseConfigRequest(message []byte) (*InterceptionConfigurationRequest, error) {
	result := InterceptionConfigurationRequest{}
	if err := json.Unmarshal(message, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// initializeInterceptions returns two disjoint slices of MQTTTopic with intercepted and not intercepted topics
func initializeInterceptions(topics []types.MQTTTopic, mode string) ([]*types.MQTTTopic, []*types.MQTTTopic, error) {
	notInterceptable := make([]*types.MQTTTopic, 0)
	interceptable := make([]*types.MQTTTopic, 0)

	for _, requestedTopic := range topics {
		managed := types.NewMQTTTopic(requestedTopic.Name)
		managed.InputTemplate = requestedTopic.InputTemplate
		managed.OutputTemplate = requestedTopic.OutputTemplate
		//fmt.Printf("requestedTopic to intercept: %s\n", requestedTopic.Name)
		if !mymqtt.MITM_MQTT_SERVER.AddInterceptedTopic(managed) {
			notInterceptable = append(notInterceptable, managed)
			continue
		}
		err := managed.SetInterceptMode(mode)
		if err != nil {
			return nil, nil, err
		}
		if managed.IsTemplateBasedIntercepted() {
			managed.OutputTemplate = requestedTopic.OutputTemplate
		}
		fmt.Printf("managed=%+v\n", managed.OutputTemplate)
		interceptable = append(interceptable, managed)
	}
	return interceptable, notInterceptable, nil
}

// Request types

type InterceptionConfigurationRequest struct {
	Topics []types.MQTTTopic `json:"topics"`
}

// Response types

type SubscribeInterceptionResponse struct {
	Control    string `json:"control"`
	NewMessage string `json:"new_message,omitempty"`
}

type SubscribeInterceptionInitialResponse struct {
	InterceptedTopic *types.MQTTTopic `json:"intercepted_topic"`
	OriginalPayload  string           `json:"original_payload"`
}

type InterceptionConfigurationResponse struct {
	InterceptedTopics      []*types.MQTTTopic `json:"intercepted_topics"`
	NotInterceptableTopics []*types.MQTTTopic `json:"not_interceptable_topics"`
	Mode                   string             `json:"interception_mode"`
	Redirect               string             `json:"redirect,omitempty"`
}
