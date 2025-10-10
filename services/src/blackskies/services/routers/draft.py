"""Draft-related API routes and helpers."""

from __future__ import annotations

import copy
import hashlib
import json
import logging
import os
import re
import shutil
from dataclasses import dataclass
from importlib import resources
from pathlib import Path
from typing import Any, Final, TYPE_CHECKING
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ValidationError, field_validator

from ..config import ServiceSettings
from ..critique import CritiqueService
from ..diagnostics import DiagnosticLogger
from ..diff_engine import compute_diff
from ..draft_synthesizer import DraftSynthesizer
from ..http import (
    default_error_responses,
    raise_budget_error,
    raise_conflict_error,
    raise_service_error,
    raise_validation_error,
)
from ..models._project_id import validate_project_id
from ..models.accept import DraftAcceptRequest
from ..models.critique import DraftCritiqueRequest
from ..models.draft import DraftGenerateRequest, DraftUnitOverrides, DraftUnitScope
from ..models.outline import OutlineArtifact, OutlineScene
from ..models.rewrite import DraftRewriteRequest
from ..models.wizard import WizardLockSnapshotRequest
from ..persistence import DraftPersistence, SnapshotPersistence, write_text_atomic
from ..scene_docs import DraftRequestError, read_scene_document
from ..utils.paths import to_posix
from .dependencies import (
    get_diagnostics,
    get_critique_service,
    get_recovery_tracker,
    get_settings,
    get_snapshot_persistence,
)
from .shared import utc_timestamp

if TYPE_CHECKING:  # pragma: no cover - typing only
    from .recovery import RecoveryTracker

LOGGER = logging.getLogger(__name__)

__all__ = [
    "HARD_BUDGET_LIMIT_USD",
    "ProjectBudgetState",
    "SOFT_BUDGET_LIMIT_USD",
    "_build_meta_header",
    "_load_project_budget_state",
    "router",
]

_FIXTURE_PACKAGE: Final[str] = "blackskies.services.fixtures"
SOFT_BUDGET_LIMIT_USD: Final[float] = 5.0
HARD_BUDGET_LIMIT_USD: Final[float] = 10.0

_NUMERIC_SANITIZE_RE = re.compile(r"[^0-9.,+-]")


@dataclass
class ProjectBudgetState:
    project_root: Path
    metadata: dict[str, Any]
    soft_limit: float
    hard_limit: float
    spent_usd: float
    project_path: Path


class DraftExportRequest(BaseModel):
    project_id: str
    include_meta_header: bool = False

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str) -> str:
        """Ensure export requests use a safe single-segment project identifier."""

        return validate_project_id(value)


def _load_fixture(name: str) -> dict[str, Any]:
    try:
        fixture_path = resources.files(_FIXTURE_PACKAGE).joinpath(name)
    except (FileNotFoundError, ModuleNotFoundError) as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Fixture namespace is unavailable.",
                "details": {"fixture": name},
            },
        ) from exc

    try:
        with fixture_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError as exc:
        LOGGER.exception("Fixture %s is missing", name)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Fixture not found.",
                "details": {"fixture": name},
            },
        ) from exc
    except json.JSONDecodeError as exc:
        LOGGER.exception("Fixture %s contains invalid JSON", name)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Fixture data is invalid JSON.",
                "details": {"fixture": name},
            },
        ) from exc


def _load_outline_artifact(project_root: Path) -> OutlineArtifact:
    outline_path = project_root / "outline.json"
    if not outline_path.exists():
        raise DraftRequestError("Outline artifact is missing.", {"path": to_posix(outline_path)})

    try:
        with outline_path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except json.JSONDecodeError as exc:
        raise DraftRequestError(
            "Outline artifact contains invalid JSON.", {"path": to_posix(outline_path)}
        ) from exc

    try:
        return OutlineArtifact.model_validate(payload)
    except ValidationError as exc:
        raise DraftRequestError(
            "Outline artifact failed schema validation.",
            {"path": to_posix(outline_path), "errors": exc.errors()},
        ) from exc


