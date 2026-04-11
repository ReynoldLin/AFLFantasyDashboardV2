"""
Simple in-memory TTL cache.
Avoids hammering the AFL Fantasy API on every request.
"""

import time
from typing import Any, Optional

_store = {}


def get(key: str) -> Optional[Any]:
    """Return cached value if it exists and hasn't expired."""
    entry = _store.get(key)
    if entry is None:
        return None
    value, expires_at = entry
    if time.time() > expires_at:
        del _store[key]
        return None
    return value


def set(key: str, value: Any, ttl_seconds: int = 180) -> None:
    """Store a value with a TTL (default: 3 minutes)."""
    _store[key] = (value, time.time() + ttl_seconds)


def invalidate(key: str) -> None:
    """Manually clear a cache entry."""
    _store.pop(key, None)


def info() -> dict:
    """Return current cache state (for the /cache/info debug endpoint)."""
    now = time.time()
    return {
        key: {
            "expires_in_seconds": round(expires_at - now, 1),
            "expired": now > expires_at,
        }
        for key, (_, expires_at) in _store.items()
    }