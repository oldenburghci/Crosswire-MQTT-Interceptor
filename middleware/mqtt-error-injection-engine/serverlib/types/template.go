package types

import "encoding/json"

type Template struct {
	Plain string          `json:"plain,omitempty"`
	JSON  json.RawMessage `json:"json,omitempty"`
	//plain bool
}

func NewPlainTemplate(plain string) *Template {
	return &Template{
		//plain: true,
		Plain: plain,
	}
}

func NewJSONTemplate(json json.RawMessage) *Template {
	return &Template{
		//plain: false,
		JSON: json,
	}
}

func (t *Template) IsPlain() bool {
	return t.Plain != ""
}
