"""Utilities for snapshot manifest metadata and rendering."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence

from .scene_docs import DraftRequestError, read_scene_document


@dataclass(frozen=True)
class SnapshotMetadata:
    """Structured metadata describing a persisted snapshot."""

    snapshot_id: str
    project_id: str
    label: str
    created_at: str
    includes: Sequence[str]

    def as_dict(self) -> dict[str, Any]:
        """Render the metadata as a JSON-serialisable mapping."""

        return {
            "snapshot_id": self.snapshot_id,
            "project_id": self.project_id,
            "label": self.label,
            "created_at": self.created_at,
            "includes": list(self.includes),
        }


def build_snapshot_manifest(
    directory: Path,
    *,
    metadata: SnapshotMetadata,
    project_root: Path,
) -> dict[str, Any]:
    """Assemble a manifest dictionary describing the snapshot contents."""

    manifest: dict[str, Any] = {
        "schema_version": "SnapshotManifest v1",
        "snapshot_id": metadata.snapshot_id,
        "project_id": metadata.project_id,
        "label": metadata.label,
        "created_at": metadata.created_at,
        "includes": list(metadata.includes),
    }

    project_path = project_root / "project.json"
    if project_path.exists():
        try:
            with project_path.open("r", encoding="utf-8") as handle:
                manifest["project"] = json.load(handle)
        except json.JSONDecodeError:
            manifest.setdefault("warnings", []).append(
                {"project": "project.json is not valid JSON."}
            )

    outline_path = directory / "outline.json"
    outline_payload: dict[str, Any] | None = None
    if outline_path.exists():
        try:
            with outline_path.open("r", encoding="utf-8") as handle:
                outline_payload = json.load(handle)
        except json.JSONDecodeError:
            manifest.setdefault("warnings", []).append(
                {"outline": "outline.json is not valid JSON."}
            )
    if outline_payload is not None:
        manifest["outline"] = outline_payload

    drafts: list[dict[str, Any]] = []
    missing: list[str] = []
    scenes: Sequence[dict[str, Any]] | Sequence[Any] | None = []
    if isinstance(outline_payload, dict):
        scenes = outline_payload.get("scenes", []) or []
    for scene in scenes or []:
        scene_id = scene.get("id") if isinstance(scene, dict) else None
        if not isinstance(scene_id, str):
            continue
        try:
            _, front_matter, _ = read_scene_document(directory, scene_id)
        except DraftRequestError:
            missing.append(scene_id)
            continue
        entry = dict(front_matter)
        entry["path"] = f"drafts/{scene_id}.md"
        drafts.append(entry)
    manifest["drafts"] = drafts
    if missing:
        manifest["missing_drafts"] = missing

    if not drafts:
        drafts_dir = directory / "drafts"
        if drafts_dir.exists():
            for path in sorted(drafts_dir.glob("*.md")):
                unit_id = path.stem
                try:
                    _, front_matter, _ = read_scene_document(directory, unit_id)
                except DraftRequestError:
                    continue
                entry = dict(front_matter)
                entry["path"] = f"drafts/{path.name}"
                drafts.append(entry)
            manifest["drafts"] = drafts

    return manifest


def timestamp_now() -> str:
    """Return an ISO8601 timestamp in UTC with a trailing 'Z'."""

    return datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")


__all__ = [
    "SnapshotMetadata",
    "build_snapshot_manifest",
    "timestamp_now",
]

