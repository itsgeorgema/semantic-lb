package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"
	"sync"
	"time"

	"github.com/george/semantic-lb/proxy/balancer"
	"github.com/george/semantic-lb/proxy/classifier"
	"github.com/george/semantic-lb/proxy/middleware"
)

const maxBodyBytes = 10 << 20 // 10 MB

type TrafficEvent struct {
	ID               string  `json:"id"`
	Timestamp        int64   `json:"timestamp"`
	Label            string  `json:"label"`
	Confidence       float64 `json:"confidence"`
	Reasoning        string  `json:"reasoning"`
	PayloadSnippet   string  `json:"payloadSnippet"`
	ClassifyLatencyMs float64 `json:"classifyLatencyMs"`
	TotalLatencyMs   float64 `json:"totalLatencyMs"`
	UpstreamURL      string  `json:"upstreamUrl"`
	StatusCode       int     `json:"statusCode"`
}

type ProxyHandler struct {
	classifier *classifier.Client
	router     *balancer.Router
	events     chan TrafficEvent
	sseClients sync.Map // map[chan<- TrafficEvent]struct{}
	idCounter  uint64
	mu         sync.Mutex
}

func NewProxyHandler(c *classifier.Client, r *balancer.Router) *ProxyHandler {
	h := &ProxyHandler{
		classifier: c,
		router:     r,
		events:     make(chan TrafficEvent, 256),
	}
	go h.broadcast()
	return h
}

func (h *ProxyHandler) broadcast() {
	for ev := range h.events {
		h.sseClients.Range(func(k, _ any) bool {
			ch := k.(chan TrafficEvent)
			select {
			case ch <- ev:
			default:
			}
			return true
		})
	}
}

func (h *ProxyHandler) SSEHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Connection", "keep-alive")

	ch := make(chan TrafficEvent, 32)
	h.sseClients.Store(ch, struct{}{})
	defer func() {
		h.sseClients.Delete(ch)
		close(ch)
	}()

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "SSE not supported", http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "data: {\"connected\":true}\n\n")
	flusher.Flush()

	for {
		select {
		case <-r.Context().Done():
			return
		case ev, ok := <-ch:
			if !ok {
				return
			}
			data, _ := json.Marshal(ev)
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}

type statusCapture struct {
	http.ResponseWriter
	code int
}

func (s *statusCapture) WriteHeader(code int) {
	s.code = code
	s.ResponseWriter.WriteHeader(code)
}

func (h *ProxyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	body, err := io.ReadAll(io.LimitReader(r.Body, maxBodyBytes))
	r.Body.Close()
	if err != nil {
		http.Error(w, "failed to read body", http.StatusBadRequest)
		return
	}

	classifyStart := time.Now()
	cr, _ := h.classifier.Classify(r.Context(), body, r.Header.Get("Content-Type"))
	classifyMs := float64(time.Since(classifyStart).Milliseconds())

	pool := h.router.Route(cr.Label)
	upstream := pool.Next()

	upURL, err := url.Parse(upstream)
	if err != nil {
		http.Error(w, "invalid upstream", http.StatusBadGateway)
		return
	}

	savedBody := body
	rp := &httputil.ReverseProxy{
		Director: func(req *http.Request) {
			req.URL.Scheme = upURL.Scheme
			req.URL.Host = upURL.Host
			req.Host = upURL.Host
			req.Body = io.NopCloser(bytes.NewReader(savedBody))
			req.ContentLength = int64(len(savedBody))
			req.Header.Set("X-Route-Label", cr.Label)
			req.Header.Set("X-Route-Confidence", fmt.Sprintf("%.2f", cr.Confidence))
		},
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			log.Printf("proxy error upstream=%s: %v", upstream, err)
			http.Error(w, "upstream error", http.StatusBadGateway)
		},
	}

	sc := &statusCapture{ResponseWriter: w, code: 200}
	rp.ServeHTTP(sc, r)

	totalMs := float64(time.Since(start).Milliseconds())
	statusStr := strconv.Itoa(sc.code)

	middleware.RequestsTotal.WithLabelValues(cr.Label, statusStr).Inc()
	middleware.ClassifyLatency.WithLabelValues(cr.Label).Observe(classifyMs)
	middleware.RequestLatency.WithLabelValues(cr.Label).Observe(totalMs)

	snippet := string(body)
	if len(snippet) > 200 {
		snippet = snippet[:200] + "..."
	}

	h.mu.Lock()
	h.idCounter++
	id := fmt.Sprintf("%d", h.idCounter)
	h.mu.Unlock()

	ev := TrafficEvent{
		ID:                id,
		Timestamp:         time.Now().UnixMilli(),
		Label:             cr.Label,
		Confidence:        cr.Confidence,
		Reasoning:         cr.Reasoning,
		PayloadSnippet:    snippet,
		ClassifyLatencyMs: classifyMs,
		TotalLatencyMs:    totalMs,
		UpstreamURL:       upstream,
		StatusCode:        sc.code,
	}
	select {
	case h.events <- ev:
	default:
	}

	log.Printf("[route] label=%s confidence=%.2f upstream=%s classify=%.0fms total=%.0fms status=%d",
		cr.Label, cr.Confidence, upstream, classifyMs, totalMs, sc.code)
}
