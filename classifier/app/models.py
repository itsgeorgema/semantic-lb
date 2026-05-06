from typing import Literal
from pydantic import BaseModel


class ClassifyRequest(BaseModel):
    payload: dict | str
    content_type: str = "application/json"


class ClassifyResponse(BaseModel):
    label: Literal["general", "high-compute", "fast-path"]
    confidence: float
    reasoning: str
    latency_ms: float
