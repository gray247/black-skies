"""Local cache helpers for per-scene analytics metrics."""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..persistence.atomic import write_json_atomic

_CACHE_SUBDIR = Path("history") / "analytics"
_SANITIZE_PATTERN = re.compile(r"[^A-Za-z0-9_-]")


def _scene_cache_dir(project_root: Path) -> Path:
    return project_root / _CACHE_SUBDIR


def _scene_cache_filename(scene_id: str) -> str:
    safe_id = _SANITIZE_PATTERN.sub("_", scene_id or "scene")
    return f"{safe_id}.json"


def _scene_cache_path(project_root: Path, scene_id: str) -> Path:
    return _scene_cache_dir(project_root) / _scene_cache_filename(scene_id)


def compute_content_hash(text: str) -> str:
    hasher = hashlib.sha256()
    hasher.update(text.encode("utf-8"))
    return hasher.hexdigest()


def read_scene_cache(project_root: Path, scene_id: str) -> dict[str, Any] | None:
    cache_path = _scene_cache_path(project_root, scene_id)
    if not cache_path.exists():
        return None
    try:
        with cache_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError):
        return None


def write_scene_cache(
    project_root: Path,
    *,
    scene_id: str,
    order: int,
    title: str,
    word_count: int,
    dialogue_ratio: float,
    narration_ratio: float,
    readability_metrics: dict[str, Any] | None,
    content_hash: str,
) -> None:
    cache_dir = _scene_cache_dir(project_root)
    cache_dir.mkdir(parents=True, exist_ok=True)
    payload: dict[str, Any] = {
        "scene_id": scene_id,
        "order": order,
        "title": title,
        "word_count": word_count,
        "dialogue_ratio": round(dialogue_ratio, 6),
        "narration_ratio": round(narration_ratio, 6),
        "readability_metrics": readability_metrics or {},
        "content_hash": content_hash,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    write_json_atomic(_scene_cache_path(project_root, scene_id), payload)


def clear_project_caches(project_root: Path) -> None:
    cache_dir = _scene_cache_dir(project_root)
    if not cache_dir.exists():
        return
    for entry in cache_dir.iterdir():
        if entry.is_file():
            try:
                entry.unlink()
            except OSError:
                continue
