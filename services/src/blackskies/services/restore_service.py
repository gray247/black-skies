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


def _dedupe_reasons(reasons: list[str]) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()
    for reason in reasons:
        if reason in seen:
            continue
        seen.add(reason)
        ordered.append(reason)
    return ordered


def _destination_overlaps_current_root(
    *, current_project_root: str, destination_path: str
) -> bool:
    current_root = Path(current_project_root).resolve()
    destination_root = Path(destination_path).resolve()
    return destination_root == current_root or current_root in destination_root.parents


def evaluate_restore_as_copy_eligibility(
    *,
    source_kind: str | None,
    source_name: str,
    restore_as_new: bool | None,
    current_project_root: str,
    destination_path: str | None,
    source_exists: bool,
    source_readable: bool,
    source_project_id: str | None,
    expected_project_id: str | None,
    manifest_present: bool,
    manifest_valid: bool,
    checksum_state: str | None = None,
    checksum_required: bool = False,
    destination_exists: bool = False,
    destination_parent_exists: bool = True,
    source_scope: str | None = None,
    policy_blocked_reason: str | None = None,
) -> Dict[str, Any]:
    """Evaluate whether a copy restore is safe to materialize."""

    blocked_reasons: list[str] = []
    checks = {
        "source_exists": source_exists,
        "source_readable": source_readable,
        "source_kind_explicit": bool(source_kind and str(source_kind).strip()),
        "restore_as_new_requested": restore_as_new is True,
        "manifest_present": manifest_present,
        "manifest_valid": manifest_valid,
        "checksum_state": checksum_state,
        "checksum_required": checksum_required,
        "destination_exists": destination_exists,
        "destination_parent_exists": destination_parent_exists,
        "current_root_safe": True,
        "scope_matches": True,
    }

    if not checks["source_kind_explicit"]:
        blocked_reasons.append("ambiguous_source_kind")
    if restore_as_new is not True:
        blocked_reasons.append("overwrite_not_allowed")
    if not source_exists:
        blocked_reasons.append("missing_source")
    if not source_readable:
        blocked_reasons.append("unreadable_source")
    if not manifest_present:
        blocked_reasons.append("missing_manifest")
    elif not manifest_valid:
        blocked_reasons.append("invalid_manifest")

    if checksum_required:
        if checksum_state == "unavailable":
            blocked_reasons.append("checksum_unavailable")
        elif checksum_state == "mismatch":
            blocked_reasons.append("checksum_mismatch")

    if expected_project_id and source_project_id and source_project_id != expected_project_id:
        blocked_reasons.append("scope_mismatch")
        checks["scope_matches"] = False

    if not destination_parent_exists:
        blocked_reasons.append("destination_unavailable")

    if destination_path:
        if destination_exists:
            blocked_reasons.append("destination_exists")
        if _destination_overlaps_current_root(
            current_project_root=current_project_root,
            destination_path=destination_path,
        ):
            blocked_reasons.append("overwrite_not_allowed")
            checks["current_root_safe"] = False
    else:
        blocked_reasons.append("destination_unavailable")

    if policy_blocked_reason:
        blocked_reasons.append(policy_blocked_reason)

    blocked_reasons = _dedupe_reasons(blocked_reasons)
    destination_preview = to_posix(Path(destination_path)) if destination_path else None

    return {
        "eligible": len(blocked_reasons) == 0,
        "blocked_reasons": blocked_reasons,
        "warnings": [],
        "source_kind": source_kind,
        "source_name": source_name,
        "source_scope": source_scope,
        "source_project_id": source_project_id,
        "expected_project_id": expected_project_id,
        "restore_as_new": restore_as_new is True,
        "current_project_root": to_posix(Path(current_project_root)),
        "destination_preview": destination_preview,
        "checksum_state": checksum_state,
        "checks": checks,
    }


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


