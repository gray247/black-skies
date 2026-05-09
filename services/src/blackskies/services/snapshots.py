"""Snapshot orchestration helpers for draft workflows."""

from __future__ import annotations

import hashlib
import json
import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter
from typing import TYPE_CHECKING, Any, Callable, Iterable, Mapping

from .diagnostics import DiagnosticLogger
from .persistence import SnapshotPersistence

if TYPE_CHECKING:
    from .routers.recovery import RecoveryTracker

SNAPSHOT_DIR_NAME = ".snapshots"
SNAPSHOT_RETENTION = 7
WIZARD_LOCK_SLOW_LATENCY_MS = 100.0
ACCEPT_SLOW_LATENCY_MS = 100.0

LOGGER = logging.getLogger(__name__)


class SnapshotOperationError(RuntimeError):
    """Base error raised when snapshot orchestration fails."""

    def __init__(self, message: str, *, details: Mapping[str, Any] | None = None) -> None:
        super().__init__(message)
        self.details = dict(details or {})


class SnapshotIncludesError(SnapshotOperationError):
    """Raised when include filters are invalid for a snapshot."""


class SnapshotPersistenceError(SnapshotOperationError):
    """Raised when snapshot persistence fails."""


def create_accept_snapshot(
    project_id: str,
    snapshot_label: str | None,
    *,
    snapshot_persistence: SnapshotPersistence,
    recovery_tracker: RecoveryTracker,
    timing_hook: Callable[[dict[str, float]], None] | None = None,
    durable: bool = True,
) -> dict[str, Any]:
    """Create a snapshot for an accepted draft unit and record recovery state."""

    timing_snapshot: dict[str, float] | None = None

    def _capture_timing_snapshot(timings: dict[str, float]) -> None:
        nonlocal timing_snapshot
        timing_snapshot = dict(timings)

    try:
        snapshot_info = snapshot_persistence.create_snapshot(
            project_id,
            label=snapshot_label,
            timing_hook=_capture_timing_snapshot if timing_hook is not None else None,
            durable=durable,
        )
    except OSError as exc:
        label_token = snapshot_label or "accept"
        raise SnapshotPersistenceError(
            "Failed to create accept snapshot.",
            details={
                "project_id": project_id,
                "label": label_token,
                "errno": getattr(exc, "errno", None),
                "error": str(exc),
            },
        ) from exc
    snapshot_ms = timing_snapshot.get("total_ms", 0.0) if timing_snapshot else 0.0
    recovery_started = perf_counter()
    recovery_tracker.mark_completed(project_id, snapshot_info)
    recovery_ms = (perf_counter() - recovery_started) * 1000.0
    if timing_hook is not None:
        timing_hook(
            {
                "snapshot_create_allocate_ms": (
                    timing_snapshot.get("allocate_ms", 0.0) if timing_snapshot else 0.0
                ),
                "snapshot_create_include_ms": (
                    timing_snapshot.get("include_ms", 0.0) if timing_snapshot else 0.0
                ),
                "snapshot_create_copy_ms": (
                    timing_snapshot.get("copy_ms", 0.0) if timing_snapshot else 0.0
                ),
                "snapshot_create_metadata_ms": (
                    timing_snapshot.get("metadata_ms", 0.0) if timing_snapshot else 0.0
                ),
                "snapshot_create_manifest_ms": (
                    timing_snapshot.get("manifest_ms", 0.0) if timing_snapshot else 0.0
                ),
                "snapshot_create_total_ms": snapshot_ms,
                "recovery_finalize_ms": recovery_ms,
                "total_ms": snapshot_ms + recovery_ms,
            }
        )
    LOGGER.debug("Created accept snapshot", extra={"project_id": project_id, **snapshot_info})
    return snapshot_info


