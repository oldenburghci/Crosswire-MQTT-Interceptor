package types

import (
	"encoding/json"
	"errors"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"time"
)

type Tabler interface {
	TableName() string
}

type MQTTTopicWrapper struct {
	gorm.Model               `json:"-"`
	ZigBeeID                 string    `json:"zigBeeID"`
	TopicName                string    `json:"topicName"`
	Schedule                 *Schedule `json:"schedule,omitempty" gorm:"embedded;embeddedPrefix:schedule_"`
	Active                   bool      `json:"-"`
	ErrorConfigurationStepID uint      `json:"-"`
}

type MQTTSuppressedTopicWrapper struct {
	MQTTTopicWrapper
}

func (wrapper *MQTTSuppressedTopicWrapper) TableName() string {
	return "suppressed_topics"
}

type MQTTInterceptedTopicWrapper struct {
	MQTTTopicWrapper
	OutputTemplate   TemplateWrapper `json:"template" gorm:"embedded;embeddedPrefix:template_"`
	InputTemplate    TemplateWrapper `json:"rule" gorm:"embedded;embeddedPrefix:rule_"`
	InterceptionMode string          `json:"interception_mode"`
}

func (wrapper *MQTTInterceptedTopicWrapper) TableName() string {
	return "intercepted_topics"
}

type TemplateWrapper struct {
	JSON  datatypes.JSON `json:"json,omitempty"`
	Plain string         `json:"plain,omitempty"`
}

// Schedule
type Schedule struct {
	StartTime  *time.Time `json:"start_time"`
	Duration   Duration   `json:"duration,omitempty"`
	startTimer *time.Timer
	endTimer   *time.Timer
}

func (s *Schedule) SetStartTimer(t *time.Timer) error {
	if t != nil {
		s.startTimer = t
		return nil
	}
	return errors.New("startTimer is nil")
}

func (s *Schedule) GetStartTimer() (*time.Timer, error) {
	if s.startTimer != nil {
		return s.startTimer, nil
	}
	return nil, errors.New("startTimer is nil")
}

func (s *Schedule) SetEndTimer(t *time.Timer) error {
	if t != nil {
		s.endTimer = t
		return nil
	}
	return errors.New("endTimer is nil")
}

func (s *Schedule) GetEndTimer() (*time.Timer, error) {
	if s.endTimer != nil {
		return s.endTimer, nil
	}
	return nil, errors.New("endTimer is nil")
}

func NewSchedule() *Schedule {
	s := new(Schedule)
	t := time.Now()
	s.StartTime = &t
	s.Duration = Duration(0)
	return s
}

type Duration time.Duration

func (d Duration) MarshalJSON() ([]byte, error) {
	return json.Marshal(time.Duration(d).String())
}

// UnmarshalJSON implements the json.Unmarshaler interface for Duration
func (d *Duration) UnmarshalJSON(bytes []byte) error {
	var v interface{}
	if err := json.Unmarshal(bytes, &v); err != nil {
		return err
	}
	switch value := v.(type) {
	case float64:
		*d = Duration(time.Duration(value))
		if *d < 0 {
			return errors.New("duration must be positive")
		}
		return nil
	case string:
		tmp, err := time.ParseDuration(value)
		if err != nil {
			return err
		}
		*d = Duration(tmp)
		if *d < 0 {
			return errors.New("duration must be positive")
		}
		return nil
	default:
		return errors.New("invalid duration")
	}
}
