# Semantic Load Balancer

A load balancer that routes requests to different worker pools based on the *semantic content* of the request payload, not just connection metrics. An LLM classifier (via Ollama) inspects each incoming request and labels it `fast-path`, `high-compute`, or `general`, then the proxy forwards it to the appropriate pool.

## Architecture

```
Client
  │
  ▼
Proxy (Go)  ──►  Classifier (Python/FastAPI)  ──►  Ollama (Mistral)
  │
  ├──► Fast-Path Worker Pool   (simple reads, health checks)
  ├──► High-Compute Worker Pool (ML inference, batch jobs, analytics)
  └──► General Worker Pool      (CRUD, auth, standard mutations)
```

| Component     | Tech                        | Port  |
|---------------|-----------------------------|-------|
| Proxy         | Go, `net/http`              | 8080  |
| Metrics       | Prometheus                  | 9090  |
| Classifier    | Python, FastAPI, LiteLLM    | 8001  |
| Ollama        | Mistral (default)           | 11434 |
| Dashboard     | Next.js, Tailwind           | 3000  |
| Workers       | Go (3 pools)                | 9001–9003 |

The classifier maintains an in-memory LRU cache keyed on request payload bytes so repeated identical payloads skip the LLM call entirely. Classification falls back to `general` on timeout or error — the proxy never blocks on a classifier failure.

## Quick Start (Docker Compose)

```bash
cp .env.example .env
source scripts/dev-up.sh
```

Pull the Mistral model into Ollama on first run:

```bash
./scripts/pull-model.sh
```

The proxy is available at `http://localhost:8080`. The dashboard is at `http://localhost:3000`.

## Quick Start (Kubernetes / Minikube)

```bash
./scripts/minikube-deploy.sh
```

This builds images into the Minikube Docker daemon and applies all manifests under `k8s/`.

## Development

```bash
source scripts/dev-up.sh
```

This will:
1. Create a `.venv` in the repo root (if one doesn't exist) and install the classifier's Python dependencies into it.
2. Activate the venv in your current shell (only when the script is sourced — use `source`, not `bash`).
3. Build all Docker images and start the full stack.

If you want to activate the venv independently later:

```bash
source .venv/bin/activate
```

> **Note:** Running `bash scripts/dev-up.sh` instead of `source` will still create the venv and build/start the stack, but the venv will not be active in your terminal afterward.

## Load Testing

```bash
./scripts/load-test.sh
```

Sends a mixed workload of fast-path, high-compute, and general requests to verify routing.

## Environment Variables

| Variable              | Default                     | Description                          |
|-----------------------|-----------------------------|--------------------------------------|
| `CLASSIFIER_URL`      | `http://localhost:8001`     | Classifier service endpoint          |
| `OLLAMA_BASE_URL`     | `http://localhost:11434`    | Ollama API base URL                  |
| `OLLAMA_MODEL`        | `mistral`                   | Model used for classification        |
| `PROXY_PORT`          | `8080`                      | Proxy listen port                    |
| `METRICS_PORT`        | `9090`                      | Prometheus metrics port              |
| `GENERAL_POOL`        | `http://localhost:9001`     | Comma-separated general upstreams    |
| `HIGH_COMPUTE_POOL`   | `http://localhost:9002`     | Comma-separated high-compute upstreams |
| `FAST_PATH_POOL`      | `http://localhost:9003`     | Comma-separated fast-path upstreams  |

## Classification Labels

| Label          | Routed to          | Examples                                           |
|----------------|--------------------|----------------------------------------------------|
| `fast-path`    | Fast-Path pool     | Single-field lookups, health checks, simple GETs   |
| `high-compute` | High-Compute pool  | ML inference, large aggregations, batch jobs       |
| `general`      | General pool       | CRUD, auth, standard GraphQL mutations             |

## Metrics

Prometheus metrics are exposed at `:9090/metrics`. The classifier also exposes p50/p99 latency and cache hit stats at `:8001/metrics`.

## Project Layout

```
proxy/          Go proxy — HTTP server, classifier client, round-robin balancer
classifier/     Python FastAPI service — LLM classification, caching
workers/        Go stub workers (general, high-compute, fast-path)
dashboard/      Next.js real-time traffic dashboard
k8s/            Kubernetes manifests (namespace, deployments, services)
scripts/        Helper scripts for dev, deploy, and load testing
```
