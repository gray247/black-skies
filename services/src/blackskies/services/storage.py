"""Simple file-backed storage helpers for Black Skies models."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

DATA_ROOT = Path("data")
DATA_ROOT.mkdir(parents=True, exist_ok=True)

_KIND_DIRS = {
    "outline": DATA_ROOT / "outlines",
    "project": DATA_ROOT / "projects",
    "draft": DATA_ROOT / "drafts",
    "critique": DATA_ROOT / "critiques",
    "rewrite": DATA_ROOT / "rewrites",
    "export": DATA_ROOT / "exports",
    "run": DATA_ROOT / "runs",
    "template": DATA_ROOT / "templates",
}

for directory in _KIND_DIRS.values():
    directory.mkdir(parents=True, exist_ok=True)


def path_for(kind: str, identifier: str) -> Path:
    """Return the JSON file path for the given object kind and identifier."""

    try:
        directory = _KIND_DIRS[kind]
    except KeyError as exc:  # pragma: no cover - defensive guard
        raise ValueError(f"Unknown storage kind: {kind}") from exc
    return directory / f"{identifier}.json"


def save(obj: dict[str, Any]) -> Path:
    """Persist a model dict using its kind and id fields."""

    kind = obj.get("kind")
    identifier = obj.get("id")
    if not isinstance(kind, str) or not isinstance(identifier, str):  # pragma: no cover
        raise ValueError("Object must contain string 'kind' and 'id' fields.")
    target = path_for(kind, identifier)
    with target.open("w", encoding="utf-8") as handle:
        json.dump(obj, handle, indent=2, ensure_ascii=False, default=_json_default)
    return target


def load(kind: str, identifier: str) -> dict[str, Any]:
    """Load a previously saved model dictionary."""

    target = path_for(kind, identifier)
    if not target.exists():
        raise FileNotFoundError(f"No {kind} stored with id {identifier}.")
    with target.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _json_default(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    raise TypeError(f"Object of type {value.__class__.__name__} is not JSON serializable")
