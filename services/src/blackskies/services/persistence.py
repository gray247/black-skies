"""Persistence helpers for writing service artifacts to disk."""

from __future__ import annotations

import json
import os
import re
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence
from uuid import uuid4

import yaml

from blackskies.services.utils.paths import to_posix

SNAPSHOT_ID_PATTERN = re.compile(r"^\d{8}T\d{6}Z$")


from .config import ServiceSettings
from .models.outline import OutlineArtifact
from .scene_docs import DraftRequestError, read_scene_document


@dataclass
class OutlinePersistence:
    """Persist outline artifacts using atomic file writes."""

    settings: ServiceSettings

    def ensure_project_root(self, project_id: str) -> Path:
        """Ensure the project root exists and return the path."""

        project_root = self.settings.project_base_dir / project_id
        project_root.mkdir(parents=True, exist_ok=True)
        return project_root

    def write_outline(self, project_id: str, outline: OutlineArtifact) -> Path:
        """Validate and atomically write the outline artifact to disk."""

        project_root = self.ensure_project_root(project_id)
        target_path = project_root / "outline.json"

        payload = outline.model_dump(mode="json")
        serialized = json.dumps(payload, indent=2, ensure_ascii=False)

        temp_path = target_path.parent / f".{target_path.name}.{uuid4().hex}.tmp"
        with temp_path.open("w", encoding="utf-8") as handle:
            handle.write(serialized)
            handle.flush()
            os.fsync(handle.fileno())

        temp_path.replace(target_path)
        return target_path


_FIELD_ORDER = [
    "id",
    "slug",
    "title",
    "pov",
    "purpose",
    "goal",
    "conflict",
    "turn",
    "emotion_tag",
    "word_target",
    "order",
    "chapter_id",
    "beats",
]


def _format_yaml_value(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list):
        if not value:
            return "[]"
        joined = ", ".join(_format_yaml_value(item) for item in value)
        return f"[{joined}]"
    if value is None:
        return "null"

    text = str(value)
    if _needs_quotes(text):
        return json.dumps(text)
    return text


def _needs_quotes(value: str) -> bool:
    if value == "":
        return True
    if value != value.strip():
        return True
    if value.lower() in {"null", "true", "false", "yes", "no"}:
        return True
    if value[0] in "-?:!%*@&" or value[-1] in ":":
        return True
    if re.search(r"[#:>{}\[\],]", value):
        return True
    return False


@dataclass
class DraftPersistence:
    """Persist synthesized draft scenes with locked front-matter."""

    settings: ServiceSettings

    def ensure_project_root(self, project_id: str) -> Path:
        project_root = self.settings.project_base_dir / project_id
        project_root.mkdir(parents=True, exist_ok=True)
        return project_root

    def write_scene(
        self, project_id: str, front_matter: dict[str, Any], body: str
    ) -> Path:
        project_root = self.ensure_project_root(project_id)
        drafts_dir = project_root / "drafts"
        drafts_dir.mkdir(parents=True, exist_ok=True)

        scene_id = front_matter["id"]
        target_path = drafts_dir / f"{scene_id}.md"
        rendered = self._render(front_matter, body)

        temp_path = target_path.parent / f".{target_path.name}.{uuid4().hex}.tmp"
        with temp_path.open("w", encoding="utf-8") as handle:
            handle.write(rendered)
            handle.flush()
            os.fsync(handle.fileno())

        temp_path.replace(target_path)
        return target_path

    @staticmethod
    def _render(front_matter: dict[str, Any], body: str) -> str:
        lines = ["---"]
        ordered_keys: list[str] = []
        for key in _FIELD_ORDER:
            if key in front_matter:
                ordered_keys.append(key)

        remaining_keys = sorted(
            key for key in front_matter.keys() if key not in _FIELD_ORDER
        )
        ordered_keys.extend(remaining_keys)

        for key in ordered_keys:
            value = front_matter.get(key)
            if value is None:
                continue
            lines.append(f"{key}: {_format_yaml_value(value)}")
        lines.append("---")

        text_body = body.rstrip()
        if text_body:
            return "\n".join(lines) + "\n" + text_body + "\n"
        return "\n".join(lines) + "\n"


def write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    """Write JSON to disk using an atomic rename."""

    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.parent / f".{path.name}.{uuid4().hex}.tmp"
    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.flush()
        os.fsync(handle.fileno())
    temp_path.replace(path)


def write_text_atomic(path: Path, content: str) -> None:
    """Write UTF-8 text to disk atomically with normalised newlines."""

    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.parent / f".{path.name}.{uuid4().hex}.tmp"
    # Normalise to LF endings and ensure final newline for editors/tools.
    normalized = content.replace("\r\n", "\n")
    if not normalized.endswith("\n"):
        normalized = f"{normalized}\n"
    with temp_path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(normalized)
        handle.flush()
        os.fsync(handle.fileno())
    temp_path.replace(path)


