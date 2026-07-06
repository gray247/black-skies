"""Backup verification router for Phase 5."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ValidationError, field_validator

from ..backup_verifier import run_verification
from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..io import read_json
from ..e2e_mode import allow_e2e_synthetic_mode, e2e_backup_verification
from ..http import raise_validation_error
from ..models._project_id import validate_project_id
from ..snapshots import SNAPSHOT_DIR_NAME
from .dependencies import get_diagnostics, get_settings

router = APIRouter(prefix="/backup_verifier", tags=["backup_verifier"])


class VerificationRequest(BaseModel):
    """Payload describing a verification request."""

    project_id: str

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str) -> str:
        return validate_project_id(value)


def _report_observation_metadata() -> dict[str, Any]:
    return {
        "claim_scope": "persisted-verification-report-read",
        "strongest_authority": "A3",
        "supporting_authorities": [],
        "historical_only": True,
        "does_not_imply": [
            "integrity-valid",
            "report-fresh",
            "restorable",
            "browseable",
        ],
    }


def _project_report_roots(settings: ServiceSettings, project_id: str) -> list[Path]:
    """Return project roots that advertise the requested project id."""

    base_dir = settings.project_base_dir
    roots: list[Path] = []
    seen: set[Path] = set()

    def consider(root: Path) -> None:
        if root in seen or not root.exists() or not root.is_dir():
            return
        project_json = root / "project.json"
        if not project_json.exists():
            return
        try:
            payload = read_json(project_json)
        except (OSError, ValueError):
            return
        if not isinstance(payload, dict) or payload.get("project_id") != project_id:
            return
        seen.add(root)
        roots.append(root)

    consider(base_dir / project_id)
    if base_dir.exists():
        for entry in sorted(base_dir.iterdir(), key=lambda item: item.name):
            if entry.is_dir():
                consider(entry)

    return roots


@router.post("/run", status_code=status.HTTP_200_OK)
async def run_backup_verifier(
    payload: dict[str, Any] | None = None,
    project_id: str | None = Query(None, alias="projectId"),
    latest_only: bool = Query(False),
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    """Run snapshot verification for the specified project."""

    identifier = project_id
    if payload and isinstance(payload, dict) and "projectId" in payload:
        identifier = payload["projectId"]

    if not isinstance(identifier, str):
        raise_validation_error(
            message="Missing project identifier.",
            details={"project_id": identifier},
            diagnostics=diagnostics,
            project_root=None,
        )

    try:
        validated_id = validate_project_id(identifier)
    except ValueError as exc:
        raise_validation_error(
            message="Invalid project identifier.",
            details={"errors": str(exc)},
            diagnostics=diagnostics,
            project_root=None,
        )

    project_root = settings.project_base_dir / validated_id
    if not project_root.exists():
        raise_validation_error(
            message="Project root is missing.",
            details={"project_id": validated_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    if allow_e2e_synthetic_mode():
        return e2e_backup_verification(validated_id)
    report = run_verification(
        project_root,
        settings=settings,
        latest_only=latest_only,
    )
    report_payload = json.dumps(report, indent=2)
    report_dir = project_root / SNAPSHOT_DIR_NAME
    report_dir.mkdir(parents=True, exist_ok=True)
    (report_dir / "last_verification.json").write_text(
        report_payload,
        encoding="utf-8",
    )
    return report


@router.get("/report", status_code=status.HTTP_200_OK)
async def get_backup_verification_report(
    project_id: str | None = Query(None, alias="projectId"),
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    """Fetch the last stored verification report."""

    if not isinstance(project_id, str):
        raise_validation_error(
            message="Missing project identifier.",
            details={"project_id": project_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    try:
        validated_id = validate_project_id(project_id)
    except ValueError as exc:
        raise_validation_error(
            message="Invalid project identifier.",
            details={"errors": str(exc)},
            diagnostics=diagnostics,
            project_root=None,
        )

    project_root = settings.project_base_dir / validated_id
    if not project_root.exists():
        raise_validation_error(
            message="Project root is missing.",
            details={"project_id": validated_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    report_paths = [
        report_root / SNAPSHOT_DIR_NAME / "last_verification.json"
        for report_root in (_project_report_roots(settings, validated_id) or [project_root])
    ]
    report_path = next((path for path in report_paths if path.exists()), None)
    if report_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification report not found.",
        )

    try:
        payload = read_json(report_path)
        if isinstance(payload, dict):
            payload = dict(payload)
            payload["report_observation"] = _report_observation_metadata()
        return payload
    except (OSError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to read verification report.",
        )
