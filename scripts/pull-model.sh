#!/usr/bin/env bash
set -euo pipefail

MODEL="${1:-mistral}"
echo "Pulling Ollama model: $MODEL"
ollama pull "$MODEL"
echo "Done. Model '$MODEL' is ready."