@dataclass
class SnapshotPersistence:
    """Create and restore project snapshots for crash recovery."""

    settings: ServiceSettings

    def _snapshots_dir(self, project_id: str) -> Path:
        project_root = self.settings.project_base_dir / project_id
        snapshots_dir = project_root / "history" / "snapshots"
        snapshots_dir.mkdir(parents=True, exist_ok=True)
        return snapshots_dir

    def _snapshot_id(self) -> str:
        return datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    def _sanitize_label(self, label: str | None) -> str:
        if not label:
            return "accept"
        sanitized = re.sub(r"[^a-zA-Z0-9_-]+", "-", label.strip())
        return sanitized or "accept"

    def create_snapshot(
        self,
        project_id: str,
        *,
        label: str | None = None,
        include_entries: Sequence[str] | None = None,
    ) -> dict[str, Any]:
        snapshots_dir = self._snapshots_dir(project_id)
        snapshot_id = self._snapshot_id()
        label_token = self._sanitize_label(label)
        directory = snapshots_dir / f"{snapshot_id}_{label_token}"
        directory.mkdir(parents=True, exist_ok=False)

        project_root = self.settings.project_base_dir / project_id
        includes = list(include_entries or ["drafts", "outline.json", "project.json"])
        recorded: list[str] = []

        for entry in includes:
            source = project_root / entry
            if not source.exists():
                continue
            target = directory / entry
            if source.is_dir():
                shutil.copytree(source, target, dirs_exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)
            recorded.append(entry)

        created_at = datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")
        metadata = {
            "snapshot_id": snapshot_id,
            "project_id": project_id,
            "label": label_token,
            "created_at": created_at,
            "includes": recorded,
        }
        write_json_atomic(directory / "metadata.json", metadata)
        self._write_snapshot_manifest(
            directory,
            project_id=project_id,
            snapshot_id=snapshot_id,
            label=label_token,
            created_at=created_at,
            includes=recorded,
        )
        return {
            "snapshot_id": snapshot_id,
            "label": label_token,
            "created_at": created_at,
            "path": to_posix(directory),
            "includes": recorded,
        }

    def _write_snapshot_manifest(
        self,
        directory: Path,
        *,
        project_id: str,
        snapshot_id: str,
        label: str,
        created_at: str,
        includes: Sequence[str],
    ) -> None:
        manifest: dict[str, Any] = {
            "schema_version": "SnapshotManifest v1",
            "snapshot_id": snapshot_id,
            "project_id": project_id,
            "label": label,
            "created_at": created_at,
            "includes": list(includes),
        }

        project_root = self.settings.project_base_dir / project_id
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
        scenes = []
        if isinstance(outline_payload, dict):
            scenes = outline_payload.get("scenes", []) or []
        for scene in scenes:
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

        manifest_yaml = yaml.safe_dump(
            manifest, sort_keys=False, allow_unicode=True, indent=2
        )
        write_text_atomic(directory / "snapshot.yaml", manifest_yaml)

    def _restore_directory(self, source: Path, target: Path) -> None:
        temp_dir = target.parent / f".{target.name}.{uuid4().hex}.restore"
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
        shutil.copytree(source, temp_dir, dirs_exist_ok=True)
        if target.exists():
            shutil.rmtree(target)
        temp_dir.replace(target)

    def _restore_file(self, source: Path, target: Path) -> None:
        target.parent.mkdir(parents=True, exist_ok=True)
        temp_path = target.parent / f".{target.name}.{uuid4().hex}.restore"
        shutil.copy2(source, temp_path)
        if hasattr(os, "fsync"):
            with temp_path.open("rb") as handle:
                os.fsync(handle.fileno())
        temp_path.replace(target)

    def restore_snapshot(self, project_id: str, snapshot_id: str) -> dict[str, Any]:
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
                "created_at": datetime.now(tz=timezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
                "includes": [],
            }

        project_root = self.settings.project_base_dir / project_id
        includes = metadata.get("includes") or ["drafts", "outline.json", "project.json"]
        for entry in includes:
            source = snapshot_dir / entry
            target = project_root / entry
            if not source.exists():
                continue
            if source.is_dir():
                self._restore_directory(source, target)
            else:
                self._restore_file(source, target)

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
                    "created_at": datetime.now(tz=timezone.utc)
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "includes": [],
                }
            metadata["path"] = to_posix(candidate)
            metadata.setdefault("snapshot_id", snapshot_id)
            return metadata
        return None


def dump_diagnostic(path: Path, payload: dict[str, Any]) -> None:
    """Write a JSON diagnostic payload to disk."""

    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.flush()
        os.fsync(handle.fileno())


__all__ = [
    "DraftPersistence",
    "OutlinePersistence",
    "SnapshotPersistence",
    "dump_diagnostic",
    "write_json_atomic",
    "write_text_atomic",
    "SNAPSHOT_ID_PATTERN",
]








