"""Run ledger management for Black Skies operations."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import uuid4

from .config import ServiceSettings

# Tests monkey-patch ``RUNS_ROOT``; default resolution happens lazily.
RUNS_ROOT: Path | None = None


def _timestamp() -> str:
    return datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")


@lru_cache(maxsize=1)
def _default_runs_root() -> Path:
    settings = ServiceSettings.from_environment()
    runtime_root = settings.project_base_dir / "_runtime"
    return runtime_root.resolve(strict=False) / "runs"


def _ensure_directory(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_runs_root() -> Path:
    """Return the directory used for run ledgers."""

    root = RUNS_ROOT or _default_runs_root()
    return _ensure_directory(root)


def _run_dir(run_id: str) -> Path:
    return get_runs_root() / run_id


def _ledger_path(run_id: str) -> Path:
    return _run_dir(run_id) / "run.json"


def _write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)


def _read_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def start_run(kind: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new run ledger entry and return the metadata."""

    run_id = f"{kind}-{uuid4().hex[:8]}"
    created_at = _timestamp()
    metadata: Dict[str, Any] = {
        "run_id": run_id,
        "kind": kind,
        "params": params,
        "status": "running",
        "created_at": created_at,
        "updated_at": created_at,
        "events": [],
    }
    _write_json(_ledger_path(run_id), metadata)
    return metadata


def append_event(run_id: str, event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Append an event to the run ledger."""

    ledger_path = _ledger_path(run_id)
    metadata = _read_json(ledger_path)
    event = {
        "id": len(metadata.get("events", [])) + 1,
        "timestamp": _timestamp(),
        "type": event_type,
        "payload": payload,
    }
    metadata.setdefault("events", []).append(event)
    metadata["updated_at"] = _timestamp()
    _write_json(ledger_path, metadata)
    return event


def finalize_run(
    run_id: str, *, status: str = "completed", result: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Mark a run as finished and persist the final metadata."""

    ledger_path = _ledger_path(run_id)
    metadata = _read_json(ledger_path)
    metadata["status"] = status
    metadata["updated_at"] = _timestamp()
    if result is not None:
        metadata["result"] = result
    _write_json(ledger_path, metadata)
    return metadata


__all__ = ["start_run", "append_event", "finalize_run", "get_runs_root", "RUNS_ROOT"]