def _build_meta_header(front_matter: dict[str, Any]) -> str | None:
    def _normalize(value: Any) -> str | None:
        if value is None:
            return None
        normalized = str(value).strip()
        if not normalized:
            return None
        return normalized

    parts: list[str] = []
    purpose = _normalize(front_matter.get("purpose"))
    if purpose:
        parts.append(f"purpose: {purpose}")
    emotion = _normalize(front_matter.get("emotion_tag"))
    if emotion:
        parts.append(f"emotion: {emotion}")
    pov = _normalize(front_matter.get("pov"))
    if pov:
        parts.append(f"pov: {pov}")
    if not parts:
        return None
    return "> " + " · ".join(parts)


def _compile_manuscript(
    project_root: Path,
    outline: OutlineArtifact,
    *,
    include_meta_header: bool = False,
) -> tuple[str, int, int]:
    chapters = sorted(outline.chapters, key=lambda chapter: chapter.order)
    scenes_by_chapter: dict[str, list[OutlineScene]] = {}
    for scene in outline.scenes:
        scenes_by_chapter.setdefault(scene.chapter_id, []).append(scene)
    for scene_list in scenes_by_chapter.values():
        scene_list.sort(key=lambda item: item.order)

    lines: list[str] = []
    chapter_count = 0
    scene_count = 0

    for chapter in chapters:
        chapter_scenes = scenes_by_chapter.get(chapter.id, [])
        if not chapter_scenes:
            continue

        chapter_count += 1
        lines.append(f"# {chapter.title}")
        lines.append("")

        seen_orders: set[int] = set()
        for scene in chapter_scenes:
            try:
                _, front_matter, body = read_scene_document(project_root, scene.id)
            except DraftRequestError as exc:
                raise DraftRequestError(str(exc), {**exc.details, "unit_id": scene.id}) from exc

            missing_fields: list[str] = []
            front_matter_id = front_matter.get("id")
            if not isinstance(front_matter_id, str) or not front_matter_id.strip():
                missing_fields.append("id")
            front_matter_title = front_matter.get("title")
            if not isinstance(front_matter_title, str) or not front_matter_title.strip():
                missing_fields.append("title")
            order_value_raw = front_matter.get("order")
            if not isinstance(order_value_raw, int):
                missing_fields.append("order")

            if missing_fields:
                missing_fields = sorted(set(missing_fields))
                raise DraftRequestError(
                    "Scene front-matter is missing required fields.",
                    {"unit_id": scene.id, "missing_fields": missing_fields},
                )

            order_value = order_value_raw
            if order_value in seen_orders:
                raise DraftRequestError(
                    "Duplicate scene order detected within chapter.",
                    {
                        "unit_id": scene.id,
                        "chapter_id": chapter.id,
                        "order": order_value,
                    },
                )
            if order_value != scene.order:
                raise DraftRequestError(
                    "Scene order does not match outline entry.",
                    {
                        "unit_id": scene.id,
                        "chapter_id": chapter.id,
                        "outline_order": scene.order,
                        "front_matter_order": order_value,
                    },
                )
            seen_orders.add(order_value)

            title = front_matter.get("title") or scene.title
            section_lines = [f"## {title}"]
            meta_line = _build_meta_header(front_matter) if include_meta_header else None
            if meta_line:
                section_lines.append(meta_line)

            body_text = _normalize_markdown(body)
            if body_text:
                if meta_line:
                    section_lines.append("")
                section_lines.append(body_text)

            lines.extend(section_lines)
            lines.append("")
            scene_count += 1

        if lines and lines[-1] != "":
            lines.append("")

    manuscript = "\n".join(line.rstrip() for line in lines).strip()
    return manuscript, chapter_count, scene_count


def _normalize_markdown(value: str) -> str:
    return value.replace("\r\n", "\n").strip()


def _compute_sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _merge_meta(front_matter: dict[str, Any], meta: dict[str, Any]) -> dict[str, Any]:
    if not meta:
        return front_matter

    merged = dict(front_matter)
    allowed = {
        "order",
        "purpose",
        "emotion_tag",
        "pov",
        "goal",
        "conflict",
        "turn",
        "word_target",
        "beats",
    }
    for key, value in meta.items():
        if key not in allowed:
            continue
        if value is None:
            continue
        merged[key] = value
    return merged


