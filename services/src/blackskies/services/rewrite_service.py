"""Business logic for the draft rewrite endpoint."""

from __future__ import annotations

import logging
import os
import shutil
import tempfile
import time
import traceback
from pathlib import Path

from fastapi import HTTPException, status

from .config import Settings
from .diff_engine import DiffEngine
from .models import (
    ModelInfo,
    RewriteRequest,
    RewriteResponse,
    ErrorDetail,
)

LOGGER = logging.getLogger(__name__)

MODEL_INFO = ModelInfo(name="local_rewrite_v1", provider="local")


def process_rewrite(request: RewriteRequest, settings: Settings) -> RewriteResponse:
    """Validate, persist, and return a rewrite operation."""

    envelope = request.envelope
    units = envelope.units

    if not units:
        raise _validation_error("Rewrite envelope must include one unit.")
    if len(units) != 1:
        raise _validation_error("Rewrite accepts exactly one unit per request.")

    unit = units[0]
    if unit.id != request.unit_id:
        raise _validation_error(
            "Envelope unit does not match requested unit.",
            details={"unit_id": request.unit_id, "envelope_unit": unit.id},
        )
    if envelope.draft_id != request.draft_id:
        raise _validation_error(
            "Envelope draft identifier mismatch.",
            details={"draft_id": request.draft_id, "envelope_draft": envelope.draft_id},
        )
    if envelope.schema_version != settings.schema_version:
        raise _validation_error(
            "Unsupported draft schema version.",
            details={"expected": settings.schema_version, "received": envelope.schema_version},
        )

    unit_path = _resolve_unit_path(settings.project_root, request.unit_id)
    prefix, current_body = _read_unit_contents(unit_path)

    envelope_body = _normalize_text(unit.text)
    current_body_normalized = _normalize_text(current_body)

    if envelope_body != current_body_normalized:
        LOGGER.info("Stale rewrite request for %s", request.unit_id)
        raise _conflict_error(
            "Submitted draft does not match the latest version on disk.",
            details={"unit_id": request.unit_id, "draft_id": request.draft_id},
        )

    revised_text = _normalize_text(request.new_text)
    diff = DiffEngine(anchor_window=settings.anchor_window).compute(
        current_body_normalized,
        revised_text,
    )

    file_body = request.new_text.replace("\r\n", "\n")
    if file_body and not file_body.endswith("\n"):
        file_body = f"{file_body}\n"

    new_contents = f"{prefix}{file_body}" if prefix else file_body
    _write_with_backup(unit_path, new_contents, settings)

    return RewriteResponse(
        unit_id=request.unit_id,
        revised_text=revised_text,
        diff=diff,
        schema_version=settings.schema_version,
        model=MODEL_INFO,
    )


def _resolve_unit_path(project_root: Path, unit_id: str) -> Path:
    drafts_dir = project_root / "drafts"
    path = drafts_dir / f"{unit_id}.md"
    if not path.exists():
        raise _conflict_error(
            "Requested unit does not exist on disk.",
            details={"unit_id": unit_id},
        )
    return path


def _read_unit_contents(unit_path: Path) -> tuple[str, str]:
    try:
        contents = unit_path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:  # pragma: no cover - guarded by caller resolution
        raise _conflict_error(
            "Requested unit does not exist on disk.",
            details={"unit_id": unit_path.stem},
        ) from exc

    if contents.startswith("---"):
        delimiter = "\n---\n"
        marker = contents.find(delimiter, len("---"))
        if marker == -1:
            LOGGER.error("Unit %s is missing closing front matter delimiter", unit_path)
            raise _internal_error(
                "Scene file is missing closing front matter delimiter.",
                details={"path": str(unit_path)},
            )
        prefix_end = marker + len(delimiter)
        prefix = contents[:prefix_end]
        body = contents[prefix_end:]
    else:
        prefix = ""
        body = contents

    return prefix, body


def _normalize_text(text: str) -> str:
    return text.replace("\r\n", "\n").rstrip("\n")


def _write_with_backup(unit_path: Path, new_contents: str, settings: Settings) -> None:
    backup_path = unit_path.with_suffix(unit_path.suffix + ".bak")
    tmp_file_path: Path | None = None
    backup_created = False

    try:
        if unit_path.exists():
            shutil.copy2(unit_path, backup_path)
            backup_created = True

        with tempfile.NamedTemporaryFile(
            "w", encoding="utf-8", dir=str(unit_path.parent), delete=False
        ) as handle:
            handle.write(new_contents)
            handle.flush()
            os.fsync(handle.fileno())
            tmp_file_path = Path(handle.name)

        os.replace(tmp_file_path, unit_path)
    except Exception as exc:  # pragma: no cover - exercised via IO failure tests
        if tmp_file_path and tmp_file_path.exists():
            tmp_file_path.unlink(missing_ok=True)
        if backup_created and backup_path.exists():
            shutil.copy2(backup_path, unit_path)
        _log_write_failure(unit_path, settings, exc)
        raise _internal_error(
            "Failed to persist rewritten unit to disk.",
            details={"unit_id": unit_path.stem},
        ) from exc
    else:
        if backup_created and backup_path.exists():
            backup_path.unlink()


def _log_write_failure(unit_path: Path, settings: Settings, error: Exception) -> None:
    diagnostics_root = (
        settings.project_root
        / settings.history_dirname
        / settings.diagnostics_dirname
    )
    diagnostics_root.mkdir(parents=True, exist_ok=True)
    timestamp = time.strftime("%Y%m%dT%H%M%S")
    log_path = diagnostics_root / f"rewrite_{unit_path.stem}_{timestamp}.log"

    LOGGER.exception("Error writing rewritten unit %s", unit_path.name, exc_info=error)

    with log_path.open("w", encoding="utf-8") as handle:
        handle.write(f"Rewrite failure for {unit_path.name}\n")
        handle.write(f"Error: {error}\n\n")
        handle.write(traceback.format_exc())


def _validation_error(message: str, *, details: ErrorDetail | None = None) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "code": "VALIDATION",
            "message": message,
            "details": details or {},
        },
    )


def _conflict_error(message: str, *, details: ErrorDetail | None = None) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={
            "code": "CONFLICT",
            "message": message,
            "details": details or {},
        },
    )


def _internal_error(message: str, *, details: ErrorDetail | None = None) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={
            "code": "INTERNAL",
            "message": message,
            "details": details or {},
        },
    )
