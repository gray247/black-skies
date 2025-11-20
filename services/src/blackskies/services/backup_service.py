"""Helpers for long-term project backups."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from .config import ServiceSettings
from .diagnostics import DiagnosticLogger
from .restore_service import _create_destination
from .utils.paths import to_posix

BACKUP_FILENAME_TEMPLATE = "BS_{timestamp}.zip"
BACKUP_CHECKSUMS = "checksums.json"
BACKUP_LOG_MESSAGE = "Failed to write backup bundle."


def _timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


def _hashfile(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            digest.update(chunk)
    return digest.hexdigest()


class BackupService:
    """Service helpers for building and restoring backup bundles."""

    def __init__(self, *, settings: ServiceSettings, diagnostics: DiagnosticLogger) -> None:
        self._settings = settings
        self._diagnostics = diagnostics

    def create_backup(self, *, project_id: str) -> dict[str, str]:
        project_root = self._settings.project_base_dir / project_id
        if not project_root.exists():
            raise FileNotFoundError(project_root)

        backup_root = self._settings.backups_dir
        backup_root.mkdir(parents=True, exist_ok=True)

        timestamp = _timestamp()
        filename = BACKUP_FILENAME_TEMPLATE.format(timestamp=timestamp)
        temp_path = backup_root / f".{filename}.tmp"
        target_path = backup_root / filename

        if temp_path.exists():
            shutil.rmtree(temp_path, ignore_errors=True)

        files_list: list[dict[str, str]] = []

        try:
            with zipfile.ZipFile(temp_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
                for relative_path in self._collect_project_files(project_root):
                    absolute_path = project_root / relative_path
                    archive.write(absolute_path, arcname=relative_path.as_posix())
                    files_list.append(
                        {"path": relative_path.as_posix(), "checksum": _hashfile(absolute_path)}
                    )

                checksums_payload = {
                    "schema_version": "BackupChecksums v1",
                    "project_id": project_id,
                    "created_at": datetime.now(timezone.utc)
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "files": files_list,
                }
                archive.writestr(BACKUP_CHECKSUMS, json.dumps(checksums_payload, indent=2))

            if target_path.exists():
                target_path.unlink()
            temp_path.replace(target_path)

            payload = {
                "project_id": project_id,
                "filename": filename,
                "path": to_posix(target_path.relative_to(self._settings.project_base_dir)),
                "created_at": checksums_payload["created_at"],
                "checksum": _hashfile(target_path),
            }
            return payload
        except OSError as exc:
            self._diagnostics.log(
                project_root,
                code="BACKUP_WRITE_FAILED",
                message=BACKUP_LOG_MESSAGE,
                details={"project_id": project_id, "error": str(exc)},
            )
            if temp_path.exists():
                temp_path.unlink()
            raise

    def list_backups(self, *, project_id: str) -> list[dict[str, str]]:
        backup_root = self._settings.backups_dir
        if not backup_root.exists():
            return []

        entries: list[dict[str, str]] = []
        for archive_path in sorted(backup_root.glob("BS_*.zip"), reverse=True):
            try:
                with zipfile.ZipFile(archive_path) as archive:
                    if BACKUP_CHECKSUMS not in archive.namelist():
                        continue
                    payload = json.loads(archive.read(BACKUP_CHECKSUMS).decode("utf-8"))
            except (OSError, zipfile.BadZipFile, json.JSONDecodeError):
                continue
            if payload.get("project_id") != project_id:
                continue
            created_at = payload.get("created_at")
            if not isinstance(created_at, str):
                created_at = datetime.fromtimestamp(
                    archive_path.stat().st_mtime, timezone.utc
                ).isoformat().replace("+00:00", "Z")
            entries.append(
                {
                    "project_id": payload.get("project_id") or project_id,
                    "filename": archive_path.name,
                    "path": to_posix(
                        archive_path.relative_to(self._settings.project_base_dir)
                    ),
                    "created_at": created_at,
                    "checksum": _hashfile(archive_path),
                }
            )
        return entries

    def restore_backup(self, *, backup_name: str) -> dict[str, str]:
        backup_root = self._settings.backups_dir
        backup_path = backup_root / backup_name
        if not backup_path.exists():
            raise FileNotFoundError(backup_path)

        temp_dir = Path(tempfile.mkdtemp())
        try:
            with zipfile.ZipFile(backup_path) as archive:
                archive.extractall(temp_dir)

            manifest_dir = _find_manifest_dir(temp_dir)
            if not manifest_dir:
                raise FileNotFoundError("Project manifest missing in backup")

            if not _ensure_required_files(manifest_dir):
                raise FileNotFoundError("Restored backup missing required files")

            project_json = manifest_dir / "project.json"
            if not project_json.exists():
                raise FileNotFoundError("project.json missing in backup")

            with project_json.open("r", encoding="utf-8") as handle:
                project_data = json.load(handle)
            slug = project_data.get("project_id") or project_data.get("slug") or "restored"

            parent = self._settings.project_base_dir
            destination = _create_destination(str(parent), slug)
            shutil.move(str(manifest_dir), destination)

            return {
                "status": "ok",
                "restored_path": to_posix(Path(destination)),
                "restored_project_slug": os.path.basename(destination),
            }
        except zipfile.BadZipFile as exc:
            raise ValueError("Backup bundle is not a valid ZIP archive") from exc
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    @staticmethod
    def _collect_project_files(project_root: Path) -> list[Path]:
        files: list[Path] = []
        for path in sorted(project_root.rglob("*")):
            if not path.is_file():
                continue
            relative = path.relative_to(project_root)
            if relative.parts and relative.parts[0] == "backups":
                continue
            files.append(relative)
        return files


def _ensure_required_files(directory: Path) -> bool:
    return (directory / "project.json").is_file() and (directory / "outline.json").is_file()


def _find_manifest_dir(root: Path) -> Path | None:
    for candidate in root.iterdir():
        if not candidate.is_dir():
            continue
        if (candidate / "project.json").exists() and (candidate / "outline.json").exists():
            return candidate
    if (root / "project.json").exists() and (root / "outline.json").exists():
        return root
    return None
