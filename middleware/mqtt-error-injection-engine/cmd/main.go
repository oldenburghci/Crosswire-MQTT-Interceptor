package main

import (
	mymqtt "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/mqtt-error-injection-engine/serverlib"
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
	// receive done flag after ctrl+c ...
	<-done
	// ... and shutdown startup gracefully
	mymqtt.MITM_MQTT_SERVER.Server.Log.Warn("caught signal, stopping...")
	_ = mymqtt.MITM_MQTT_SERVER.Server.Close()
	mymqtt.MITM_MQTT_SERVER.Server.Log.Info("main.go finished")
}