def log_accept_timing_snapshot(
    *,
    project_id: str,
    unit_id: str,
    draft_id: str,
    snapshot_id: str | None,
    timings: Mapping[str, float],
) -> None:
    """Emit a low-noise warning when accept timing exceeds the diagnostic floor."""

    total_ms = float(timings.get("total_ms", 0.0))
    if total_ms < ACCEPT_SLOW_LATENCY_MS:
        return

    LOGGER.warning(
        (
            "Slow draft accept request path=/api/v1/draft/accept "
            "project_id=%s unit_id=%s draft_id=%s total_ms=%.2f "
            "request_validation_ms=%.2f draft_lookup_ms=%.2f audited_chain_write_ms=%.2f "
            "diff_ms=%.2f accept_apply_ms=%.2f snapshot_create_total_ms=%.2f "
            "snapshot_create_allocate_ms=%.2f snapshot_create_include_ms=%.2f "
            "snapshot_create_copy_ms=%.2f snapshot_create_metadata_ms=%.2f "
            "snapshot_create_manifest_ms=%.2f recovery_finalize_ms=%.2f "
            "budget_update_ms=%.2f response_assembly_ms=%.2f snapshot_id=%s"
        ),
        project_id,
        unit_id,
        draft_id,
        total_ms,
        float(timings.get("request_validation_ms", 0.0)),
        float(timings.get("draft_lookup_ms", 0.0)),
        float(timings.get("audited_chain_write_ms", 0.0)),
        float(timings.get("diff_ms", 0.0)),
        float(timings.get("accept_apply_ms", 0.0)),
        float(timings.get("snapshot_create_total_ms", 0.0)),
        float(timings.get("snapshot_create_allocate_ms", 0.0)),
        float(timings.get("snapshot_create_include_ms", 0.0)),
        float(timings.get("snapshot_create_copy_ms", 0.0)),
        float(timings.get("snapshot_create_metadata_ms", 0.0)),
        float(timings.get("snapshot_create_manifest_ms", 0.0)),
        float(timings.get("recovery_finalize_ms", 0.0)),
        float(timings.get("budget_update_ms", 0.0)),
        float(timings.get("response_assembly_ms", 0.0)),
        snapshot_id or "<unknown>",
    )


def create_wizard_lock_snapshot(
    *,
    project_id: str,
    step: str,
    label: str,
    includes: list[str] | None,
    project_root: Path,
    diagnostics: DiagnosticLogger,
    snapshot_persistence: SnapshotPersistence,
) -> dict[str, Any]:
    """Create a snapshot for a wizard lock action with diagnostics."""

    timing_snapshot: dict[str, float] | None = None

    def _capture_timing_snapshot(timings: dict[str, float]) -> None:
        nonlocal timing_snapshot
        timing_snapshot = dict(timings)

    try:
        snapshot_info = snapshot_persistence.create_snapshot(
            project_id,
            label=label,
            include_entries=includes,
            timing_hook=_capture_timing_snapshot,
        )
    except ValueError as exc:
        raise SnapshotIncludesError(
            "Invalid snapshot includes.",
            details={"project_id": project_id, "includes": includes or [], "error": str(exc)},
        ) from exc
    except OSError as exc:
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Failed to create wizard snapshot.",
            details={"step": step, "error": str(exc)},
        )
        raise SnapshotPersistenceError(
            "Failed to create wizard snapshot.",
            details={"project_id": project_id, "step": step},
        ) from exc

    if timing_snapshot and timing_snapshot.get("total_ms", 0.0) >= WIZARD_LOCK_SLOW_LATENCY_MS:
        LOGGER.warning(
            (
                "Slow wizard lock snapshot request path=/api/v1/draft/wizard/lock "
                "project_id=%s step=%s total_ms=%.2f allocate_ms=%.2f include_ms=%.2f "
                "copy_ms=%.2f metadata_ms=%.2f manifest_ms=%.2f snapshot_id=%s"
            ),
            project_id,
            step,
            timing_snapshot.get("total_ms", 0.0),
            timing_snapshot.get("allocate_ms", 0.0),
            timing_snapshot.get("include_ms", 0.0),
            timing_snapshot.get("copy_ms", 0.0),
            timing_snapshot.get("metadata_ms", 0.0),
            timing_snapshot.get("manifest_ms", 0.0),
            snapshot_info.get("snapshot_id"),
        )

    diagnostics.log(
        project_root,
        code="SNAPSHOT",
        message=f"Wizard step {step} locked.",
        details={"step": step, "snapshot_id": snapshot_info.get("snapshot_id")},
    )
    LOGGER.debug(
        "Wizard lock snapshot created",
        extra={"project_id": project_id, "step": step, **snapshot_info},
    )
    return snapshot_info


