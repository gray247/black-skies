"""Persistence helpers for writing service artifacts to disk."""

from __future__ import annotations

import errno
import json
import os
import re
import shutil
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath, PureWindowsPath
from threading import Lock
from typing import IO, Any, Sequence
from uuid import uuid4

from blackskies.services.utils import safe_dump, to_posix

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
            _flush_handle(handle, durable=True)

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


def _flush_handle(handle: IO[Any], *, durable: bool) -> None:
    """Flush file buffers and conditionally fsync for durability."""

    handle.flush()
    if durable:
        os.fsync(handle.fileno())


def _normalise_include_entry(entry: str) -> tuple[Path, str]:
    """Return a safe relative path and its POSIX string representation."""

    if not isinstance(entry, str):
        raise ValueError("Include entries must be strings.")
    candidate = entry.strip()
    if not candidate:
        raise ValueError("Include entries may not be empty.")

    posix_path = PurePosixPath(candidate)
    windows_path = PureWindowsPath(candidate)
    for variant in (posix_path, windows_path):
        if variant.is_absolute() or variant.anchor:
            raise ValueError(f"Include path {candidate!r} must be relative to the project.")
        if any(part in ("..", "") for part in variant.parts):
            raise ValueError(
                f"Include path {candidate!r} may not contain parent directory traversal."
            )

    posix_parts = [part for part in posix_path.parts if part not in (".", "")]
    windows_parts = [part for part in windows_path.parts if part not in (".", "")]
    if "\\" in candidate and windows_parts:
        normalized_parts = windows_parts
    else:
        normalized_parts = posix_parts

    if not normalized_parts:
        raise ValueError(f"Include path {candidate!r} is not valid.")

    relative_path = Path(*normalized_parts)
    return relative_path, "/".join(normalized_parts)