def restore_from_zip(
    project_root: str,
    zip_filename: str,
    *,
    restore_as_new: bool | None = True,
    project_id: str | None = None,
) -> Dict[str, Any]:
    """Extract a ZIP export into a new sibling folder without overwriting."""
    exports_dir = os.path.join(project_root, "exports")
    zip_path = os.path.join(exports_dir, os.path.basename(zip_filename))
    archive_path = Path(zip_path)
    started_at = time.perf_counter()
    project_scope = project_id or os.path.basename(project_root)
    source_readable = False
    if not os.path.isfile(zip_path):
        logger.error("ZIP not found: %s", zip_path)
        destination_preview = _create_destination(os.path.dirname(project_root), _read_project_slug(project_root))
        eligibility = evaluate_restore_as_copy_eligibility(
            source_kind="export-zip",
            source_name=os.path.basename(zip_filename),
            restore_as_new=restore_as_new,
            current_project_root=project_root,
            destination_path=destination_preview,
            source_exists=False,
            source_readable=False,
            source_project_id=None,
            expected_project_id=project_scope,
            manifest_present=False,
            manifest_valid=False,
            checksum_state="unavailable",
            checksum_required=False,
            destination_exists=os.path.exists(destination_preview),
            destination_parent_exists=os.path.isdir(os.path.dirname(destination_preview)),
            source_scope="project-exports",
        )
        return {
            "status": "error",
            "message": "zip not found",
            "eligibility_decision": eligibility,
            "operation": _restore_operation_payload(
                source_kind="export-zip",
                archive_path=archive_path,
                destination_path=Path(destination_preview),
                elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                failure_phase="archive-open",
                completion_status="blocked" if not eligibility["eligible"] else "failed",
                cleanup_status="completed",
            ),
        }

    temp_dir = tempfile.mkdtemp()
    try:
        with zipfile.ZipFile(zip_path) as archive:
            source_readable = True
            archive.extractall(temp_dir)
        manifest_dir = _find_manifest_dir(temp_dir)
        if not manifest_dir or not _ensure_required_files(manifest_dir):
            logger.error("Missing manifest files in extracted zip: %s", zip_path)
            slug = _read_project_slug(project_root)
            parent = os.path.dirname(project_root)
            destination = _create_destination(parent, slug)
            eligibility = evaluate_restore_as_copy_eligibility(
                source_kind="export-zip",
                source_name=os.path.basename(zip_filename),
                restore_as_new=restore_as_new,
                current_project_root=project_root,
                destination_path=destination,
                source_exists=True,
                source_readable=source_readable,
                source_project_id=None,
                expected_project_id=project_scope,
                manifest_present=False,
                manifest_valid=False,
                checksum_state="unavailable",
                checksum_required=False,
                destination_exists=os.path.exists(destination),
                destination_parent_exists=os.path.isdir(parent),
                source_scope="project-exports",
            )
            return {
                "status": "error",
                "message": "restored missing required file: project.json or outline.json",
                "eligibility_decision": eligibility,
                "operation": _restore_operation_payload(
                    source_kind="export-zip",
                    archive_path=archive_path,
                    destination_path=Path(destination),
                    elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                    failure_phase="extract-validation",
                    completion_status="blocked" if not eligibility["eligible"] else "failed",
                    cleanup_status="completed",
                ),
            }

        source_project_id: str | None = None
        manifest_valid = True
        manifest_project_json = os.path.join(manifest_dir, "project.json")
        if os.path.isfile(manifest_project_json):
            try:
                with open(manifest_project_json, "r", encoding="utf-8") as fh:
                    project_data = json.load(fh)
                if isinstance(project_data, dict):
                    project_id_value = project_data.get("project_id")
                    if isinstance(project_id_value, str) and project_id_value.strip():
                        source_project_id = project_id_value
                else:
                    manifest_valid = False
            except json.JSONDecodeError:
                manifest_valid = False

        if not manifest_valid:
            slug = _read_project_slug(project_root)
            parent = os.path.dirname(project_root)
            destination = _create_destination(parent, slug)
            eligibility = evaluate_restore_as_copy_eligibility(
                source_kind="export-zip",
                source_name=os.path.basename(zip_filename),
                restore_as_new=restore_as_new,
                current_project_root=project_root,
                destination_path=destination,
                source_exists=True,
                source_readable=source_readable,
                source_project_id=source_project_id,
                expected_project_id=project_scope,
                manifest_present=True,
                manifest_valid=False,
                checksum_state="unavailable",
                checksum_required=False,
                destination_exists=os.path.exists(destination),
                destination_parent_exists=os.path.isdir(parent),
                source_scope="project-exports",
            )
            return {
                "status": "error",
                "message": "restored manifest is invalid",
                "eligibility_decision": eligibility,
                "operation": _restore_operation_payload(
                    source_kind="export-zip",
                    archive_path=archive_path,
                    destination_path=Path(destination),
                    elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                    failure_phase="extract-validation",
                    completion_status="blocked" if not eligibility["eligible"] else "failed",
                    cleanup_status="completed",
                ),
            }

        slug = _read_project_slug(project_root)
        parent = os.path.dirname(project_root)
        destination = _create_destination(parent, slug)
        eligibility = evaluate_restore_as_copy_eligibility(
            source_kind="export-zip",
            source_name=os.path.basename(zip_filename),
            restore_as_new=restore_as_new,
            current_project_root=project_root,
            destination_path=destination,
            source_exists=True,
            source_readable=source_readable,
            source_project_id=source_project_id,
            expected_project_id=project_scope,
            manifest_present=True,
            manifest_valid=True,
            checksum_state="unavailable",
            checksum_required=False,
            destination_exists=os.path.exists(destination),
            destination_parent_exists=os.path.isdir(parent),
            source_scope="project-exports",
        )
        if not eligibility["eligible"]:
            logger.warning("ZIP restore copy eligibility blocked: %s", eligibility["blocked_reasons"])
            return {
                "status": "error",
                "message": "restore-as-copy eligibility blocked",
                "eligibility_decision": eligibility,
                "operation": _restore_operation_payload(
                    source_kind="export-zip",
                    archive_path=archive_path,
                    destination_path=Path(destination),
                    elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                    failure_phase="eligibility",
                    completion_status="blocked",
                    cleanup_status="completed",
                    degraded_reasons=list(eligibility["blocked_reasons"]),
                ),
            }
        shutil.move(manifest_dir, destination)
        destination_path = Path(destination)
        logger.info("Restored ZIP %s -> %s", zip_path, destination)
        return {
            "status": "ok",
            "restored_path": destination,
            "restored_project_slug": os.path.basename(destination),
            "eligibility_decision": eligibility,
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
        destination_preview = _create_destination(os.path.dirname(project_root), _read_project_slug(project_root))
        eligibility = evaluate_restore_as_copy_eligibility(
            source_kind="export-zip",
            source_name=os.path.basename(zip_filename),
            restore_as_new=restore_as_new,
            current_project_root=project_root,
            destination_path=destination_preview,
            source_exists=True,
            source_readable=False,
            source_project_id=None,
            expected_project_id=project_scope,
            manifest_present=False,
            manifest_valid=False,
            checksum_state="unavailable",
            checksum_required=False,
            destination_exists=os.path.exists(destination_preview),
            destination_parent_exists=os.path.isdir(os.path.dirname(destination_preview)),
            source_scope="project-exports",
        )
        return {
            "status": "error",
            "message": "zip archive is corrupt",
            "eligibility_decision": eligibility,
            "operation": _restore_operation_payload(
                source_kind="export-zip",
                archive_path=archive_path,
                destination_path=Path(destination_preview),
                elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                failure_phase="archive-open",
                completion_status="blocked" if not eligibility["eligible"] else "failed",
                cleanup_status="completed",
            ),
        }
    except OSError as exc:
        logger.exception("Failed to restore zip: %s", zip_path)
        destination_preview = _create_destination(os.path.dirname(project_root), _read_project_slug(project_root))
        eligibility = evaluate_restore_as_copy_eligibility(
            source_kind="export-zip",
            source_name=os.path.basename(zip_filename),
            restore_as_new=restore_as_new,
            current_project_root=project_root,
            destination_path=destination_preview,
            source_exists=True,
            source_readable=source_readable,
            source_project_id=None,
            expected_project_id=project_scope,
            manifest_present=False,
            manifest_valid=False,
            checksum_state="unavailable",
            checksum_required=False,
            destination_exists=os.path.exists(destination_preview),
            destination_parent_exists=os.path.isdir(os.path.dirname(destination_preview)),
            source_scope="project-exports",
        )
        return {
            "status": "error",
            "message": "could not materialize restored project",
            "details": str(exc),
            "eligibility_decision": eligibility,
            "operation": _restore_operation_payload(
                source_kind="export-zip",
                archive_path=archive_path,
                destination_path=Path(destination_preview),
                elapsed_ms=round((time.perf_counter() - started_at) * 1000),
                failure_phase="materialize",
                completion_status="blocked" if not eligibility["eligible"] else "failed",
                cleanup_status="completed",
            ),
        }
    finally:
        if os.path.isdir(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
