"""Helpers for long-term project backups."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import tempfile
import time
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import ServiceSettings
from .diagnostics import DiagnosticLogger
from .restore_service import (
    _create_destination,
    _restore_operation_payload,
    evaluate_restore_as_copy_eligibility,
)
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


def _validate_backup_checksums(
    *, manifest_dir: Path, checksum_payload: dict[str, Any]
) -> bool:
    files = checksum_payload.get("files")
    if not isinstance(files, list):
        return False

    for entry in files:
        if not isinstance(entry, dict):
            return False
        relative_path = entry.get("path")
        checksum = entry.get("checksum")
        if not isinstance(relative_path, str) or not relative_path:
            return False
        if not isinstance(checksum, str) or not checksum:
            return False
        file_path = manifest_dir / relative_path
        if not file_path.is_file():
            return False
        if _hashfile(file_path) != checksum:
            return False

    return True


class BackupService:
    """Service helpers for building and restoring backup bundles."""

    def __init__(self, *, settings: ServiceSettings, diagnostics: DiagnosticLogger) -> None:
        self._settings = settings
        self._diagnostics = diagnostics

    def create_backup(self, *, project_id: str) -> dict[str, Any]:
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
        started_at = time.perf_counter()

        try:
            with zipfile.ZipFile(temp_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
                for relative_path in self._collect_project_files(project_root):
                    absolute_path = project_root / relative_path
                    archive.write(absolute_path, arcname=relative_path.as_posix())
                    files_list.append(
                        {"path": relative_path.as_posix(), "checksum": _hashfile(absolute_path)}
                    )

                created_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
                checksums_payload = {
                    "schema_version": "BackupChecksums v1",
                    "project_id": project_id,
                    "created_at": created_at,
                    "files": files_list,
                }
                archive.writestr(BACKUP_CHECKSUMS, json.dumps(checksums_payload, indent=2))

            if target_path.exists():
                target_path.unlink()
            temp_path.replace(target_path)

            payload: dict[str, Any] = {
                "project_id": project_id,
                "filename": filename,
                "path": to_posix(target_path.relative_to(self._settings.project_base_dir)),
                "created_at": created_at,
                "checksum": _hashfile(target_path),
            }
            payload["operation"] = {
                "archive_path": to_posix(target_path),
                "elapsed_ms": round((time.perf_counter() - started_at) * 1000),
                "archive_size_bytes": target_path.stat().st_size,
                "file_count": len(files_list),
                "completion_status": "completed",
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
                created_at = (
                    datetime.fromtimestamp(archive_path.stat().st_mtime, timezone.utc)
                    .isoformat()
                    .replace("+00:00", "Z")
                )
            entries.append(
                {
                    "project_id": payload.get("project_id") or project_id,
                    "filename": archive_path.name,
                    "path": to_posix(archive_path.relative_to(self._settings.project_base_dir)),
                    "created_at": created_at,
                    "checksum": _hashfile(archive_path),
                }
            )
        return entries

    def latest_backup_name(self, *, project_id: str) -> str | None:
        entries = self.list_backups(project_id=project_id)
        if not entries:
            return None
        latest_name = entries[0].get("filename")
        return latest_name if isinstance(latest_name, str) and latest_name else None

    def restore_backup(
        self,
        *,
        project_id: str,
        backup_name: str,
        restore_as_new: bool | None = True,
        selection_mode: str | None = "named",
    ) -> dict[str, Any]:
        backup_root = self._settings.backups_dir
        backup_path = backup_root / backup_name
        destination_parent = self._settings.project_base_dir
        current_project_root = self._settings.project_base_dir / project_id
        destination_preview = _create_destination(str(destination_parent), project_id)

        if not backup_path.exists():
            eligibility = evaluate_restore_as_copy_eligibility(
                source_kind="backup-bundle",
                source_family="backup-bundle",
                selection_mode=selection_mode,
                source_name=backup_name,
                restore_as_new=restore_as_new,
                current_project_root=str(current_project_root),
                destination_path=destination_preview,
                source_exists=False,
                source_readable=False,
                source_project_id=None,
                expected_project_id=project_id,
                manifest_present=False,
                manifest_valid=False,
                checksum_state="unavailable",
                checksum_required=True,
                destination_exists=os.path.exists(destination_preview),
                destination_parent_exists=destination_parent.exists(),
                source_scope="project-backups",
            )
            return {
                "status": "error",
                "message": "backup bundle not found",
                "eligibility_decision": eligibility,
                "operation": _restore_operation_payload(
                    source_kind="backup-bundle",
                    archive_path=backup_path,
                    destination_path=Path(destination_preview),
                    elapsed_ms=0,
                    failure_phase="archive-open",
                    completion_status="blocked" if not eligibility["eligible"] else "failed",
                    cleanup_status="completed",
                ),
            }

        temp_dir = Path(tempfile.mkdtemp())
        started_at = time.perf_counter()
        try:
            source_readable = False
            source_project_id: str | None = None
            checksum_state = "unavailable"
            manifest_present = False
            manifest_valid = False
            project_data: dict[str, Any] | None = None

            with zipfile.ZipFile(backup_path) as archive:
                source_readable = True
                if BACKUP_CHECKSUMS not in archive.namelist():
                    checksum_state = "unavailable"
                    eligibility = evaluate_restore_as_copy_eligibility(
                        source_kind="backup-bundle",
                        source_family="backup-bundle",
                        selection_mode=selection_mode,
                        source_name=backup_name,
                        restore_as_new=restore_as_new,
                        current_project_root=str(current_project_root),
                        destination_path=destination_preview,
                        source_exists=True,
                        source_readable=source_readable,
                        source_project_id=None,
                        expected_project_id=project_id,
                        manifest_present=False,
                        manifest_valid=False,
                        checksum_state=checksum_state,
                        checksum_required=True,
                        destination_exists=os.path.exists(destination_preview),
                        destination_parent_exists=destination_parent.exists(),
                        source_scope="project-backups",
                    )
                    return {
                        "status": "error",
                        "message": "Backup bundle is missing checksums.json",
                        "eligibility_decision": eligibility,
                        "operation": _restore_operation_payload(
                            source_kind="backup-bundle",
                            archive_path=backup_path,
                            destination_path=Path(destination_preview),
                            elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                            failure_phase="archive-open",
                            completion_status="blocked" if not eligibility["eligible"] else "failed",
                            cleanup_status="completed",
                        ),
                    }
                else:
                    archive.extractall(temp_dir)
                    try:
                        checksum_payload = json.loads(archive.read(BACKUP_CHECKSUMS).decode("utf-8"))
                    except json.JSONDecodeError:
                        checksum_state = "unavailable"
                        eligibility = evaluate_restore_as_copy_eligibility(
                            source_kind="backup-bundle",
                            source_family="backup-bundle",
                            selection_mode=selection_mode,
                            source_name=backup_name,
                            restore_as_new=restore_as_new,
                            current_project_root=str(current_project_root),
                            destination_path=destination_preview,
                            source_exists=True,
                            source_readable=source_readable,
                            source_project_id=None,
                            expected_project_id=project_id,
                            manifest_present=False,
                            manifest_valid=False,
                            checksum_state=checksum_state,
                            checksum_required=True,
                            destination_exists=os.path.exists(destination_preview),
                            destination_parent_exists=destination_parent.exists(),
                            source_scope="project-backups",
                        )
                        return {
                            "status": "error",
                            "message": "Backup bundle checksums.json is invalid",
                            "eligibility_decision": eligibility,
                            "operation": _restore_operation_payload(
                                source_kind="backup-bundle",
                                archive_path=backup_path,
                                destination_path=Path(destination_preview),
                                elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                                failure_phase="archive-open",
                                completion_status="blocked" if not eligibility["eligible"] else "failed",
                                cleanup_status="completed",
                            ),
                        }
                    if not isinstance(checksum_payload, dict):
                        checksum_state = "mismatch"
                    else:
                        checksum_state = "available"
                        checksum_project_id = checksum_payload.get("project_id")
                        if isinstance(checksum_project_id, str) and checksum_project_id.strip():
                            source_project_id = checksum_project_id
                        manifest_dir = _find_manifest_dir(temp_dir)
                        manifest_present = manifest_dir is not None
                        if manifest_dir is not None and _ensure_required_files(manifest_dir):
                            project_json = manifest_dir / "project.json"
                            try:
                                with project_json.open("r", encoding="utf-8") as handle:
                                    parsed_project = json.load(handle)
                            except json.JSONDecodeError:
                                manifest_valid = False
                            else:
                                if isinstance(parsed_project, dict):
                                    project_data = parsed_project
                                    manifest_valid = True
                                    if source_project_id is None:
                                        project_id_value = (
                                            project_data.get("project_id") or project_data.get("slug")
                                        )
                                        if isinstance(project_id_value, str) and project_id_value.strip():
                                            source_project_id = project_id_value
                                    checksum_state = (
                                        "available"
                                        if _validate_backup_checksums(
                                            manifest_dir=manifest_dir,
                                            checksum_payload=checksum_payload,
                                        )
                                        else "mismatch"
                                    )
                                else:
                                    manifest_valid = False
                        else:
                            manifest_valid = False

            if source_project_id is None:
                manifest_dir = _find_manifest_dir(temp_dir)
                if manifest_dir is not None:
                    if project_data is None:
                        project_json = manifest_dir / "project.json"
                        if project_json.exists():
                            try:
                                with project_json.open("r", encoding="utf-8") as handle:
                                    parsed_project = json.load(handle)
                            except json.JSONDecodeError:
                                parsed_project = None
                            if isinstance(parsed_project, dict):
                                project_data = parsed_project
                    if project_data is not None:
                        project_id_value = project_data.get("project_id") or project_data.get("slug")
                        if isinstance(project_id_value, str) and project_id_value.strip():
                            source_project_id = project_id_value

            parent = self._settings.project_base_dir
            destination = _create_destination(str(parent), project_id)
            eligibility = evaluate_restore_as_copy_eligibility(
                source_kind="backup-bundle",
                source_family="backup-bundle",
                selection_mode=selection_mode,
                source_name=backup_name,
                restore_as_new=restore_as_new,
                current_project_root=str(current_project_root),
                destination_path=destination,
                source_exists=True,
                source_readable=source_readable,
                source_project_id=source_project_id,
                expected_project_id=project_id,
                manifest_present=manifest_present,
                manifest_valid=manifest_valid,
                checksum_state=checksum_state,
                checksum_required=True,
                destination_exists=os.path.exists(destination),
                destination_parent_exists=destination_parent.exists(),
                source_scope="project-backups",
            )
            if not eligibility["eligible"]:
                return {
                    "status": "error",
                    "message": "restore-as-copy eligibility blocked",
                    "eligibility_decision": eligibility,
                    "operation": _restore_operation_payload(
                        source_kind="backup-bundle",
                        archive_path=backup_path,
                        destination_path=Path(destination),
                        elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                        failure_phase="eligibility",
                        completion_status="blocked",
                        cleanup_status="completed",
                        degraded_reasons=list(eligibility["blocked_reasons"]),
                    ),
                }

            manifest_dir = _find_manifest_dir(temp_dir)
            if not manifest_dir:
                raise FileNotFoundError("Project manifest missing in backup")

            if not _ensure_required_files(manifest_dir):
                raise FileNotFoundError("Restored backup missing required files")

            if project_data is None:
                project_json = manifest_dir / "project.json"
                if not project_json.exists():
                    raise FileNotFoundError("project.json missing in backup")
                with project_json.open("r", encoding="utf-8") as handle:
                    parsed_project = json.load(handle)
                if not isinstance(parsed_project, dict):
                    raise FileNotFoundError("project.json payload is invalid in backup")
                project_data = parsed_project
            slug_value = project_data.get("project_id") or project_data.get("slug")
            slug = slug_value if isinstance(slug_value, str) and slug_value.strip() else "restored"

            destination = _create_destination(str(parent), slug)
            shutil.move(str(manifest_dir), destination)
            destination_path = Path(destination)

            return {
                "status": "ok",
                "restored_path": to_posix(Path(destination)),
                "restored_project_slug": os.path.basename(destination),
                "eligibility_decision": eligibility,
                "operation": _restore_operation_payload(
                    source_kind="backup-bundle",
                    archive_path=backup_path,
                    destination_path=destination_path,
                    elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                    completion_status="materialized",
                ),
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
