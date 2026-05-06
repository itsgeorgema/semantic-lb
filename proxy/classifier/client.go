package classifier

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Request struct {
	Payload     json.RawMessage `json:"payload"`
	ContentType string          `json:"content_type"`
}

type Response struct {
	Label      string  `json:"label"`
	Confidence float64 `json:"confidence"`
	Reasoning  string  `json:"reasoning"`
	LatencyMs  float64 `json:"latency_ms"`
}

type Client struct {
	http    *http.Client
	baseURL string
}

func NewClient(baseURL string, timeout time.Duration) *Client {
	return &Client{
		http:    &http.Client{Timeout: timeout},
		baseURL: baseURL,
	}
}

func (c *Client) Classify(ctx context.Context, body []byte, contentType string) (*Response, error) {
	payload := body
	if len(payload) == 0 {
		payload = []byte(`{}`)
	}

	req := Request{
		Payload:     json.RawMessage(payload),
		ContentType: contentType,
	}
	reqBody, err := json.Marshal(req)
	if err != nil {
		return fallback("marshal error"), nil
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/classify", bytes.NewReader(reqBody))
	if err != nil {
		return fallback("request creation error"), nil
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return fallback(fmt.Sprintf("classifier unreachable: %v", err)), nil
	}
	defer resp.Body.Close()

	var result Response
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fallback("decode error"), nil
	}
	return &result, nil
}

func fallback(reason string) *Response {
	return &Response{Label: "general", Confidence: 0, Reasoning: reason}
}
