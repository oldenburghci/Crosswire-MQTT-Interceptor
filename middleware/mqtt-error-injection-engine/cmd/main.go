package main

import (
	//"bytes"
	//"fmt"
	//"github.com/mochi-mymqtt/startup/v2/hooks/auth"
	//"github.com/mochi-mymqtt/startup/v2/listeners"
	//"github.com/mochi-mymqtt/startup/v2/packets"

	mymqtt "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib"
	//mymqtt "github.com/mochi-mymqtt/startup/v2"
	//"github.com/mochi-mymqtt/startup/v2/hooks/auth"
	//"github.com/mochi-mymqtt/startup/v2/listeners"
	//"github.com/mochi-mymqtt/startup/v2/packets"
	"log"
	"os"
	"os/signal"
	"syscall"

	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/http/routing"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib/mqtt/startup"
)

func main() {
	sigs := make(chan os.Signal, 1)
	done := make(chan bool, 1)
	// for graceful shutdown
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigs
		done <- true
	}()

	//startup := mymqtt.New(&mymqtt.Options{
	//	InlineClient: true, // you must enable inline client to use direct publishing and subscribing.
	//})
	//
	//_ = startup.AddHook(new(auth.AllowHook), nil)
	//tcp := listeners.NewTCP(listeners.Config{
	//	ID:      "t1",
	//	Address: ":1883",
	//})
	//err := startup.AddListener(tcp)
	//if err != nil {
	//	log.Fatal(err)
	//}
	//
	//// Add custom hook (ExampleHook) to the startup
	//err = startup.AddHook(new(ExampleHook), &ExampleHookOptions{
	//	Server: startup,
	//})

	//if err != nil {
	//	log.Fatal(err)
	//}

	// Start the mymqtt startup
	go func() {
		err := startup.StartMQTT()
		if err != nil {
			log.Fatal(err)
		}
	}()
	log.Println("MQTT startup started")
	// Start the http startup
	go func() {
		err := routing.StartHTTP()
		if err != nil {
			log.Fatal(err)
		}
	}()
	log.Println("HTTP startup started")

	// There is also a shorthand convenience function, Publish, for easily sending
	// publish packets if you are not concerned with creating your own packets.
	//go func() {
	//	for range time.Tick(time.Second * 60) {
	//		err := startup.Publish("direct/publish", []byte("packet scheduled message"), false, 0)
	//		if err != nil {
	//			startup.Log.Error("startup.Publish", "error", err)
	//		}
	//		startup.Log.Info("main.go issued direct message to direct/publish")
	//	}
	//}()
	// receive done flag after ctrl+c ...
	<-done
	// ... and shutdown startup gracefully
	mymqtt.MITM_MQTT_SERVER.Server.Log.Warn("caught signal, stopping...")
	_ = mymqtt.MITM_MQTT_SERVER.Server.Close()
	mymqtt.MITM_MQTT_SERVER.Server.Log.Info("main.go finished")
}

// Options contains configuration settings for the hook.
/*type ExampleHookOptions struct {
	Server *mymqtt.Server
}

type ExampleHook struct {
	mymqtt.HookBase
	config *ExampleHookOptions
}

func (h *ExampleHook) ID() string {
	return "events-example"
}

func (h *ExampleHook) Provides(b byte) bool {
	return bytes.Contains([]byte{
		mymqtt.OnConnect,
		mymqtt.OnDisconnect,
		mymqtt.OnSubscribed,
		mymqtt.OnUnsubscribed,
		mymqtt.OnPublished,
		mymqtt.OnPublish,
	}, []byte{b})
}

func (h *ExampleHook) Init(config any) error {
	h.Log.Info("initialised")
	if _, ok := config.(*ExampleHookOptions); !ok && config != nil {
		return mymqtt.ErrInvalidConfigType
	}

	h.config = config.(*ExampleHookOptions)
	if h.config.Server == nil {
		return mymqtt.ErrInvalidConfigType
	}
	return nil
}

// subscribeCallback handles messages for subscribed topics
func (h *ExampleHook) subscribeCallback(cl *mymqtt.Client, sub packets.Subscription, pk packets.Packet) {
	h.Log.Info("hook subscribed message", "client", cl.ID, "topic", pk.TopicName)
}

func (h *ExampleHook) OnConnect(cl *mymqtt.Client, pk packets.Packet) error {
	h.Log.Info("client connected", "client", cl.ID)

	// Example demonstrating how to subscribe to a topic within the hook.
	h.config.Server.Subscribe("hook/direct/publish", 1, h.subscribeCallback)

	// Example demonstrating how to publish a message within the hook
	err := h.config.Server.Publish("hook/direct/publish", []byte("packet hook message"), false, 0)
	if err != nil {
		h.Log.Error("hook.publish", "error", err)
	}

	return nil
}

func (h *ExampleHook) OnDisconnect(cl *mymqtt.Client, err error, expire bool) {
	if err != nil {
		h.Log.Info("client disconnected", "client", cl.ID, "expire", expire, "error", err)
	} else {
		h.Log.Info("client disconnected", "client", cl.ID, "expire", expire)
	}

}

func (h *ExampleHook) OnSubscribed(cl *mymqtt.Client, pk packets.Packet, reasonCodes []byte) {
	h.Log.Info(fmt.Sprintf("subscribed qos=%v", reasonCodes), "client", cl.ID, "filters", pk.Filters)
}

func (h *ExampleHook) OnUnsubscribed(cl *mymqtt.Client, pk packets.Packet) {
	h.Log.Info("unsubscribed", "client", cl.ID, "filters", pk.Filters)
}

func (h *ExampleHook) OnPublish(cl *mymqtt.Client, pk packets.Packet) (packets.Packet, error) {
	h.Log.Info("received from client", "client", cl.ID, "payload", string(pk.Payload))

	pkx := pk
	if string(pk.Payload) == "hello" {
		pkx.Payload = []byte("hello world")
		h.Log.Info("received modified packet from client", "client", cl.ID, "payload", string(pkx.Payload))
	}

	return pkx, nil
}

func (h *ExampleHook) OnPublished(cl *mymqtt.Client, pk packets.Packet) {
	h.Log.Info("published to client", "client", cl.ID, "payload", string(pk.Payload))
}*/
