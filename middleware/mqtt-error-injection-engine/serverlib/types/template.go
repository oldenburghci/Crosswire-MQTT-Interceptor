package types

import "encoding/json"

type Template struct {
	Plain string          `json:"plain,omitempty"`
	JSON  json.RawMessage `json:"json,omitempty"`
}

func NewPlainTemplate(plain string) *Template {
	return &Template{
		Plain: plain,
	}
}

func NewJSONTemplate(json json.RawMessage) *Template {
	return &Template{
		JSON: json,
	}
}

func (t *Template) IsPlain() bool {
	return t.Plain != ""
}
