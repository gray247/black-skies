"""Helpers for validating, copying, and restoring snapshot include entries."""

from __future__ import annotations

import errno
import os
import shutil
from dataclasses import dataclass
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Sequence
from uuid import uuid4

DEFAULT_SNAPSHOT_INCLUDES: tuple[str, ...] = ("drafts", "outline.json", "project.json")

_FSYNC_IGNORE_ERRNOS = {errno.EBADF}
_ENOSYS = getattr(errno, "ENOSYS", None)
if isinstance(_ENOSYS, int):
    _FSYNC_IGNORE_ERRNOS.add(_ENOSYS)


@dataclass(frozen=True)
class SnapshotIncludeSpec:
    """Describe the copy target for a validated include entry."""

    token: str
    source_path: Path
    target_path: Path


def normalise_include_entry(entry: str) -> tuple[Path, str]:
    """Return the normalised Path and a POSIX token for an include entry."""

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

    normalized_parts = windows_parts if "\\" in candidate and windows_parts else posix_parts
    if not normalized_parts:
        raise ValueError(f"Include path {candidate!r} is not valid.")

    relative_path = Path(*normalized_parts)
    return relative_path, "/".join(normalized_parts)


def collect_include_specs(
    *,
    project_root: Path,
    project_root_resolved: Path,
    snapshot_dir: Path,
    snapshot_dir_resolved: Path,
    include_entries: Sequence[str] | None,
) -> list[SnapshotIncludeSpec]:
    """Validate include entries and return copy specifications."""

    includes = list(include_entries or DEFAULT_SNAPSHOT_INCLUDES)
    specs: list[SnapshotIncludeSpec] = []

    for entry in includes:
        include_path, include_token = normalise_include_entry(entry)
        source_path = project_root / include_path
        source_resolved = source_path.resolve()
        if not source_resolved.is_relative_to(project_root_resolved):
            raise ValueError(f"Include path {include_token!r} escapes the project root.")

        target_path = snapshot_dir / include_path
        target_resolved = target_path.resolve()
        if not target_resolved.is_relative_to(snapshot_dir_resolved):
            raise ValueError(f"Snapshot target for {include_token!r} escapes the history folder.")

        specs.append(
            SnapshotIncludeSpec(
                token=include_token,
                source_path=source_path,
                target_path=target_path,
            )
        )

    return specs


def copy_include_entries(include_specs: Sequence[SnapshotIncludeSpec]) -> list[str]:
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


def _restore_directory(source: Path, target: Path) -> None:
    temp_dir = target.parent / f".{target.name}.{uuid4().hex}.restore"
    if temp_dir.exists():
        shutil.rmtree(temp_dir)
    shutil.copytree(source, temp_dir, dirs_exist_ok=True)
    if target.exists():
        shutil.rmtree(target)
    temp_dir.replace(target)


def _restore_file(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    temp_path = target.parent / f".{target.name}.{uuid4().hex}.restore"
    shutil.copy2(source, temp_path)
    if hasattr(os, "fsync"):
        try:
            with temp_path.open("rb") as handle:
                os.fsync(handle.fileno())
        except OSError as exc:  # pragma: no cover - defensive handling
            if exc.errno not in _FSYNC_IGNORE_ERRNOS:
                raise
    temp_path.replace(target)


def restore_include_entries(
    *,
    snapshot_dir: Path,
    snapshot_dir_resolved: Path,
    project_root: Path,
    project_root_resolved: Path,
    include_entries: Sequence[str] | None,
) -> list[str]:
    """Restore include entries from a snapshot directory into the project root."""

    includes = list(include_entries or DEFAULT_SNAPSHOT_INCLUDES)
    restored: list[str] = []

    for entry in includes:
        include_path, include_token = normalise_include_entry(entry)
        source_path = snapshot_dir / include_path
        source_resolved = source_path.resolve()
        if not source_resolved.is_relative_to(snapshot_dir_resolved):
            raise ValueError(f"Snapshot entry {include_token!r} escapes the snapshot directory.")

        target_path = project_root / include_path
        target_resolved = target_path.resolve()
        if not target_resolved.is_relative_to(project_root_resolved):
            raise ValueError(f"Snapshot entry {include_token!r} would escape the project root.")

        if not source_path.exists():
            continue
        if source_path.is_dir():
            _restore_directory(source_path, target_path)
        else:
            _restore_file(source_path, target_path)
        restored.append(include_token)

    return restored


__all__ = [
    "DEFAULT_SNAPSHOT_INCLUDES",
    "SnapshotIncludeSpec",
    "collect_include_specs",
    "copy_include_entries",
    "normalise_include_entry",
    "restore_include_entries",
]