def _snapshot_root(project_root: Path) -> Path:
    return project_root / SNAPSHOT_DIR_NAME


def _timestamp() -> str:
    return datetime.now(timezone.utc).strftime("ss_%Y%m%dT%H%M%SZ")


def _hashfile(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            digest.update(chunk)
    return digest.hexdigest()


def create_snapshot(project_root: Path) -> dict[str, Any]:
    """Create a manual snapshot of the project root for verification."""

    snapshot_root = _snapshot_root(project_root)
    snapshot_root.mkdir(parents=True, exist_ok=True)
    snapshot_id = _timestamp()
    temp_dir = snapshot_root / f"{snapshot_id}.tmp"
    final_dir = snapshot_root / snapshot_id

    if temp_dir.exists():
        shutil.rmtree(temp_dir)
    temp_dir.mkdir(parents=True)

    files_included: list[dict[str, str]] = []

    for path in project_root.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(project_root)
        if not relative.parts or relative.parts[0] in {SNAPSHOT_DIR_NAME, "exports"}:
            continue
        destination = temp_dir / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, destination)
        files_included.append(
            {
                "path": relative.as_posix(),
                "checksum": _hashfile(path),
            }
        )

    manifest = {
        "schema_version": "SnapshotManifest v1",
        "snapshot_id": snapshot_id,
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "files_included": files_included,
    }

    manifest_path = temp_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    if final_dir.exists():
        shutil.rmtree(final_dir)
    temp_dir.rename(final_dir)

    prune_snapshots(project_root, keep=SNAPSHOT_RETENTION)

    manifest["path"] = f"{SNAPSHOT_DIR_NAME}/{snapshot_id}"
    return manifest


def list_snapshots(project_root: Path) -> list[dict[str, Any]]:
    """Return metadata for existing manual snapshots."""

    snapshot_root = _snapshot_root(project_root)
    if not snapshot_root.exists():
        return []

    entries: list[dict[str, Any]] = []
    for directory in sorted(
        (item for item in snapshot_root.iterdir() if item.is_dir()),
        key=lambda entry: entry.name,
        reverse=True,
    ):
        manifest_path = directory / "manifest.json"
        if not manifest_path.exists():
            continue
        try:
            payload = json.loads(manifest_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        data = dict(payload)
        data.setdefault("snapshot_id", directory.name)
        data["path"] = f"{SNAPSHOT_DIR_NAME}/{directory.name}"
        entries.append(data)
    return entries


def prune_snapshots(project_root: Path, *, keep: int) -> None:
    """Prune manual snapshots while enforcing the retention policy."""

    snapshot_root = _snapshot_root(project_root)
    if not snapshot_root.exists() or keep <= 0:
        return

    directories = sorted(
        (item for item in snapshot_root.iterdir() if item.is_dir()),
        key=lambda entry: entry.name,
        reverse=True,
    )
    for index, directory in enumerate(directories):
        if index >= keep:
            shutil.rmtree(directory, ignore_errors=True)


__all__ = [
    "SnapshotIncludesError",
    "SnapshotOperationError",
    "SnapshotPersistenceError",
    "ACCEPT_SLOW_LATENCY_MS",
    "create_accept_snapshot",
    "create_wizard_lock_snapshot",
    "create_snapshot",
    "list_snapshots",
    "log_accept_timing_snapshot",
    "prune_snapshots",
]
