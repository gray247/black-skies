"""Non-destructive restore helpers for ZIP exports."""

from __future__ import annotations

import json
import logging
import os
import shutil
import tempfile
import time
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from .config import ServiceSettings
from .diagnostics import DiagnosticLogger
from .integrity import validate_project
from .utils.paths import to_posix

logger = logging.getLogger(__name__)


def resolve_project_root(project_id: str, base_dir: Optional[str] = None) -> str:
    """Resolve the project root path for the given identifier."""
    if not base_dir:
        raise ValueError("Project root resolver not configured; supply a base_dir.")
    candidate = os.path.join(base_dir, project_id)
    if not os.path.isdir(candidate):
        raise ValueError(f"Project root missing for id={project_id}")
    return candidate


def find_latest_zip(project_root: str) -> Optional[str]:
    """Return the newest ZIP in `<project_root>/exports`, or None."""
    exports_dir = os.path.join(project_root, "exports")
    if not os.path.isdir(exports_dir):
        return None
    zips: list[tuple[float, str]] = []
    for entry in os.listdir(exports_dir):
        if not entry.lower().endswith(".zip"):
            continue
        path = os.path.join(exports_dir, entry)
        if not os.path.isfile(path):
            continue
        zips.append((os.path.getmtime(path), entry))
    if not zips:
        return None
    return max(zips)[1]


