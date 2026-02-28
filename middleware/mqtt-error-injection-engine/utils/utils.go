package utils

import (
	"errors"
	"os"
)

func GetFromEnvironment(name string) (interface{}, error) {
	variable, present := os.LookupEnv(name)
	if present == false {
		return nil, errors.New("The mandatory environment variable isn't present. ")
	}
	return variable, nil
}
