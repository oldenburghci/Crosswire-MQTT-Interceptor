package types

import (
	"encoding/json"
	"errors"
	"github.com/google/go-cmp/cmp"
)

type MQTTTopic struct {
	Name string `json:"name"`
	//Schedule         *Schedule `json:"schedule,omitempty"`
	//mutex            sync.Mutex
	suppressed       bool
	intercepted      bool
	interceptionMode string
	InputTemplate    *Template `json:"rule,omitempty"`
	OutputTemplate   *Template `json:"template,omitempty"`
}

func NewMQTTTopic(name string) *MQTTTopic {
	return &MQTTTopic{
		Name: name,
		//mutex: sync.Mutex{},
	}
}

func (t *MQTTTopic) IsIntercepted() bool {
	return t.intercepted
}

func (t *MQTTTopic) Intercept() error {
	//t.mutex.Lock()
	//defer t.mutex.Unlock()
	if t.intercepted {
		return errors.New("already intercepted")
	}
	if t.suppressed {
		return errors.New("already suppressed")
	}
	t.intercepted = true
	return nil
}

func (t *MQTTTopic) CancelIntercept() {
	//t.mutex.Lock()
	//defer t.mutex.Unlock()
	t.intercepted = false
}

func (t *MQTTTopic) SetInterceptMode(mode string) error {
	if !(mode == "manual" || mode == "template") {
		return errors.New("invalid mode")
	}
	t.interceptionMode = mode
	return nil
}

func (t *MQTTTopic) IsManuallyIntercepted() bool {
	if !t.intercepted || t.interceptionMode != "manual" {
		return false
	}
	return true
}

func (t *MQTTTopic) IsTemplateBasedIntercepted() bool {
	if !t.intercepted || t.interceptionMode != "template" {
		return false
	}
	return true
}

func (t *MQTTTopic) Suppress() error {
	//t.mutex.Lock()
	//defer t.mutex.Unlock()
	if t.suppressed {
		return errors.New("already suppressed")
	}
	if t.intercepted {
		return errors.New("already intercepted")
	}
	t.suppressed = true
	return nil
}

func (t *MQTTTopic) IsSuppressed() bool { return t.suppressed }

func (t *MQTTTopic) CancelSuppress() {
	//t.mutex.Lock()
	//defer t.mutex.Unlock()
	t.suppressed = false
}

// EqualMatch compares two MQTTTopics against each other and infers if the topics fulfill the same interception rules.
func (t *MQTTTopic) EqualMatch(other *MQTTTopic) bool {
	// with the introduction of pattern based interception, it is not enough to simply compare the names of two topics
	if t.Name != other.Name {
		return false
	}
	//compare payload
	// 1) & 2) both messages are not of the same data type, hence they can't be equal
	if (t.InputTemplate.IsPlain() && !other.InputTemplate.IsPlain()) || (!t.InputTemplate.IsPlain() && other.InputTemplate.IsPlain()) {
		//fast compare and quit
		return false
	}
	//3) both messages are plain and can be compared in detail
	if t.InputTemplate.IsPlain() && other.InputTemplate.IsPlain() {
		return t.InputTemplate.Plain == other.InputTemplate.Plain
	}
	//4) both messages are json and can be compared in detail
	var ai, bi interface{}
	if err := json.Unmarshal(t.InputTemplate.JSON, &ai); err != nil {
		return false
	}
	if err := json.Unmarshal(other.InputTemplate.JSON, &bi); err != nil {
		return false
	}

	if !cmp.Equal(ai, bi) {
		return false
	}
	return true
}

type MQTTTopics struct {
	Topics []*MQTTTopic `json:"topics"`
}
