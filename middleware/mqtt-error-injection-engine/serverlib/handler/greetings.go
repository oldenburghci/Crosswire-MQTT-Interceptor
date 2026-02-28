package handler

import "fmt"

func SayHello(name string) string {
	message := fmt.Sprintf("Hello, %v. Welcome to the Golang!", name)
	return message
}
