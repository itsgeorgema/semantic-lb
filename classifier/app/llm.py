import asyncio
import json
import re
import time
from typing import Any

import litellm

from .config import settings

SYSTEM_PROMPT = """You are a request classifier for a semantic load balancer.
Analyze the JSON or GraphQL payload and respond ONLY with valid JSON (no markdown, no explanation):
{"label": "<general|high-compute|fast-path>", "confidence": <0.0-1.0>, "reasoning": "<one sentence>"}

Classification rules:
- fast-path: simple reads, single-field lookups, health checks, trivial GET-like queries
- high-compute: ML inference, large aggregations, batch operations, complex nested GraphQL fragments, report generation, analytical joins
- general: everything else (CRUD operations, moderate queries, auth operations, standard mutations)"""


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r'\{[^{}]+\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return {"label": "general", "confidence": 0.5, "reasoning": "Failed to parse classifier response"}


async def classify(payload: Any) -> dict[str, Any]:
    payload_str = json.dumps(payload) if not isinstance(payload, str) else payload
    if len(payload_str) > 2000:
        payload_str = payload_str[:2000] + "..."

    user_message = f"Classify this payload: {payload_str}"

    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(
                litellm.completion,
                model=f"ollama/{settings.ollama_model}",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                api_base=settings.ollama_base_url,
                temperature=0.1,
                max_tokens=150,
            ),
            timeout=settings.classify_timeout_seconds,
        )
        content = response.choices[0].message.content or ""
        result = _extract_json(content)
        result.setdefault("label", "general")
        result.setdefault("confidence", 0.5)
        result.setdefault("reasoning", "")
        label = result["label"]
        if label not in ("general", "high-compute", "fast-path"):
            result["label"] = "general"
        result["confidence"] = max(0.0, min(1.0, float(result["confidence"])))
        return result
    except asyncio.TimeoutError:
        return {"label": "general", "confidence": 0.0, "reasoning": "Classifier timeout; defaulting to general"}
    except Exception as e:
        return {"label": "general", "confidence": 0.0, "reasoning": f"Classifier error: {str(e)[:100]}"}