def _apply_rewrite_instructions(original: str, instructions: str | None) -> str:
    baseline = _normalize_markdown(original)
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


def _resolve_requested_scenes(
    request_model: DraftGenerateRequest, outline: OutlineArtifact
) -> list[OutlineScene]:
    scenes_by_id = {scene.id: scene for scene in outline.scenes}

    if request_model.unit_scope is DraftUnitScope.SCENE:
        missing = [scene_id for scene_id in request_model.unit_ids if scene_id not in scenes_by_id]
        if missing:
            raise DraftRequestError(
                "One or more scene IDs are not present in the outline.",
                {"missing_scene_ids": missing},
            )
        return [scenes_by_id[scene_id] for scene_id in request_model.unit_ids]

    chapter_id = request_model.unit_ids[0]
    chapter_ids = {chapter.id for chapter in outline.chapters}
    if chapter_id not in chapter_ids:
        raise DraftRequestError(
            "Requested chapter is not present in the outline.",
            {"chapter_id": chapter_id},
        )

    scenes = [scene for scene in outline.scenes if scene.chapter_id == chapter_id]
    if not scenes:
        raise DraftRequestError(
            "Requested chapter does not contain any scenes.",
            {"chapter_id": chapter_id},
        )
    return scenes


def _hydrate_outline_request(payload: dict[str, Any]) -> DraftGenerateRequest:
    try:
        return DraftGenerateRequest.model_validate(payload)
    except ValidationError as exc:
        raise DraftRequestError(
            "Invalid draft generation request.", {"errors": exc.errors()}
        ) from exc


def _estimate_word_target(scene: OutlineScene, overrides: DraftUnitOverrides | None) -> int:
    if overrides and overrides.word_target is not None:
        return overrides.word_target
    order_value = overrides.order if overrides and overrides.order is not None else scene.order
    return 850 + (order_value * 40)


def _normalize_budget_token(raw_value: str) -> str | None:
    text = raw_value.strip().replace("\u00a0", "")
    if not text:
        return None

    sign = ""
    if text[0] in "+-":
        sign = text[0]
        text = text[1:]

    filtered = _NUMERIC_SANITIZE_RE.sub("", text)
    if not filtered:
        return None

    filtered = filtered.replace("+", "")
    if "-" in filtered:
        return None

    if "," in filtered and "." in filtered:
        last_dot = filtered.rfind(".")
        last_comma = filtered.rfind(",")
        if last_dot > last_comma:
            decimal_sep = "."
            thousands_sep = ","
        else:
            decimal_sep = ","
            thousands_sep = "."

        filtered = filtered.replace(thousands_sep, "")
        if decimal_sep != ".":
            filtered = filtered.replace(decimal_sep, ".", 1)
            if decimal_sep in filtered:
                return None
    elif "," in filtered:
        fractional = filtered.split(",", 1)[1]
        if filtered.count(",") == 1 and 1 <= len(fractional) <= 2:
            filtered = filtered.replace(",", ".")
        else:
            filtered = filtered.replace(",", "")

    if filtered.count(".") > 1:
        return None

    candidate = f"{sign}{filtered}" if sign else filtered
    if candidate in {"", "+", "-", ".", "+.", "-."}:
        return None
    return candidate


def _coerce_budget_value(
    raw_value: Any,
    *,
    default: float,
    field: str,
    project_root: Path,
    diagnostics: DiagnosticLogger,
) -> float:
    if isinstance(raw_value, (int, float)):
        return float(raw_value)
    if isinstance(raw_value, str):
        normalized = _normalize_budget_token(raw_value)
        if normalized is not None:
            try:
                return float(normalized)
            except ValueError:
                pass
    elif raw_value is None:
        return float(default)

    diagnostics.log(
        project_root,
        code="VALIDATION",
        message="Invalid budget value encountered; default applied.",
        details={"field": field, "value": raw_value},
    )
    return float(default)


