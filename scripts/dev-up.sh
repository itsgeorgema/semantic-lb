#!/usr/bin/env bash
set -euo pipefail

# BASH_SOURCE is bash-only; fall back to $0 so this works when sourced in zsh too
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)"
VENV_DIR="$REPO_ROOT/.venv"

# --- Python venv setup ---
echo "==> Setting up Python virtual environment..."
if [ ! -d "$VENV_DIR" ]; then
  python3 -m venv "$VENV_DIR"
  echo "    Created .venv"
fi

"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet -r "$REPO_ROOT/classifier/requirements.txt"
echo "    Python deps installed into .venv"

# Activate the venv in the current shell if this script is being sourced.
# If run directly (bash scripts/dev-up.sh), print a reminder instead.
if (return 0 2>/dev/null); then
  # shellcheck source=/dev/null
  source "$VENV_DIR/bin/activate"
  echo "    .venv activated in current shell"
else
  echo "    NOTE: run 'source .venv/bin/activate' to activate the venv in your shell"
fi

# --- Docker build + start ---
echo ""
echo "==> Building images..."
docker compose -f "$REPO_ROOT/docker-compose.yml" build

echo "==> Starting stack..."
docker compose -f "$REPO_ROOT/docker-compose.yml" up -d

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