def _read_project_slug(project_root: str) -> str:
    project_json = os.path.join(project_root, "project.json")
    if os.path.isfile(project_json):
        try:
            with open(project_json, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            return data.get("slug") or data.get("title") or os.path.basename(project_root)
        except json.JSONDecodeError:
            logger.warning("project.json invalid, falling back to folder name", exc_info=True)
    return os.path.basename(project_root)


def _ensure_required_files(extracted_dir: str) -> bool:
    project_json = os.path.join(extracted_dir, "project.json")
    outline_json = os.path.join(extracted_dir, "outline.json")
    return os.path.isfile(project_json) and os.path.isfile(outline_json)


def _find_manifest_dir(tmp_root: str) -> Optional[str]:
    for root, dirs, files in os.walk(tmp_root):
        if "project.json" in files and "outline.json" in files:
            return root
    return None


def _create_destination(parent_dir: str, slug: str) -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    base_name = f"{slug}_restored_{timestamp}"
    candidate = os.path.join(parent_dir, base_name)
    suffix = 1
    while os.path.exists(candidate):
        candidate = os.path.join(parent_dir, f"{base_name}_{suffix:02d}")
        suffix += 1
    return candidate


def _restore_operation_payload(
    *,
    source_kind: str,
    archive_path: Path,
    elapsed_ms: int,
    destination_path: Path | None = None,
    failure_phase: str | None = None,
    completion_status: str,
    validation_status: str = "not-run",
    cleanup_status: str = "not-needed",
    degraded_reasons: list[str] | None = None,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "source_kind": source_kind,
        "archive_path": to_posix(archive_path),
        "elapsed_ms": elapsed_ms,
        "completion_status": completion_status,
        "validation_status": validation_status,
        "cleanup_status": cleanup_status,
        "degraded_reasons": degraded_reasons or [],
    }
    if destination_path is not None:
        payload["destination_path"] = to_posix(destination_path)
    if failure_phase is not None:
        payload["failure_phase"] = failure_phase
    return payload


def validate_restored_copy(
    *,
    settings: ServiceSettings,
    diagnostics: DiagnosticLogger,
    restored_path: str,
    operation: Dict[str, Any],
) -> tuple[bool, Dict[str, Any]]:
    restored_root = Path(restored_path)
    integrity = validate_project(settings, project_root=restored_root)
    if integrity.is_ok:
        operation["validation_status"] = "passed"
        operation["completion_status"] = "validated-success"
        return True, operation

    diagnostics.log(
        restored_root,
        code="INTEGRITY_POST_RESTORE",
        message="Restored project failed integrity validation.",
        details={"errors": integrity.errors, "warnings": integrity.warnings},
    )

    cleanup_status = "completed"
    degraded_reasons: list[str] = []
    try:
        shutil.rmtree(restored_root)
    except OSError as cleanup_error:
        cleanup_status = "failed-preserved"
        degraded_reasons.append("cleanup-failed-preserved")
        diagnostics.log(
            restored_root,
            code="RESTORE_CLEANUP_FAILED",
            message="Restored project cleanup failed after validation error.",
            details={"error": str(cleanup_error)},
        )

    operation["validation_status"] = "failed"
    operation["cleanup_status"] = cleanup_status
    operation["failure_phase"] = "validation"
    operation["completion_status"] = (
        "degraded-preserved" if cleanup_status != "completed" else "failed-cleaned"
    )
    operation["degraded_reasons"] = degraded_reasons

    return False, {
        "message": (
            "Restored project failed integrity validation and the copy was preserved for inspection."
            if cleanup_status != "completed"
            else "Restored project failed integrity validation and the invalid copy was removed."
        ),
        "details": {
            "errors": integrity.errors,
            "warnings": integrity.warnings,
            "operation": operation,
        },
    }


def restore_from_zip(project_root: str, zip_filename: str) -> Dict[str, Any]:
    """Extract a ZIP export into a new sibling folder without overwriting."""
    exports_dir = os.path.join(project_root, "exports")
    zip_path = os.path.join(exports_dir, os.path.basename(zip_filename))
    archive_path = Path(zip_path)
    started_at = time.perf_counter()
    if not os.path.isfile(zip_path):
        logger.error("ZIP not found: %s", zip_path)
        return {
            "status": "error",
            "message": "zip not found",
            "operation": _restore_operation_payload(
                source_kind="export-zip",
                archive_path=archive_path,
                elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                failure_phase="archive-open",
                completion_status="failed",
            ),
        }

    temp_dir = tempfile.mkdtemp()
    try:
        with zipfile.ZipFile(zip_path) as archive:
            archive.extractall(temp_dir)
        manifest_dir = _find_manifest_dir(temp_dir)
        if not manifest_dir or not _ensure_required_files(manifest_dir):
            logger.error("Missing manifest files in extracted zip: %s", zip_path)
            return {
                "status": "error",
                "message": "restored missing required file: project.json or outline.json",
                "operation": _restore_operation_payload(
                    source_kind="export-zip",
                    archive_path=archive_path,
                    elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                    failure_phase="extract-validation",
                    completion_status="failed",
                    cleanup_status="completed",
                ),
            }

        slug = _read_project_slug(project_root)
        parent = os.path.dirname(project_root)
        destination = _create_destination(parent, slug)
        shutil.move(manifest_dir, destination)
        destination_path = Path(destination)
        logger.info("Restored ZIP %s -> %s", zip_path, destination)
        return {
            "status": "ok",
            "restored_path": destination,
            "restored_project_slug": os.path.basename(destination),
            "operation": _restore_operation_payload(
                source_kind="export-zip",
                archive_path=archive_path,
                destination_path=destination_path,
                elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                completion_status="materialized",
            ),
        }
    except zipfile.BadZipFile:
        logger.exception("ZIP archive corrupt: %s", zip_path)
        return {
            "status": "error",
            "message": "zip archive is corrupt",
            "operation": _restore_operation_payload(
                source_kind="export-zip",
                archive_path=archive_path,
                elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                failure_phase="archive-open",
                completion_status="failed",
                cleanup_status="completed",
            ),
        }
    except OSError as exc:
        logger.exception("Failed to restore zip: %s", zip_path)
        return {
            "status": "error",
            "message": "could not materialize restored project",
            "details": str(exc),
            "operation": _restore_operation_payload(
                source_kind="export-zip",
                archive_path=archive_path,
                elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                failure_phase="materialize",
                completion_status="failed",
                cleanup_status="completed",
            ),
        }
    finally:
        if os.path.isdir(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