def _load_project_budget_state(
    project_root: Path, diagnostics: DiagnosticLogger
) -> ProjectBudgetState:
    project_path = project_root / "project.json"
    base_payload: dict[str, Any] = {
        "project_id": project_root.name,
        "budget": {
            "soft": SOFT_BUDGET_LIMIT_USD,
            "hard": HARD_BUDGET_LIMIT_USD,
            "spent_usd": 0.0,
        },
    }
    payload = copy.deepcopy(base_payload)

    if project_path.exists():
        try:
            with project_path.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
        except (OSError, json.JSONDecodeError) as exc:
            diagnostics.log(
                project_root,
                code="INTERNAL",
                message="Failed to read project metadata.",
                details={"error": str(exc)},
            )

    budget_meta = payload.setdefault("budget", {})
    soft_limit = _coerce_budget_value(
        budget_meta.get("soft", SOFT_BUDGET_LIMIT_USD),
        default=SOFT_BUDGET_LIMIT_USD,
        field="soft",
        project_root=project_root,
        diagnostics=diagnostics,
    )
    hard_limit = _coerce_budget_value(
        budget_meta.get("hard", HARD_BUDGET_LIMIT_USD),
        default=HARD_BUDGET_LIMIT_USD,
        field="hard",
        project_root=project_root,
        diagnostics=diagnostics,
    )
    spent_usd = _coerce_budget_value(
        budget_meta.get("spent_usd", 0.0),
        default=0.0,
        field="spent_usd",
        project_root=project_root,
        diagnostics=diagnostics,
    )

    effective_hard = hard_limit if hard_limit > 0 else HARD_BUDGET_LIMIT_USD
    if soft_limit > effective_hard:
        soft_limit = effective_hard

    return ProjectBudgetState(
        project_root=project_root,
        metadata=payload,
        soft_limit=soft_limit,
        hard_limit=effective_hard,
        spent_usd=spent_usd if spent_usd >= 0 else 0.0,
        project_path=project_path,
    )


def _classify_budget(
    estimated_cost: float,
    *,
    soft_limit: float,
    hard_limit: float,
    current_spend: float,
) -> tuple[str, str, float]:
    effective_hard_limit = hard_limit if hard_limit > 0 else HARD_BUDGET_LIMIT_USD
    effective_soft_limit = (
        soft_limit if 0 <= soft_limit <= effective_hard_limit else effective_hard_limit
    )

    total_after_run = round(current_spend + estimated_cost, 2)

    if total_after_run >= effective_hard_limit:
        return (
            "blocked",
            (
                f"Estimated total ${total_after_run:.2f} exceeds hard limit "
                f"${effective_hard_limit:.2f}."
            ),
            total_after_run,
        )
    if total_after_run >= effective_soft_limit:
        return (
            "soft-limit",
            (
                f"Estimated total ${total_after_run:.2f} exceeds soft limit "
                f"${effective_soft_limit:.2f}."
            ),
            total_after_run,
        )
    return "ok", "Estimate within budget.", total_after_run


def _persist_project_budget(state: ProjectBudgetState, new_spent_usd: float) -> None:
    payload = copy.deepcopy(state.metadata)
    budget_section = payload.setdefault("budget", {})
    budget_section["soft"] = round(state.soft_limit, 2)
    budget_section["hard"] = round(state.hard_limit, 2)
    budget_section["spent_usd"] = round(max(new_spent_usd, 0.0), 2)

    payload.setdefault("project_id", state.project_root.name)

    serialized = json.dumps(payload, indent=2, ensure_ascii=False)

    state.project_root.mkdir(parents=True, exist_ok=True)
    temp_path = state.project_path.parent / f".{state.project_path.name}.{uuid4().hex}.tmp"
    with temp_path.open("w", encoding="utf-8") as handle:
        handle.write(serialized)
        handle.flush()
        os.fsync(handle.fileno())

    temp_path.replace(state.project_path)


router = APIRouter(prefix="/draft", tags=["draft"], responses=default_error_responses())


