"""Draft rewrite and critique endpoints."""

from __future__ import annotations

import asyncio
import hashlib
import json
import shutil
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import Depends, HTTPException, status
from pydantic import ValidationError

from ...budgeting import (
    classify_budget,
    derive_critique_cost,
    load_project_budget_state,
    persist_project_budget,
)
from ...config import ServiceSettings
from ...critique import BLOCKED_RUBRIC_CATEGORIES, CritiqueService
from ...diagnostics import DiagnosticLogger
from ...diff_engine import compute_diff
from ...export import merge_front_matter, normalize_markdown
from ...http import raise_conflict_error, raise_service_error, raise_validation_error
from ...models.critique import DraftCritiqueRequest
from ...models.rewrite import DraftRewriteRequest
from ...persistence import DraftPersistence, write_text_atomic
from ...scene_docs import DraftRequestError, read_scene_document
from ..dependencies import get_critique_service, get_diagnostics, get_settings
from ..shared import utc_timestamp
from . import router


def _apply_rewrite_instructions(original: str, instructions: str | None) -> str:
    baseline = normalize_markdown(original)
    prompt = (instructions or "Maintain current tone.").strip()
    if not prompt:
        prompt = "Maintain current tone."
    digest = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
    templates = [
        "The rhythm tightens, each beat landing with intent.",
        "A hush settles before the next wave hits.",
        "Their resolve sharpens against the gathering dark.",
        "An undercurrent of hope threads through the static.",
    ]
    closing = templates[int(digest[:8], 16) % len(templates)]
    return f"{baseline}\n\n{closing} ({prompt})"


def _persist_batch_critique_summary(
    *,
    project_root: Path,
    project_id: str,
    request_model: DraftCritiqueRequest,
    result: dict[str, Any],
    diagnostics: DiagnosticLogger,
) -> None:
    """Record the most recent batch critique summary for export."""

    if not project_root.exists():
        return
    critiques_dir = project_root / "history" / "critiques"
    try:
        critiques_dir.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Failed to prepare critiques history directory.",
            details={"error": str(exc), "unit_id": request_model.unit_id},
        )
        return

    payload = {
        "schema_version": "BatchCritiqueSummary v1",
        "project_id": project_id,
        "unit_id": request_model.unit_id,
        "draft_id": request_model.draft_id,
        "rubric": request_model.rubric,
        "summary": result.get("summary"),
        "priorities": result.get("priorities") or [],
        "model": result.get("model"),
        "captured_at": utc_timestamp(),
    }
    budget_info = result.get("budget")
    if isinstance(budget_info, dict):
        payload["budget"] = {
            key: budget_info.get(key)
            for key in (
                "estimated_usd",
                "status",
                "message",
                "soft_limit_usd",
                "hard_limit_usd",
                "spent_usd",
                "total_after_usd",
            )
            if budget_info.get(key) is not None
        }

    target_path = critiques_dir / f"{request_model.unit_id}.json"
    try:
        write_text_atomic(
            target_path,
            json.dumps(payload, indent=2, ensure_ascii=False),
        )
    except OSError as exc:
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Failed to persist batch critique summary.",
            details={"error": str(exc), "unit_id": request_model.unit_id},
        )


