"""Run ledger management for Black Skies operations."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import uuid4

from .config import ServiceSettings
from .history import project_history_subdir
from .io import atomic_write_json, read_json

def _timestamp() -> str:
    return datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")


def _default_runs_root() -> Path:
    settings = ServiceSettings.from_environment()
    runtime_root = settings.project_base_dir / "_runtime"
    return runtime_root.resolve(strict=False) / "runs"


def _project_runs_root(project_root: Path | None) -> Path:
    if project_root is not None:
        return project_history_subdir(project_root, "runs")
    return _default_runs_root()


def _ensure_directory(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_runs_root(project_root: Path | None = None) -> Path:
    """Return the directory used for run ledgers."""

    root = _project_runs_root(project_root)
    return _ensure_directory(root)


def _run_dir(run_id: str, project_root: Path | None) -> Path:
    return get_runs_root(project_root) / run_id


def _ledger_path(run_id: str, project_root: Path | None) -> Path:
    return _run_dir(run_id, project_root) / "run.json"


def start_run(kind: str, params: Dict[str, Any], *, project_root: Path | None = None) -> Dict[str, Any]:
    """Create a new run ledger entry and return the metadata."""

    run_id = f"{kind}-{uuid4().hex[:8]}"
    created_at = _timestamp()
    run_dir = _ensure_directory(_run_dir(run_id, project_root))
    metadata: Dict[str, Any] = {
        "run_id": run_id,
        "kind": kind,
        "params": params,
        "status": "running",
        "created_at": created_at,
        "updated_at": created_at,
        "events": [],
        "run_root": str(run_dir),
    }
    ledger_path = run_dir / "run.json"
    atomic_write_json(ledger_path, metadata)
    return metadata


def append_event(
    run_id: str,
    event_type: str,
    payload: Dict[str, Any],
    *,
    project_root: Path | None = None,
) -> Dict[str, Any]:
    """Append an event to the run ledger."""

    ledger_path = _ledger_path(run_id, project_root)
    metadata = read_json(ledger_path)
    event = {
        "id": len(metadata.get("events", [])) + 1,
        "timestamp": _timestamp(),
        "type": event_type,
        "payload": payload,
    }
    metadata.setdefault("events", []).append(event)
    metadata["updated_at"] = _timestamp()
    atomic_write_json(ledger_path, metadata)
    return event


def finalize_run(
    run_id: str,
    *,
    status: str = "completed",
    result: Optional[Dict[str, Any]] = None,
    project_root: Path | None = None,
) -> Dict[str, Any]:
    """Mark a run as finished and persist the final metadata."""

    ledger_path = _ledger_path(run_id, project_root)
    metadata = read_json(ledger_path)
    metadata["status"] = status
    metadata["updated_at"] = _timestamp()
    if result is not None:
        metadata["result"] = result
    atomic_write_json(ledger_path, metadata)
    return metadata


__all__ = ["start_run", "append_event", "finalize_run", "get_runs_root", "RUNS_ROOT"]
