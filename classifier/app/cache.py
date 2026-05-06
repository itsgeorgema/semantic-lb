import asyncio
import hashlib
from cachetools import TTLCache
from .config import settings

_cache: TTLCache = TTLCache(maxsize=settings.cache_maxsize, ttl=settings.cache_ttl_seconds)
_lock = asyncio.Lock()
_hits = 0
_misses = 0


def _key(payload_bytes: bytes) -> str:
    return hashlib.sha256(payload_bytes).hexdigest()


async def get(payload_bytes: bytes):
    global _hits, _misses
    k = _key(payload_bytes)
    async with _lock:
        val = _cache.get(k)
        if val is not None:
            _hits += 1
            return val
        _misses += 1
        return None


async def set(payload_bytes: bytes, value) -> None:
    k = _key(payload_bytes)
    async with _lock:
        _cache[k] = value


def hit_rate() -> float:
    total = _hits + _misses
    return _hits / total if total > 0 else 0.0


def stats() -> dict:
    return {"hits": _hits, "misses": _misses, "hit_rate": hit_rate(), "size": len(_cache)}
