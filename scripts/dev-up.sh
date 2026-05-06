#!/usr/bin/env bash
set -euo pipefail

echo "==> Building images..."
docker compose build

echo "==> Starting stack..."
docker compose up -d

echo "==> Waiting for classifier health..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8001/health > /dev/null 2>&1; then
    echo "Classifier ready."
    break
  fi
  echo "  waiting ($i/30)..."
  sleep 3
done

echo "==> Waiting for proxy health..."
for i in $(seq 1 20); do
  if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    echo "Proxy ready."
    break
  fi
  sleep 2
done

echo ""
echo "Stack ready!"
echo "  Proxy:      http://localhost:8080"
echo "  Dashboard:  http://localhost:3000"
echo "  Metrics:    http://localhost:9090/metrics"
echo "  Classifier: http://localhost:8001"
