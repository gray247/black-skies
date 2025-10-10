"""Simple file-backed storage helpers for Black Skies models."""

from __future__ import annotations

import json
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

from .config import ServiceSettings

_KIND_SUBDIRS: dict[str, str] = {
    "outline": "outlines",
    "project": "projects",
    "draft": "drafts",
    "critique": "critiques",
    "rewrite": "rewrites",
    "export": "exports",
    "run": "runs",
    "template": "templates",
}


def _resolve_base_dir(base_dir: Path | ServiceSettings) -> Path:
    if isinstance(base_dir, ServiceSettings):
        resolved = base_dir.project_base_dir
    else:
        resolved = base_dir
    return resolved


@lru_cache(maxsize=None)
def _ensure_kind_dir(base_path: Path, kind: str) -> Path:
    try:
        subdir = _KIND_SUBDIRS[kind]
    except KeyError as exc:  # pragma: no cover - defensive guard
        raise ValueError(f"Unknown storage kind: {kind}") from exc

    target_dir = base_path / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir


def path_for(
    kind: str,
    identifier: str,
    *,
    base_dir: Path | ServiceSettings,
) -> Path:
    """Return the JSON file path for the given object kind and identifier."""

    if not isinstance(identifier, str) or not identifier:
        raise ValueError("Identifier must be a non-empty string.")

    base_path = _resolve_base_dir(base_dir)
    directory = _ensure_kind_dir(base_path, kind)
    return directory / f"{identifier}.json"


def save(obj: dict[str, Any], *, base_dir: Path | ServiceSettings) -> Path:
    """Persist a model dict using its kind and id fields."""

    kind = obj.get("kind")
    identifier = obj.get("id")
    if not isinstance(kind, str) or not isinstance(identifier, str):
        raise ValueError("Object must contain string 'kind' and 'id' fields.")
    if not kind or not identifier:
        raise ValueError("'kind' and 'id' must be non-empty strings.")
    target = path_for(kind, identifier, base_dir=base_dir)
    with target.open("w", encoding="utf-8") as handle:
        json.dump(obj, handle, indent=2, ensure_ascii=False, default=_json_default)
    return target


def load(
    kind: str,
    identifier: str,
    *,
    base_dir: Path | ServiceSettings,
) -> dict[str, Any]:
    """Load a previously saved model dictionary."""

    target = path_for(kind, identifier, base_dir=base_dir)
    if not target.exists():
        raise FileNotFoundError(f"No {kind} stored with id {identifier}.")
    with target.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _json_default(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    raise TypeError(f"Object of type {value.__class__.__name__} is not JSON serializable")
