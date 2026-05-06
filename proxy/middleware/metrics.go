package middleware

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	RequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "slb_requests_total",
		Help: "Total requests routed by label",
	}, []string{"label", "status_code"})

	ClassifyLatency = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "slb_classify_latency_ms",
		Help:    "Classifier latency in milliseconds",
		Buckets: []float64{10, 50, 100, 200, 500, 1000, 2000},
	}, []string{"label"})

	RequestLatency = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "slb_request_latency_ms",
		Help:    "Total request latency in milliseconds",
		Buckets: []float64{10, 50, 100, 200, 500, 1000, 5000},
	}, []string{"label"})
)
