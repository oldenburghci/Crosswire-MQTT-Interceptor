package main

import (
	"fmt"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/user-management/serverlib/routing"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	sigs := make(chan os.Signal, 1)
	done := make(chan bool, 1)
	server, err := routing.NewUserManagementServer()
	if err != nil {
		panic(err)
	}

	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigs
		done <- true
	}()

	go func() {
		fmt.Println("start User Management")
		err := server.Start()
		if err != nil {
			panic(err)
		}
	}()

	<-done
	fmt.Println("caught interrupt signal, stopping User Management...")
}
