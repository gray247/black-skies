"""Content-addressed cache utilities for Black Skies."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Optional

CACHE_ROOT = Path("data/cache")
CACHE_ROOT.mkdir(parents=True, exist_ok=True)


def make_cache_key(*, prompt: str, params: Dict[str, Any]) -> str:
    """Return a deterministic SHA-256 key for the prompt/params combo."""

    payload = {"prompt": prompt, "params": params}
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _cache_path(key: str) -> Path:
    return CACHE_ROOT / f"{key}.json"


def store_cache(key: str, data: Dict[str, Any]) -> Path:
    """Persist cached data under the computed key."""

    path = _cache_path(key)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
    return path


def load_cache(key: str) -> Optional[Dict[str, Any]]:
    """Load cached data if present."""

    path = _cache_path(key)
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


__all__ = ["make_cache_key", "store_cache", "load_cache", "CACHE_ROOT"]