def _fingerprint_generate_request(request: DraftGenerateRequest, scenes: list[OutlineScene]) -> str:
    """Return a deterministic fingerprint for a draft generation request."""

    request_payload = request.model_dump(mode="json")
    overrides_payload = request_payload.get("overrides", {})
    if isinstance(overrides_payload, dict):
        sorted_overrides: dict[str, Any] = {}
        for key in sorted(overrides_payload.keys()):
            sorted_overrides[key] = overrides_payload[key]
        request_payload["overrides"] = sorted_overrides

    fingerprint_source = {
        "request": request_payload,
        "scenes": [scene.model_dump(mode="json") for scene in scenes],
    }
    serialized = json.dumps(fingerprint_source, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


@router.post("/generate")
async def generate_draft(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    project_root: Path | None = None
    try:
        request_model = DraftGenerateRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        if isinstance(project_id, str):
            project_root = settings.project_base_dir / project_id
        raise_validation_error(
            message="Invalid draft generation request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    project_root = settings.project_base_dir / request_model.project_id
    try:
        outline = _load_outline_artifact(project_root)
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    try:
        scene_summaries = _resolve_requested_scenes(request_model, outline)
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    budget_state = _load_project_budget_state(project_root, diagnostics)
    budget_meta = budget_state.metadata.setdefault("budget", {})

    request_fingerprint = _fingerprint_generate_request(request_model, scene_summaries)
    cached_response = budget_meta.get("last_generate_response")
    if budget_meta.get("last_request_fingerprint") == request_fingerprint and isinstance(
        cached_response, dict
    ):
        return copy.deepcopy(cached_response)

    total_words = 0
    for scene in scene_summaries:
        overrides = request_model.overrides.get(scene.id)
        total_words += _estimate_word_target(scene, overrides)

    estimated_cost = round((total_words / 1000) * 0.02, 2)
    status_label, message, total_after = _classify_budget(
        estimated_cost,
        soft_limit=budget_state.soft_limit,
        hard_limit=budget_state.hard_limit,
        current_spend=budget_state.spent_usd,
    )

    if status_label == "blocked":
        raise_budget_error(
            message=message,
            details={
                "estimated_usd": estimated_cost,
                "total_after_usd": total_after,
                "hard_limit_usd": budget_state.hard_limit,
                "soft_limit_usd": budget_state.soft_limit,
                "spent_usd": budget_state.spent_usd,
            },
            diagnostics=diagnostics,
            project_root=project_root,
        )

    synthesizer = DraftSynthesizer()
    persistence = DraftPersistence(settings=settings)
    units: list[dict[str, Any]] = []
    for index, scene in enumerate(scene_summaries):
        overrides = request_model.overrides.get(scene.id)
        synthesis = synthesizer.synthesize(
            request=request_model,
            scene=scene,
            overrides=overrides,
            unit_index=index,
        )
        persistence.write_scene(request_model.project_id, synthesis.front_matter, synthesis.body)
        units.append(synthesis.unit)

    draft_id = f"dr_{uuid4().hex[:8]}"

    response_payload = {
        "project_id": request_model.project_id,
        "unit_scope": request_model.unit_scope.value,
        "unit_ids": request_model.unit_ids,
        "draft_id": draft_id,
        "schema_version": "DraftUnitSchema v1",
        "units": units,
        "budget": {
            "estimated_usd": estimated_cost,
            "status": status_label,
            "message": message,
            "soft_limit_usd": round(budget_state.soft_limit, 2),
            "hard_limit_usd": round(budget_state.hard_limit, 2),
            "spent_usd": round(total_after, 2),
            "total_after_usd": round(total_after, 2),
        },
    }

    budget_meta["last_request_fingerprint"] = request_fingerprint
    budget_meta["last_generate_response"] = copy.deepcopy(response_payload)

    _persist_project_budget(budget_state, total_after)

    return response_payload


@router.post("/preflight")
async def preflight_draft(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    project_root: Path | None = None
    try:
        request_model = DraftGenerateRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        if isinstance(project_id, str):
            project_root = settings.project_base_dir / project_id
        raise_validation_error(
            message="Invalid draft preflight request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    project_root = settings.project_base_dir / request_model.project_id
    try:
        outline = _load_outline_artifact(project_root)
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    try:
        scene_summaries = _resolve_requested_scenes(request_model, outline)
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    budget_state = _load_project_budget_state(project_root, diagnostics)

    total_words = 0
    for scene in scene_summaries:
        overrides = request_model.overrides.get(scene.id)
        total_words += _estimate_word_target(scene, overrides)

    estimated_cost = round((total_words / 1000) * 0.02, 2)
    status_label, message, total_after = _classify_budget(
        estimated_cost,
        soft_limit=budget_state.soft_limit,
        hard_limit=budget_state.hard_limit,
        current_spend=budget_state.spent_usd,
    )

    synthesizer = DraftSynthesizer()
    scenes_payload: list[dict[str, Any]] = []
    for scene in scene_summaries:
        scene_payload: dict[str, Any] = {
            "id": scene.id,
            "title": scene.title,
            "order": scene.order,
        }
        if scene.chapter_id is not None:
            scene_payload["chapter_id"] = scene.chapter_id
        if scene.beat_refs:
            scene_payload["beat_refs"] = list(scene.beat_refs)
        scenes_payload.append(scene_payload)

    return {
        "project_id": request_model.project_id,
        "unit_scope": request_model.unit_scope.value,
        "unit_ids": request_model.unit_ids,
        "model": dict(synthesizer._MODEL),
        "scenes": scenes_payload,
        "budget": {
            "estimated_usd": estimated_cost,
            "status": status_label,
            "message": message,
            "soft_limit_usd": round(budget_state.soft_limit, 2),
            "hard_limit_usd": round(budget_state.hard_limit, 2),
            "spent_usd": round(budget_state.spent_usd, 2),
            "total_after_usd": round(total_after, 2),
        },
    }


@router.post("/rewrite")
async def rewrite_draft(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
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

    if _normalize_markdown(current_body) != _normalize_markdown(request_model.unit.text):
        raise_conflict_error(
            message="The scene on disk no longer matches the submitted draft unit.",
            details={"unit_id": request_model.unit_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    revised_text = request_model.new_text
    if revised_text is None:
        revised_text = _apply_rewrite_instructions(current_body, request_model.instructions)

    normalized_revised = _normalize_markdown(revised_text)
    if not normalized_revised:
        raise_validation_error(
            message="Revised text must not be empty.",
            details={"unit_id": request_model.unit_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    diff_payload = compute_diff(_normalize_markdown(current_body), normalized_revised)

    updated_front_matter = _merge_meta(front_matter, request_model.unit.meta)
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
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    critique_service: CritiqueService = Depends(get_critique_service),
) -> dict[str, Any]:
    try:
        request_model = DraftCritiqueRequest.model_validate(payload)
    except ValidationError as exc:
        raise_validation_error(
            message="Invalid draft critique request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=None,
        )

    try:
        return critique_service.run(request_model)
    except RuntimeError as exc:
        raise_service_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL",
            message="Failed to produce critique.",
            details={"error": str(exc)},
            diagnostics=diagnostics,
            project_root=None,
        )


@router.post("/accept")
async def accept_draft(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    snapshot_persistence: SnapshotPersistence = Depends(get_snapshot_persistence),
    recovery_tracker: "RecoveryTracker" = Depends(get_recovery_tracker),
) -> dict[str, Any]:
    try:
        request_model = DraftAcceptRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        project_root = (
            settings.project_base_dir / project_id if isinstance(project_id, str) else None
        )
        raise_validation_error(
            message="Invalid accept payload.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    project_root = settings.project_base_dir / request_model.project_id
    if not project_root.exists():
        raise_validation_error(
            message="Project root is missing.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    try:
        _, front_matter, current_body = read_scene_document(project_root, request_model.unit_id)
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    current_normalized = _normalize_markdown(current_body)
    current_digest = _compute_sha256(current_body)
    if current_digest != request_model.unit.previous_sha256:
        raise_conflict_error(
            message="The submitted draft unit is out of date.",
            details={"unit_id": request_model.unit_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    recovery_tracker.mark_in_progress(
        request_model.project_id,
        unit_id=request_model.unit_id,
        draft_id=request_model.draft_id,
        message=request_model.message,
    )

    updated_front_matter = _merge_meta(front_matter, request_model.unit.meta)
    updated_front_matter["id"] = request_model.unit_id

    persistence = DraftPersistence(settings=settings)
    try:
        normalized_text = _normalize_markdown(request_model.unit.text)
        persistence.write_scene(
            request_model.project_id,
            updated_front_matter,
            normalized_text,
        )
    except OSError as exc:
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Failed to persist accepted scene.",
            details={"unit_id": request_model.unit_id, "error": str(exc)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Failed to persist accepted scene.",
                "details": {"unit_id": request_model.unit_id},
            },
        ) from exc

    diff_payload = compute_diff(current_normalized, normalized_text)

    snapshot_info = snapshot_persistence.create_snapshot(
        request_model.project_id,
        label=request_model.snapshot_label,
    )
    recovery_tracker.mark_completed(request_model.project_id, snapshot_info)

    budget_state = _load_project_budget_state(project_root, diagnostics)
    estimated_cost = request_model.unit.estimated_cost_usd or 0.0
    _persist_project_budget(budget_state, budget_state.spent_usd + estimated_cost)

    return {
        "project_id": request_model.project_id,
        "unit_id": request_model.unit_id,
        "status": "accepted",
        "snapshot": snapshot_info,
        "diff": {
            "added": diff_payload.added,
            "removed": diff_payload.removed,
            "changed": diff_payload.changed,
            "anchors": diff_payload.anchors,
        },
        "budget": {
            "soft_limit_usd": round(budget_state.soft_limit, 2),
            "hard_limit_usd": round(budget_state.hard_limit, 2),
            "spent_usd": round(budget_state.spent_usd + estimated_cost, 2),
        },
        "schema_version": "DraftAcceptResult v1",
    }


@router.post("/wizard/lock")
async def lock_wizard_step(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    snapshot_persistence: SnapshotPersistence = Depends(get_snapshot_persistence),
) -> dict[str, Any]:
    """Create a snapshot when a Wizard step is locked."""

    try:
        request_model = WizardLockSnapshotRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        project_root = (
            settings.project_base_dir / project_id if isinstance(project_id, str) else None
        )
        raise_validation_error(
            message="Invalid wizard lock payload.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    project_root = settings.project_base_dir / request_model.project_id
    if not project_root.exists():
        raise_validation_error(
            message="Project root is missing.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    label = request_model.label or f"wizard-{request_model.step}"
    include_entries = request_model.includes or None

    try:
        snapshot_info = snapshot_persistence.create_snapshot(
            request_model.project_id,
            label=label,
            include_entries=include_entries,
        )
    except OSError as exc:
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Failed to create wizard snapshot.",
            details={"step": request_model.step, "error": str(exc)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Failed to create wizard snapshot.",
                "details": {"step": request_model.step},
            },
        ) from exc

    diagnostics.log(
        project_root,
        code="SNAPSHOT",
        message=f"Wizard step {request_model.step} locked.",
        details={"step": request_model.step, "snapshot_id": snapshot_info.get("snapshot_id")},
    )

    return snapshot_info


@router.post("/export")
async def export_manuscript(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    try:
        request_model = DraftExportRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        project_root = (
            settings.project_base_dir / project_id if isinstance(project_id, str) else None
        )
        raise_validation_error(
            message="Invalid export request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    project_root = settings.project_base_dir / request_model.project_id
    if not project_root.exists():
        raise_validation_error(
            message="Project root is missing.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    try:
        outline = _load_outline_artifact(project_root)
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    try:
        manuscript, chapter_count, scene_count = _compile_manuscript(
            project_root,
            outline,
            include_meta_header=request_model.include_meta_header,
        )
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    target_path = project_root / "draft_full.md"
    try:
        write_text_atomic(target_path, manuscript)
    except OSError as exc:
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Failed to write draft_full.md.",
            details={"error": str(exc)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Failed to write draft_full.md.",
                "details": {"project_id": request_model.project_id},
            },
        ) from exc

    try:
        relative_path = target_path.relative_to(project_root)
        export_path = to_posix(relative_path)
    except ValueError:
        export_path = to_posix(target_path)

    return {
        "project_id": request_model.project_id,
        "path": export_path,
        "chapters": chapter_count,
        "scenes": scene_count,
        "meta_header": request_model.include_meta_header,
        "exported_at": utc_timestamp(),
        "schema_version": "DraftExportResult v1",
    }
