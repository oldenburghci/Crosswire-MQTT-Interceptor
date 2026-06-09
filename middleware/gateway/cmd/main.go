package main

import (
	"fmt"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/routing"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	sigs := make(chan os.Signal, 1)
	done := make(chan bool, 1)

	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigs
		done <- true
	}()

	go func() {
		fmt.Println("start API gateway")
		routing.Start()
	}()

	<-done
	fmt.Println("caught interrupt signal, stopping API gateway...")
}
