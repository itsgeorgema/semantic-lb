package config

import (
	"os"
	"strings"
	"time"
)

type Config struct {
	ProxyPort       string
	MetricsPort     string
	ClassifierURL   string
	ClassifyTimeout time.Duration
	Pools           map[string][]string
}

func Load() *Config {
	return &Config{
		ProxyPort:       getenv("PROXY_PORT", "8080"),
		MetricsPort:     getenv("METRICS_PORT", "9090"),
		ClassifierURL:   getenv("CLASSIFIER_URL", "http://localhost:8001"),
		ClassifyTimeout: 10 * time.Second,
		Pools: map[string][]string{
			"general":      splitURLs(getenv("GENERAL_POOL", "http://localhost:9001")),
			"high-compute": splitURLs(getenv("HIGH_COMPUTE_POOL", "http://localhost:9002")),
			"fast-path":    splitURLs(getenv("FAST_PATH_POOL", "http://localhost:9003")),
		},
	}
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func splitURLs(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}
