"""Content-addressed cache utilities for Black Skies."""

from __future__ import annotations

import hashlib
import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

from .config import ServiceSettings

# ``CACHE_ROOT`` can be monkey-patched in tests; when ``None`` we derive a
# user-writable default from ``ServiceSettings``.
CACHE_ROOT: Path | None = None


def make_cache_key(*, prompt: str, params: Dict[str, Any]) -> str:
    """Return a deterministic SHA-256 key for the prompt/params combo."""

    payload = {"prompt": prompt, "params": params}
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


@lru_cache(maxsize=1)
def _default_cache_root() -> Path:
    settings = ServiceSettings.from_environment()
    runtime_root = settings.project_base_dir / "_runtime"
    return runtime_root.resolve(strict=False) / "cache"


def _ensure_directory(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_cache_root() -> Path:
    """Return the effective cache root, creating it if necessary."""

    root = CACHE_ROOT or _default_cache_root()
    return _ensure_directory(root)


def _cache_path(key: str) -> Path:
    return get_cache_root() / f"{key}.json"


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


__all__ = ["make_cache_key", "store_cache", "load_cache", "get_cache_root", "CACHE_ROOT"]