@router.post("/rewrite")
async def rewrite_draft(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    """Apply rewrite instructions and persist the revised draft unit."""

    project_root: Path | None = None
    try:
        request_model = DraftRewriteRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        if isinstance(project_id, str):
            project_root = settings.project_base_dir / project_id
        raise_validation_error(
            message="Invalid draft rewrite request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    project_root = settings.project_base_dir / request_model.project_id
    try:
        target_path, front_matter, current_body = read_scene_document(
            project_root, request_model.unit_id
        )
    except DraftRequestError as exc:
        raise_conflict_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    current_normalized = normalize_markdown(current_body)
    submitted_normalized = normalize_markdown(request_model.unit.text)
    if current_normalized.strip() != submitted_normalized.strip():
        raise_conflict_error(
            message="The scene on disk no longer matches the submitted draft unit.",
            details={"unit_id": request_model.unit_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    revised_text = request_model.new_text
    if revised_text is None:
        revised_text = _apply_rewrite_instructions(current_body, request_model.instructions)

    normalized_revised = normalize_markdown(revised_text)
    if not normalized_revised.strip():
        raise_validation_error(
            message="Revised text must not be empty.",
            details={"unit_id": request_model.unit_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    diff_payload = compute_diff(current_normalized, normalized_revised)

    updated_front_matter = merge_front_matter(front_matter, request_model.unit.meta)
    updated_front_matter["id"] = request_model.unit_id

    persistence = DraftPersistence(settings=settings)
    target_path = project_root / "drafts" / f"{request_model.unit_id}.md"
    backup_path: Path | None = None
    try:
        if target_path.exists():
            backup_path = target_path.parent / f".{target_path.name}.{uuid4().hex}.bak"
            shutil.copyfile(target_path, backup_path)
        persistence.write_scene(request_model.project_id, updated_front_matter, normalized_revised)
    except OSError as exc:
        if backup_path and backup_path.exists():
            try:
                shutil.move(str(backup_path), str(target_path))
            except OSError:  # pragma: no cover - best effort restore
                pass
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Failed to persist rewritten scene.",
            details={"unit_id": request_model.unit_id, "error": str(exc)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Failed to persist rewritten scene.",
                "details": {"unit_id": request_model.unit_id},
            },
        ) from exc
    else:
        if backup_path and backup_path.exists():
            try:
                backup_path.unlink()
            except OSError:  # pragma: no cover - cleanup best effort
                pass

    return {
        "unit_id": request_model.unit_id,
        "revised_text": normalized_revised,
        "diff": {
            "added": diff_payload.added,
            "removed": diff_payload.removed,
            "changed": diff_payload.changed,
            "anchors": diff_payload.anchors,
        },
        "schema_version": "DraftUnitSchema v1",
        "model": {"name": "draft-rewriter-v1", "provider": "black-skies-local"},
    }


@router.post("/critique")
async def critique_draft(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    critique_service: CritiqueService = Depends(get_critique_service),
) -> dict[str, Any]:
    """Run a critique pass against the submitted draft unit."""

    project_id: str | None = None
    project_root: Path | None = None
    payload_for_model: dict[str, Any]
    if isinstance(payload, dict):
        project_value = payload.get("project_id")
        if isinstance(project_value, str) and project_value.strip():
            project_id = project_value
            candidate_root = settings.project_base_dir / project_value
            if candidate_root.exists():
                project_root = candidate_root
        payload_for_model = {key: value for key, value in payload.items() if key != "project_id"}
    else:
        payload_for_model = {}

    try:
        request_model = DraftCritiqueRequest.model_validate(payload_for_model)
    except ValidationError as exc:
        raise_validation_error(
            message="Invalid draft critique request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    blocked_matches = []
    seen_blocked = set()
    for category in request_model.rubric:
        key = category.casefold()
        if key in BLOCKED_RUBRIC_CATEGORIES and key not in seen_blocked:
            blocked_matches.append(category)
            seen_blocked.add(key)

    if blocked_matches:
        raise_validation_error(
            message="Invalid draft critique request.",
            details={
                "errors": [
                    {
                        "loc": ["rubric"],
                        "msg": (
                            "Unknown rubric categories: "
                            f"{', '.join(blocked_matches)}"
                        ),
                        "type": "value_error.rubric.unknown_category",
                        "ctx": {"blocked_categories": sorted(BLOCKED_RUBRIC_CATEGORIES)},
                    }
                ]
            },
            diagnostics=diagnostics,
            project_root=project_root,
        )

    try:
        result = await asyncio.to_thread(critique_service.run, request_model)
    except RuntimeError as exc:
        raise_service_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL",
            message="Failed to produce critique.",
            details={"error": str(exc)},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    budget_payload: dict[str, Any] | None = None
    if project_root is not None and project_id is not None:
        try:
            budget_state = load_project_budget_state(project_root, diagnostics)
            _, front_matter, body = read_scene_document(project_root, request_model.unit_id)
            critique_cost = derive_critique_cost(body, front_matter=front_matter)
            status_label, message, total_after = classify_budget(
                critique_cost,
                soft_limit=budget_state.soft_limit,
                hard_limit=budget_state.hard_limit,
                current_spend=budget_state.spent_usd,
            )
            persist_project_budget(budget_state, total_after)
            budget_payload = {
                "estimated_usd": critique_cost,
                "status": status_label,
                "message": message,
                "soft_limit_usd": round(budget_state.soft_limit, 2),
                "hard_limit_usd": round(budget_state.hard_limit, 2),
                "spent_usd": round(total_after, 2),
                "total_after_usd": round(total_after, 2),
            }
        except DraftRequestError as exc:
            raise_validation_error(
                message=str(exc),
                details=exc.details,
                diagnostics=diagnostics,
                project_root=project_root,
            )
        except Exception as exc:  # pragma: no cover - defensive logging
            diagnostics.log(
                project_root,
                code="INTERNAL",
                message="Failed to record critique budget telemetry.",
                details={"error": str(exc), "unit_id": request_model.unit_id},
            )
            budget_payload = None

    if budget_payload is not None:
        result["budget"] = budget_payload

    if project_root is not None and project_id is not None:
        _persist_batch_critique_summary(
            project_root=project_root,
            project_id=project_id,
            request_model=request_model,
            result=result,
            diagnostics=diagnostics,
        )

    return result

__all__ = ["rewrite_draft", "critique_draft"]
