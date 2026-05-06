package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/george/semantic-lb/proxy/balancer"
	"github.com/george/semantic-lb/proxy/classifier"
	"github.com/george/semantic-lb/proxy/config"
	"github.com/george/semantic-lb/proxy/handler"
)

func main() {
	cfg := config.Load()

	classifierClient := classifier.NewClient(cfg.ClassifierURL, cfg.ClassifyTimeout)
	router := balancer.NewRouter(cfg.Pools)
	proxyHandler := handler.NewProxyHandler(classifierClient, router)

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})
	mux.HandleFunc("/events", proxyHandler.SSEHandler)
	mux.Handle("/", proxyHandler)

	metricsMux := http.NewServeMux()
	metricsMux.Handle("/metrics", promhttp.Handler())

	proxyServer := &http.Server{Addr: ":" + cfg.ProxyPort, Handler: mux}
	metricsServer := &http.Server{Addr: ":" + cfg.MetricsPort, Handler: metricsMux}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("Proxy listening on :%s", cfg.ProxyPort)
		if err := proxyServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("proxy: %v", err)
		}
	}()
	go func() {
		log.Printf("Metrics listening on :%s", cfg.MetricsPort)
		if err := metricsServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("metrics: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("Shutting down...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	proxyServer.Shutdown(shutdownCtx)
	metricsServer.Shutdown(shutdownCtx)
}
