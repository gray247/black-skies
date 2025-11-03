"""Snapshot persistence helpers shared across recovery workflows."""

from __future__ import annotations

import json
import re
import shutil
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any, Sequence
from uuid import uuid4

from blackskies.services.utils import safe_dump, to_posix

from ..config import ServiceSettings
from ..snapshot_includes import collect_include_specs, copy_include_entries, restore_include_entries
from ..snapshot_manifest import SnapshotMetadata, build_snapshot_manifest, timestamp_now
from .atomic import write_json_atomic, write_text_atomic

SNAPSHOT_ID_PATTERN = re.compile(r"^\d{8}T\d{6}(?:\d{6})?Z(?:-[0-9a-f]{8})?$")


@dataclass
class SnapshotPersistence:
    """Create and restore project snapshots for crash recovery."""

    settings: ServiceSettings
    _id_lock: Lock = field(default_factory=Lock, init=False, repr=False)
    _last_snapshot_prefix: str = field(default="", init=False, repr=False)

    def _snapshots_dir(self, project_id: str) -> Path:
        project_root = self.settings.project_base_dir / project_id
        snapshots_dir = project_root / "history" / "snapshots"
        snapshots_dir.mkdir(parents=True, exist_ok=True)
        return snapshots_dir

    def _snapshot_id(self, attempt: int = 0) -> str:
        """Return a snapshot identifier with microsecond precision."""

        base = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        suffix_required = attempt > 0
        with self._id_lock:
            if base == self._last_snapshot_prefix:
                suffix_required = True
            else:
                self._last_snapshot_prefix = base
        if not suffix_required:
            return base
        return f"{base}-{uuid4().hex[:8]}"

    def _sanitize_label(self, label: str | None) -> str:
        if not label:
            return "accept"
        sanitized = re.sub(r"[^a-zA-Z0-9_-]+", "-", label.strip())
        return sanitized or "accept"

    def _allocate_directory(
        self,
        project_id: str,
        label_token: str,
        *,
        max_attempts: int = 5,
    ) -> tuple[Path, Path, str]:
        """Allocate a unique snapshot directory within the history folder."""

        snapshots_dir = self._snapshots_dir(project_id)
        snapshots_root = snapshots_dir.resolve()
        last_error: OSError | None = None

        for attempt in range(max_attempts):
            candidate_id = self._snapshot_id(attempt=attempt)
            candidate_dir = snapshots_dir / f"{candidate_id}_{label_token}"
            candidate_resolved = candidate_dir.resolve()
            if not candidate_resolved.is_relative_to(snapshots_root):
                raise ValueError("Snapshot directory must be inside the project history folder.")
            try:
                candidate_dir.mkdir(parents=True, exist_ok=False)
            except FileExistsError as exc:
                last_error = exc
                continue
            return candidate_dir, candidate_resolved, candidate_id

        from ..snapshots import SnapshotPersistenceError

        details = {
            "project_id": project_id,
            "label": label_token,
            "attempts": max_attempts,
        }
        raise SnapshotPersistenceError(
            "Failed to allocate a snapshot directory.",
            details=details,
        ) from last_error

    def _build_metadata(
        self,
        *,
        snapshot_id: str,
        project_id: str,
        label: str,
        includes: Sequence[str],
    ) -> SnapshotMetadata:
        """Assemble structured metadata for a newly created snapshot."""

        return SnapshotMetadata(
            snapshot_id=snapshot_id,
            project_id=project_id,
            label=label,
            created_at=timestamp_now(),
            includes=tuple(includes),
        )

    def _write_snapshot_manifest(
        self,
        directory: Path,
        *,
        metadata: SnapshotMetadata,
    ) -> None:
        """Render a YAML manifest describing the snapshot contents."""

        project_root = self.settings.project_base_dir / metadata.project_id
        manifest = build_snapshot_manifest(
            directory,
            metadata=metadata,
            project_root=project_root,
        )
        manifest_yaml = safe_dump(manifest, sort_keys=False, allow_unicode=True, indent=2)
        write_text_atomic(directory / "snapshot.yaml", manifest_yaml)

    def create_snapshot(
        self,
        project_id: str,
        *,
        label: str | None = None,
        include_entries: Sequence[str] | None = None,
    ) -> dict[str, Any]:
        """Create a snapshot of the project directory."""

        label_token = self._sanitize_label(label)
        directory, directory_resolved, snapshot_id = self._allocate_directory(
            project_id,
            label_token,
        )
        project_root = self.settings.project_base_dir / project_id
        project_root.mkdir(parents=True, exist_ok=True)
        project_root_resolved = project_root.resolve()

        try:
            include_specs = collect_include_specs(
                project_root=project_root,
                project_root_resolved=project_root_resolved,
                snapshot_dir=directory,
                snapshot_dir_resolved=directory_resolved,
                include_entries=include_entries,
            )
        except ValueError:
            if directory.exists():
                shutil.rmtree(directory, ignore_errors=True)
            raise

        recorded = copy_include_entries(include_specs)
        metadata = self._build_metadata(
            snapshot_id=snapshot_id,
            project_id=project_id,
            label=label_token,
            includes=recorded,
        )
        write_json_atomic(directory / "metadata.json", metadata.as_dict())
        self._write_snapshot_manifest(directory, metadata=metadata)

        try:
            relative_path = to_posix(directory.relative_to(project_root))
        except ValueError:
            relative_path = to_posix(directory)
        return {
            "snapshot_id": metadata.snapshot_id,
            "label": metadata.label,
            "created_at": metadata.created_at,
            "path": relative_path,
            "includes": list(metadata.includes),
        }

    def restore_snapshot(self, project_id: str, snapshot_id: str) -> dict[str, Any]:
        """Restore a snapshot back onto the project directory."""

        if not SNAPSHOT_ID_PATTERN.fullmatch(snapshot_id):
            raise ValueError(f"Snapshot id {snapshot_id!r} is invalid.")
        snapshots_dir = self._snapshots_dir(project_id)
        matches = sorted(snapshots_dir.glob(f"{snapshot_id}_*"))
        if not matches:
            raise FileNotFoundError(f"Snapshot {snapshot_id} not found for project {project_id}.")
        snapshot_dir = matches[-1]
        metadata_path = snapshot_dir / "metadata.json"

        if metadata_path.exists():
            with metadata_path.open("r", encoding="utf-8") as handle:
                metadata = json.load(handle)
        else:
            metadata = {
                "snapshot_id": snapshot_id,
                "project_id": project_id,
                "label": snapshot_dir.name.split("_", 1)[-1],
                "created_at": timestamp_now(),
                "includes": [],
            }

        project_root = self.settings.project_base_dir / project_id
        project_root.mkdir(parents=True, exist_ok=True)
        project_root_resolved = project_root.resolve()
        snapshot_root = snapshot_dir.resolve()
        includes = restore_include_entries(
            snapshot_dir=snapshot_dir,
            snapshot_dir_resolved=snapshot_root,
            project_root=project_root,
            project_root_resolved=project_root_resolved,
            include_entries=metadata.get("includes"),
        )

        return {
            "snapshot_id": snapshot_id,
            "label": metadata.get("label", "accept"),
            "created_at": metadata.get("created_at"),
            "path": to_posix(snapshot_dir),
            "includes": includes,
        }

    def latest_snapshot(self, project_id: str) -> dict[str, Any] | None:
        snapshots_dir = self._snapshots_dir(project_id)
        candidates = sorted(
            [path for path in snapshots_dir.iterdir() if path.is_dir()],
            key=lambda item: item.name,
        )
        if not candidates:
            return None

        for candidate in reversed(candidates):
            metadata_path = candidate / "metadata.json"
            snapshot_id = candidate.name.split("_", 1)[0]
            if metadata_path.exists():
                with metadata_path.open("r", encoding="utf-8") as handle:
                    metadata = json.load(handle)
            else:
                metadata = {
                    "snapshot_id": snapshot_id,
                    "project_id": project_id,
                    "label": candidate.name.split("_", 1)[-1],
                    "created_at": timestamp_now(),
                    "includes": [],
                }
            metadata["path"] = to_posix(candidate)
            metadata.setdefault("snapshot_id", snapshot_id)
            return metadata
        return None


__all__ = ["SnapshotPersistence", "SNAPSHOT_ID_PATTERN"]
