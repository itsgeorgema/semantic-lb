#!/usr/bin/env bash
set -euo pipefail

PROXY="${PROXY_URL:-http://localhost:8080}"
COUNT="${1:-50}"

PAYLOADS=(
  '{"query": "SELECT id FROM users WHERE id = 1"}'
  '{"query": "SELECT * FROM orders JOIN products ON orders.product_id = products.id JOIN users ON orders.user_id = users.id WHERE orders.created_at > NOW() - INTERVAL 30 DAY GROUP BY users.region HAVING COUNT(*) > 100"}'
  '{"operation": "ML_INFERENCE", "model": "recommendation-v3", "inputs": [0.1, 0.2, 0.3, 0.4, 0.5]}'
  '{"query": "{ user { id name } }"}'
  '{"query": "{ analytics { dailyActiveUsers weeklyRetention revenueByRegion { region amount } cohorts { date users ltv } } }"}'
  '{"action": "CREATE_USER", "data": {"name": "Alice", "email": "alice@example.com"}}'
  '{"action": "HEALTH_CHECK"}'
  '{"batch": [{"op": "ingest", "records": 10000}, {"op": "transform"}, {"op": "aggregate"}]}'
)

echo "Sending $COUNT requests to $PROXY..."
for i in $(seq 1 "$COUNT"); do
  PAYLOAD="${PAYLOADS[$((RANDOM % ${#PAYLOADS[@]}))]}"
  RESP=$(curl -sf -X POST "$PROXY/" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    -w "\n%{http_code}" 2>/dev/null || echo "ERROR")
  STATUS=$(echo "$RESP" | tail -1)
  echo "[$i/$COUNT] status=$STATUS payload=$(echo "$PAYLOAD" | cut -c1-60)"
  sleep 0.2
done

echo "Load test complete."
