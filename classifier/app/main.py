import json
import time
from collections import deque
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from . import cache, llm
from .config import settings
from .models import ClassifyRequest, ClassifyResponse

_latencies: deque[float] = deque(maxlen=1000)
_request_count = 0


@asynccontextmanager
async def lifespan(app: FastAPI):
    import litellm
    print(f"Classifier starting: model={settings.ollama_model} base={settings.ollama_base_url}")
    yield
    print("Classifier shutting down")


app = FastAPI(title="Semantic Classifier", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "ok", "model": settings.ollama_model}


@app.post("/classify", response_model=ClassifyResponse)
async def classify_endpoint(req: ClassifyRequest):
    global _request_count
    _request_count += 1
    start = time.perf_counter()

    payload_bytes = json.dumps(req.payload).encode() if not isinstance(req.payload, str) else req.payload.encode()

    cached = await cache.get(payload_bytes)
    if cached:
        latency_ms = (time.perf_counter() - start) * 1000
        _latencies.append(latency_ms)
        return ClassifyResponse(latency_ms=latency_ms, **cached)

    result = await llm.classify(req.payload)
    await cache.set(payload_bytes, result)

    latency_ms = (time.perf_counter() - start) * 1000
    _latencies.append(latency_ms)
    return ClassifyResponse(latency_ms=latency_ms, **result)


@app.get("/metrics")
async def metrics():
    sorted_lat = sorted(_latencies)
    p50 = sorted_lat[len(sorted_lat) // 2] if sorted_lat else 0
    p99 = sorted_lat[int(len(sorted_lat) * 0.99)] if sorted_lat else 0
    return {
        "request_count": _request_count,
        "p50_ms": round(p50, 2),
        "p99_ms": round(p99, 2),
        "cache": cache.stats(),
    }
