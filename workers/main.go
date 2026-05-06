package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

var workerType string
var port string

var latencies = map[string]time.Duration{
	"general":      50 * time.Millisecond,
	"high-compute": 400 * time.Millisecond,
	"fast-path":    5 * time.Millisecond,
}

func main() {
	flag.StringVar(&workerType, "type", "general", "Worker type: general|high-compute|fast-path")
	flag.StringVar(&port, "port", "9001", "Listen port")
	flag.Parse()

	latency, ok := latencies[workerType]
	if !ok {
		log.Fatalf("Unknown worker type: %s", workerType)
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"ok","worker":"%s"}`, workerType)
	})

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
		r.Body.Close()

		snippet := string(body)
		if len(snippet) > 200 {
			snippet = snippet[:200] + "..."
		}

		log.Printf("[%s] %s %s body=%q", workerType, r.Method, r.URL.Path, snippet)

		time.Sleep(latency)

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Worker-Type", workerType)
		json.NewEncoder(w).Encode(map[string]any{
			"worker":               workerType,
			"echo":                 snippet,
			"simulated_latency_ms": latency.Milliseconds(),
		})
	})

	addr := ":" + port
	log.Printf("Worker [%s] listening on %s", workerType, addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
