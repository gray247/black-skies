"""Content-addressed cache utilities for Black Skies."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Optional

from .history import project_history_subdir
from .io import atomic_write_json, read_json


def make_cache_key(*, prompt: str, params: Dict[str, Any]) -> str:
    """Return a deterministic SHA-256 key for the prompt/params combo."""

    payload = {"prompt": prompt, "params": params}
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _cache_root_for_project(project_root: Path) -> Path:
    cache_root = project_history_subdir(project_root, "cache")
    cache_root.mkdir(parents=True, exist_ok=True)
    return cache_root


def _cache_path(project_root: Path, key: str) -> Path:
    return _cache_root_for_project(project_root) / f"{key}.json"


def store_cache(project_root: Path, key: str, data: Dict[str, Any]) -> Path:
    """Persist cached data under the computed key."""

    path = _cache_path(project_root, key)
    atomic_write_json(path, data)
    return path


def load_cache(project_root: Path, key: str) -> Optional[Dict[str, Any]]:
    """Load cached data if present."""

    path = _cache_path(project_root, key)
    if not path.exists():
        return None
    return read_json(path)


__all__ = ["make_cache_key", "store_cache", "load_cache"]