@dataclass
class DraftPersistence:
    """Persist synthesized draft scenes with locked front-matter."""

    settings: ServiceSettings
    durable_writes: bool = True

    def ensure_project_root(self, project_id: str) -> Path:
        project_root = self.settings.project_base_dir / project_id
        project_root.mkdir(parents=True, exist_ok=True)
        return project_root

    def write_scene(
        self,
        project_id: str,
        front_matter: dict[str, Any],
        body: str,
        *,
        durable: bool | None = None,
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
            effective_durability = self.durable_writes if durable is None else durable
            _flush_handle(handle, durable=effective_durability)

        temp_path.replace(target_path)
        return target_path

    @staticmethod
    def _render(front_matter: dict[str, Any], body: str) -> str:
        lines = ["---"]
        ordered_keys: list[str] = []
        for key in _FIELD_ORDER:
            if key in front_matter:
                ordered_keys.append(key)

        remaining_keys = sorted(key for key in front_matter.keys() if key not in _FIELD_ORDER)
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


def write_json_atomic(path: Path, payload: dict[str, Any], *, durable: bool = True) -> None:
    """Write JSON to disk using an atomic rename."""

    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.parent / f".{path.name}.{uuid4().hex}.tmp"
    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        _flush_handle(handle, durable=durable)
    temp_path.replace(path)


def write_text_atomic(path: Path, content: str, *, durable: bool = True) -> None:
    """Write UTF-8 text to disk atomically with normalised newlines."""

    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.parent / f".{path.name}.{uuid4().hex}.tmp"
    # Normalise to LF endings and ensure final newline for editors/tools.
    normalized = content.replace("\r\n", "\n")
    if not normalized.endswith("\n"):
        normalized = f"{normalized}\n"
    with temp_path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(normalized)
        _flush_handle(handle, durable=durable)
    temp_path.replace(path)


@dataclass(frozen=True)
class SnapshotIncludeSpec:
    """Describe a single include entry during snapshot creation."""

    token: str
    source_path: Path
    target_path: Path


@dataclass(frozen=True)
class SnapshotMetadata:
    """Structured metadata describing a persisted snapshot."""

    snapshot_id: str
    project_id: str
    label: str
    created_at: str
    includes: tuple[str, ...]

    def as_dict(self) -> dict[str, Any]:
        """Render the metadata as a JSON-serialisable mapping."""

        return {
            "snapshot_id": self.snapshot_id,
            "project_id": self.project_id,
            "label": self.label,
            "created_at": self.created_at,
            "includes": list(self.includes),
        }


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
        """Allocate a unique snapshot directory within the history folder.

        Returns a tuple containing the allocated directory, its resolved path,
        and the generated snapshot identifier.
        """

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

        from .snapshots import SnapshotPersistenceError

        details = {
            "project_id": project_id,
            "label": label_token,
            "attempts": max_attempts,
        }
        raise SnapshotPersistenceError(
            "Failed to allocate a snapshot directory.",
            details=details,
        ) from last_error

    def _collect_includes(
        self,
        *,
        project_root: Path,
        project_root_resolved: Path,
        snapshot_dir: Path,
        snapshot_dir_resolved: Path,
        include_entries: Sequence[str] | None,
    ) -> list[SnapshotIncludeSpec]:
        """Validate include entries and return copy specifications."""

        includes = list(include_entries or ["drafts", "outline.json", "project.json"])
        specs: list[SnapshotIncludeSpec] = []

        for entry in includes:
            include_path, include_token = _normalise_include_entry(entry)
            source_path = project_root / include_path
            source_resolved = source_path.resolve()
            if not source_resolved.is_relative_to(project_root_resolved):
                raise ValueError(f"Include path {include_token!r} escapes the project root.")
            target_path = snapshot_dir / include_path
            target_resolved = target_path.resolve()
            if not target_resolved.is_relative_to(snapshot_dir_resolved):
                raise ValueError(
                    f"Snapshot target for {include_token!r} escapes the history folder."
                )
            specs.append(
                SnapshotIncludeSpec(
                    token=include_token,
                    source_path=source_path,
                    target_path=target_path,
                )
            )

        return specs

    def _copy_include_entries(self, include_specs: Sequence[SnapshotIncludeSpec]) -> list[str]:
        """Copy validated include entries into the snapshot directory."""

        recorded: list[str] = []
        for spec in include_specs:
            if not spec.source_path.exists():
                continue
            if spec.source_path.is_dir():
                shutil.copytree(spec.source_path, spec.target_path, dirs_exist_ok=True)
            else:
                spec.target_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(spec.source_path, spec.target_path)
            recorded.append(spec.token)
        return recorded

    def _build_metadata(
        self,
        *,
        snapshot_id: str,
        project_id: str,
        label: str,
        includes: Sequence[str],
    ) -> SnapshotMetadata:
        """Assemble structured metadata for a newly created snapshot."""

        created_at = datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")
        return SnapshotMetadata(
            snapshot_id=snapshot_id,
            project_id=project_id,
            label=label,
            created_at=created_at,
            includes=tuple(includes),
        )

    def create_snapshot(
        self,
        project_id: str,
        *,
        label: str | None = None,
        include_entries: Sequence[str] | None = None,
    ) -> dict[str, Any]:
        label_token = self._sanitize_label(label)
        directory, directory_resolved, snapshot_id = self._allocate_directory(
            project_id, label_token
        )

        project_root = self.settings.project_base_dir / project_id
        project_root.mkdir(parents=True, exist_ok=True)
        project_root_resolved = project_root.resolve()

        try:
            include_specs = self._collect_includes(
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

        recorded = self._copy_include_entries(include_specs)
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

    def _write_snapshot_manifest(
        self,
        directory: Path,
        *,
        metadata: SnapshotMetadata,
    ) -> None:
        """Render a YAML manifest describing the snapshot contents."""

        manifest: dict[str, Any] = {
            "schema_version": "SnapshotManifest v1",
            "snapshot_id": metadata.snapshot_id,
            "project_id": metadata.project_id,
            "label": metadata.label,
            "created_at": metadata.created_at,
            "includes": list(metadata.includes),
        }

        project_root = self.settings.project_base_dir / metadata.project_id
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

        manifest_yaml = safe_dump(manifest, sort_keys=False, allow_unicode=True, indent=2)
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
            try:
                with temp_path.open("rb") as handle:
                    os.fsync(handle.fileno())
            except OSError as exc:
                if exc.errno not in _FSYNC_IGNORE_ERRNOS:
                    raise
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
                "created_at": datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z"),
                "includes": [],
            }

        project_root = self.settings.project_base_dir / project_id
        project_root.mkdir(parents=True, exist_ok=True)
        project_root_resolved = project_root.resolve()
        snapshot_root = snapshot_dir.resolve()
        includes_raw = metadata.get("includes") or ["drafts", "outline.json", "project.json"]
        includes: list[str] = []
        for entry in includes_raw:
            include_path, include_token = _normalise_include_entry(entry)
            source_path = snapshot_dir / include_path
            source = source_path.resolve()
            if not source.is_relative_to(snapshot_root):
                raise ValueError(
                    f"Snapshot entry {include_token!r} escapes the snapshot directory."
                )
            target_path = project_root / include_path
            target = target_path.resolve()
            if not target.is_relative_to(project_root_resolved):
                raise ValueError(f"Snapshot entry {include_token!r} would escape the project root.")
            if not source_path.exists():
                continue
            if source_path.is_dir():
                self._restore_directory(source_path, target_path)
            else:
                self._restore_file(source_path, target_path)
            includes.append(include_token)

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
                    "created_at": datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z"),
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
        _flush_handle(handle, durable=True)


__all__ = [
    "DraftPersistence",
    "OutlinePersistence",
    "SnapshotPersistence",
    "dump_diagnostic",
    "write_json_atomic",
    "write_text_atomic",
    "SNAPSHOT_ID_PATTERN",
]
_FSYNC_IGNORE_ERRNOS = {errno.EBADF}
_ENOSYS = getattr(errno, "ENOSYS", None)
if isinstance(_ENOSYS, int):
    _FSYNC_IGNORE_ERRNOS.add(_ENOSYS)

SNAPSHOT_ID_PATTERN = re.compile(r"^\d{8}T\d{6}(?:\d{6})?Z(?:-[0-9a-f]{8})?$")
