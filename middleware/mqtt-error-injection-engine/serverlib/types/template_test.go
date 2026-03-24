package types

import (
	"encoding/json"
	"testing"
)

func TestTemplate_EqualMatch_NamesEqual(t *testing.T) {
	topic0 := NewMQTTTopic("/test/0")
	topic1 := NewMQTTTopic("/test/1")
	topic2 := NewMQTTTopic("/test/0")

	template0 := NewPlainTemplate("dummy")

	topic0.InputTemplate = template0
	topic2.InputTemplate = template0

	resultTrue := topic0.EqualMatch(topic2)
	if !resultTrue {
		t.Errorf("Expected equality check to return true")
	}
	resultFalse := topic0.EqualMatch(topic1)
	if resultFalse {
		t.Errorf("Expected not equality check to return false")
	}
}

func TestTemplate_EqualMatch_JSONTemplates(t *testing.T) {
	// the input template 0 and 1 are semantically  equal templates
	template0 := NewJSONTemplate(json.RawMessage(`{ "trigger" : "action", "state" : "on" }`))
	template1 := NewJSONTemplate(json.RawMessage(`{ "state" : "on", "trigger" : "action" }`))
	template2 := NewJSONTemplate(json.RawMessage(`{ "trigger" : "on", "state" : "action" }`))

	topic0 := NewMQTTTopic("/test/1")
	topic1 := NewMQTTTopic("/test/1")
	topic2 := NewMQTTTopic("/test/1")

	topic0.InputTemplate = template0
	topic1.InputTemplate = template1
	topic2.InputTemplate = template2

	resultTrue := topic0.EqualMatch(topic1)
	if !resultTrue {
		t.Errorf("Expected equality check to return true")
	}

	resultFalse := topic0.EqualMatch(topic2)
	if resultFalse {
		t.Errorf("Expected not equality check to return false")
	}
	resultFalse = topic0.EqualMatch(topic1)
	if !resultFalse {
		t.Errorf("Expected equality check to return false")
	}
}

func TestTemplate_PlainTemplate(t *testing.T) {
	template0 := NewPlainTemplate("single")
	template1 := NewPlainTemplate("double")
	template3 := NewPlainTemplate("*")

	topic0 := NewMQTTTopic("/test/0")
	topic1 := NewMQTTTopic("/test/0")
	topic2 := NewMQTTTopic("/test/0")

	topic0.InputTemplate = template0
	topic1.InputTemplate = template1
	topic2.InputTemplate = template3

	resultTrue := topic2.EqualMatch(topic2)
	if !resultTrue {
		t.Errorf("Expected equality check to return true")
	}

	resultFalse := topic2.EqualMatch(topic1)
	if resultFalse {
		t.Errorf("Expected not equality check to return false")
	}
	resultFalse = topic2.EqualMatch(topic0)
	if resultFalse {
		t.Errorf("Expected equality check to return false")
	}
}
