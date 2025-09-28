"""FastAPI application object for the Black Skies service stack."""

from __future__ import annotations

import asyncio
import copy
import hashlib
import json
import logging
import shutil
import os
from contextlib import asynccontextmanager
from importlib import resources
from pathlib import Path
from dataclasses import dataclass
from typing import Any, AsyncIterator, Final, cast
from uuid import uuid4

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status
from pydantic import ValidationError

from .config import ServiceSettings
from .diagnostics import DiagnosticLogger
from .diff_engine import compute_diff
from .draft_synthesizer import DraftSynthesizer
from .models.draft import DraftGenerateRequest, DraftUnitOverrides, DraftUnitScope
from .models.outline import OutlineArtifact, OutlineScene
from .models.project import ProjectMetadata
from .models.rewrite import DraftRewriteRequest
from .models.wizard import OutlineBuildRequest
from .outline_builder import MissingLocksError, OutlineBuilder
from .persistence import DraftPersistence, OutlinePersistence

LOGGER = logging.getLogger(__name__)

SERVICE_VERSION: Final[str] = "0.1.0"
_FIXTURE_PACKAGE: Final[str] = "blackskies.services.fixtures"
SOFT_BUDGET_LIMIT_USD: Final[float] = 5.0
HARD_BUDGET_LIMIT_USD: Final[float] = 10.0


@dataclass
class ProjectBudgetState:
    """Current budget configuration resolved from ``project.json``."""

    project_root: Path
    metadata: dict[str, Any]
    soft_limit: float
    hard_limit: float
    spent_usd: float
    project_path: Path


def _load_fixture(name: str) -> dict[str, Any]:
    """Load a JSON fixture bundled with the package."""

    try:
        fixture_path = resources.files(_FIXTURE_PACKAGE).joinpath(name)
    except (
        FileNotFoundError,
        ModuleNotFoundError,
    ) as exc:  # pragma: no cover - importlib guards
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


class BuildInProgressError(RuntimeError):
    """Raised when a project already has an active outline build."""

    def __init__(self, project_id: str) -> None:
        super().__init__(f"Outline build already running for project {project_id}.")
        self.project_id = project_id


class BuildTracker:
    """Coordinate outline build concurrency per project."""

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._active: set[str] = set()

    async def begin(self, project_id: str) -> None:
        """Mark a project as actively building an outline."""

        async with self._lock:
            if project_id in self._active:
                raise BuildInProgressError(project_id)
            self._active.add(project_id)

    async def end(self, project_id: str) -> None:
        """Release an outline build reservation for the project."""

        async with self._lock:
            self._active.discard(project_id)

    @asynccontextmanager
    async def track(self, project_id: str) -> AsyncIterator[None]:
        """Async context manager for outline build reservations."""

        await self.begin(project_id)
        try:
            yield
        finally:
            await self.end(project_id)


def get_settings(request: Request) -> ServiceSettings:
    """Retrieve the shared service settings from the FastAPI app state."""

    return cast(ServiceSettings, request.app.state.settings)


def get_build_tracker(request: Request) -> BuildTracker:
    """Retrieve the build tracker from app state."""

    return cast(BuildTracker, request.app.state.build_tracker)


def get_diagnostics(request: Request) -> DiagnosticLogger:
    """Retrieve the diagnostic logger from app state."""

    return cast(DiagnosticLogger, request.app.state.diagnostics)


class DraftRequestError(ValueError):
    """Raised when draft generation input cannot be satisfied."""

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.details = details or {}


def _sanitize_details(details: Any) -> Any:
    """Convert exception instances inside details into serialisable values."""

    if isinstance(details, Exception):
        return str(details)
    if isinstance(details, dict):
        return {key: _sanitize_details(value) for key, value in details.items()}
    if isinstance(details, list):
        return [_sanitize_details(item) for item in details]
    return details


def _load_outline_artifact(project_root: Path) -> OutlineArtifact:
    """Load and validate the persisted outline artifact."""

    outline_path = project_root / "outline.json"
    if not outline_path.exists():
        raise DraftRequestError(
            "Outline artifact is missing.", {"path": str(outline_path)}
        )

    try:
        with outline_path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except json.JSONDecodeError as exc:
        raise DraftRequestError(
            "Outline artifact contains invalid JSON.", {"path": str(outline_path)}
        ) from exc

    try:
        return OutlineArtifact.model_validate(payload)
    except ValidationError as exc:
        raise DraftRequestError(
            "Outline artifact failed schema validation.",
            {"path": str(outline_path), "errors": exc.errors()},
        ) from exc


def _parse_front_matter_value(value: str) -> Any:
    """Best-effort parsing of front-matter scalar values."""

    candidate = value.strip()
    if candidate == "":
        return ""
    lowered = candidate.lower()
    if lowered == "null":
        return None
    if lowered in {"true", "false"}:
        return lowered == "true"
    if lowered.isdigit() or (lowered.startswith("-") and lowered[1:].isdigit()):
        return int(lowered)
    if _looks_like_float(candidate):
        try:
            return float(candidate)
        except ValueError:
            pass
    if candidate.startswith("[") and candidate.endswith("]"):
        inner = candidate[1:-1].strip()
        if not inner:
            return []
        parts = [part.strip() for part in inner.split(",") if part.strip()]
        normalized: list[str] = []
        for fragment in parts:
            token = fragment.strip()
            if len(token) >= 2 and token[0] in {'"', "'"} and token[-1] == token[0]:
                token = token[1:-1]
            normalized.append(token)
        return normalized
    return candidate


def _looks_like_float(value: str) -> bool:
    stripped = value.replace("_", "")
    if stripped.count(".") != 1:
        return False
    left, right = stripped.split(".", 1)
    if left in {"", "-"}:
        return False
    return left.lstrip("-").isdigit() and right.isdigit()


def _read_scene_document(
    project_root: Path, unit_id: str
) -> tuple[Path, dict[str, Any], str]:
    """Load front-matter and body for the given scene markdown."""

    drafts_dir = project_root / "drafts"
    target_path = drafts_dir / f"{unit_id}.md"
    if not target_path.exists():
        raise DraftRequestError("Scene markdown is missing.", {"unit_id": unit_id})

    content = target_path.read_text(encoding="utf-8")
    lines = content.splitlines()
    if not lines or lines[0].strip() != "---":
        raise DraftRequestError(
            "Scene markdown is missing front-matter header.", {"unit_id": unit_id}
        )

    front_lines: list[str] = []
    index = 1
    while index < len(lines) and lines[index].strip() != "---":
        front_lines.append(lines[index])
        index += 1
    if index == len(lines):
        raise DraftRequestError(
            "Scene markdown is missing front-matter terminator.", {"unit_id": unit_id}
        )

    body = "\n".join(lines[index + 1 :])

    front_matter: dict[str, Any] = {}
    for line in front_lines:
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        front_matter[key.strip()] = _parse_front_matter_value(value)

    scene_id = front_matter.get("id")
    if scene_id != unit_id:
        raise DraftRequestError(
            "Scene markdown id does not match unit id.", {"unit_id": unit_id}
        )

    return target_path, front_matter, body


def _normalize_markdown(value: str) -> str:
    """Normalize markdown text for comparisons."""

    return value.replace("\r\n", "\n").strip()


def _merge_meta(front_matter: dict[str, Any], meta: dict[str, Any]) -> dict[str, Any]:
    """Overlay meta fields onto existing front-matter."""

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
    """Produce deterministic rewrite text from instructions when new_text is absent."""

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


def _raise_conflict_error(
    *,
    message: str,
    details: dict[str, Any],
    diagnostics: DiagnosticLogger,
    project_root: Path | None,
) -> None:
    """Log and raise a conflict response."""

    safe_details = _sanitize_details(details)
    if project_root is not None:
        diagnostics.log(
            project_root, code="CONFLICT", message=message, details=safe_details
        )
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={"code": "CONFLICT", "message": message, "details": safe_details},
    )


def _resolve_requested_scenes(
    request_model: DraftGenerateRequest, outline: OutlineArtifact
) -> list[OutlineScene]:
    """Resolve requested unit identifiers to concrete scene summaries."""

    scenes_by_id = {scene.id: scene for scene in outline.scenes}

    if request_model.unit_scope is DraftUnitScope.SCENE:
        missing = [
            scene_id
            for scene_id in request_model.unit_ids
            if scene_id not in scenes_by_id
        ]
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

    chapter_scenes = [
        scene for scene in outline.scenes if scene.chapter_id == chapter_id
    ]
    if not chapter_scenes:
        raise DraftRequestError(
            "Requested chapter has no scenes available for drafting.",
            {"chapter_id": chapter_id},
        )

    chapter_scenes.sort(key=lambda scene: scene.order)
    return chapter_scenes


def _compute_draft_id(project_id: str, seed: int | None, scene_ids: list[str]) -> str:
    """Derive a deterministic draft identifier from the request context."""

    payload = json.dumps(
        {"project_id": project_id, "seed": seed, "scene_ids": scene_ids}, sort_keys=True
    ).encode("utf-8")
    digest = hashlib.sha256(payload).hexdigest()
    numeric = int(digest[:6], 16) % 1000
    return f"dr_{numeric:03d}"


def _estimate_word_target(
    scene: OutlineScene, overrides: DraftUnitOverrides | None
) -> int:
    """Estimate the word target for a scene using overrides when supplied."""

    if overrides and overrides.word_target is not None:
        return overrides.word_target
    order_value = (
        overrides.order if overrides and overrides.order is not None else scene.order
    )
    return 850 + (order_value * 40)


def _load_project_budget_state(
    project_root: Path, diagnostics: DiagnosticLogger
) -> ProjectBudgetState:
    """Load project budget configuration with graceful fallbacks."""

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
                details={"path": str(project_path), "error": str(exc)},
            )
            payload = copy.deepcopy(base_payload)
        else:
            try:
                metadata = ProjectMetadata.model_validate(payload)
            except ValidationError as exc:
                diagnostics.log(
                    project_root,
                    code="VALIDATION",
                    message="Project metadata failed validation; using defaults.",
                    details={"path": str(project_path), "errors": exc.errors()},
                )
                payload = ProjectMetadata.model_validate(base_payload).model_dump(
                    mode="json"
                )
            else:
                payload = metadata.model_dump(mode="json")
    else:
        payload = ProjectMetadata.model_validate(base_payload).model_dump(mode="json")

    budget_section = payload.get("budget", {})
    soft_limit = float(budget_section.get("soft", SOFT_BUDGET_LIMIT_USD))
    hard_limit = float(budget_section.get("hard", HARD_BUDGET_LIMIT_USD))
    spent_usd = float(budget_section.get("spent_usd", 0.0))

    if hard_limit < 0:
        hard_limit = HARD_BUDGET_LIMIT_USD
    if soft_limit < 0:
        soft_limit = SOFT_BUDGET_LIMIT_USD

    effective_hard = hard_limit if hard_limit > 0 else HARD_BUDGET_LIMIT_USD

    return ProjectBudgetState(
        project_root=project_root,
        metadata=payload,
        soft_limit=soft_limit if soft_limit <= effective_hard else effective_hard,
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
    """Classify the post-run budget status."""

    effective_hard_limit = hard_limit if hard_limit > 0 else HARD_BUDGET_LIMIT_USD
    effective_soft_limit = (
        soft_limit if 0 <= soft_limit <= effective_hard_limit else effective_hard_limit
    )

    total_after_run = round(current_spend + estimated_cost, 2)

    if total_after_run >= effective_hard_limit:
        return (
            "blocked",
            f"Estimated total ${total_after_run:.2f} exceeds hard limit ${effective_hard_limit:.2f}.",
            total_after_run,
        )
    if total_after_run >= effective_soft_limit:
        return (
            "soft-limit",
            f"Estimated total ${total_after_run:.2f} exceeds soft limit ${effective_soft_limit:.2f}.",
            total_after_run,
        )
    return "ok", "Estimate within budget.", total_after_run


def _persist_project_budget(state: ProjectBudgetState, new_spent_usd: float) -> None:
    """Persist updated budget totals to ``project.json`` atomically."""

    payload = copy.deepcopy(state.metadata)
    budget_section = payload.setdefault("budget", {})
    budget_section["soft"] = round(state.soft_limit, 2)
    budget_section["hard"] = round(state.hard_limit, 2)
    budget_section["spent_usd"] = round(max(new_spent_usd, 0.0), 2)

    payload.setdefault("project_id", state.project_root.name)

    serialized = json.dumps(payload, indent=2, ensure_ascii=False)

    state.project_root.mkdir(parents=True, exist_ok=True)
    temp_path = (
        state.project_path.parent / f".{state.project_path.name}.{uuid4().hex}.tmp"
    )
    with temp_path.open("w", encoding="utf-8") as handle:
        handle.write(serialized)
        handle.flush()
        os.fsync(handle.fileno())

    temp_path.replace(state.project_path)


def _raise_budget_error(
    *,
    message: str,
    details: dict[str, Any],
    diagnostics: DiagnosticLogger,
    project_root: Path | None,
) -> None:
    """Raise a ``BUDGET_EXCEEDED`` error and log it."""

    safe_details = _sanitize_details(details)
    if project_root is not None:
        diagnostics.log(
            project_root,
            code="BUDGET_EXCEEDED",
            message=message,
            details=safe_details,
        )
    raise HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail={"code": "BUDGET_EXCEEDED", "message": message, "details": safe_details},
    )


def _raise_validation_error(
    *,
    message: str,
    details: dict[str, Any],
    diagnostics: DiagnosticLogger,
    project_root: Path | None,
) -> None:
    """Raise a validation error and optionally log diagnostics."""

    safe_details = _sanitize_details(details)
    if project_root is not None:
        diagnostics.log(
            project_root, code="VALIDATION", message=message, details=safe_details
        )
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"code": "VALIDATION", "message": message, "details": safe_details},
    )


def get_outline_builder() -> OutlineBuilder:
    """Provide an outline builder instance."""

    return OutlineBuilder()


def get_persistence(
    settings: ServiceSettings = Depends(get_settings),
) -> OutlinePersistence:
    """Provide an outline persistence helper bound to the current settings."""

    return OutlinePersistence(settings=settings)


def _register_routes(api: FastAPI) -> None:
    """Attach all routers to the provided FastAPI app."""

    @api.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        """Simple readiness probe for the desktop app."""

        return {"status": "ok", "version": SERVICE_VERSION}

    outline_router = APIRouter(prefix="/outline", tags=["outline"])

    @outline_router.post("/build")
    async def build_outline(
        request_model: OutlineBuildRequest,
        tracker: BuildTracker = Depends(get_build_tracker),
        builder: OutlineBuilder = Depends(get_outline_builder),
        persistence: OutlinePersistence = Depends(get_persistence),
        diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    ) -> dict[str, Any]:
        """Build, validate, and persist an outline artifact."""

        project_root = persistence.ensure_project_root(request_model.project_id)

        try:
            async with tracker.track(request_model.project_id):
                outline = builder.build(request_model)
                persistence.write_outline(request_model.project_id, outline)
                response_payload = outline.model_dump(mode="json")
        except BuildInProgressError as exc:
            LOGGER.warning(
                "Outline build conflict for project %s", request_model.project_id
            )
            diagnostics.log(
                project_root,
                code="CONFLICT",
                message="Outline build already running.",
                details={"project_id": request_model.project_id},
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "CONFLICT",
                    "message": "An outline build is already in progress for this project.",
                    "details": {"project_id": request_model.project_id},
                },
            ) from exc
        except MissingLocksError as exc:
            LOGGER.warning(
                "Outline build missing locks for project %s", request_model.project_id
            )
            diagnostics.log(
                project_root,
                code="VALIDATION",
                message=str(exc),
                details={"project_id": request_model.project_id, **exc.details},
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "VALIDATION",
                    "message": str(exc),
                    "details": {"project_id": request_model.project_id, **exc.details},
                },
            ) from exc
        except ValidationError as exc:
            LOGGER.exception(
                "Outline validation failed for project %s", request_model.project_id
            )
            diagnostics.log(
                project_root,
                code="VALIDATION",
                message="OutlineSchema validation failed.",
                details={
                    "project_id": request_model.project_id,
                    "errors": exc.errors(),
                },
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "VALIDATION",
                    "message": "Generated outline failed schema validation.",
                    "details": {"project_id": request_model.project_id},
                },
            ) from exc

        return response_payload

    api.include_router(outline_router)

    draft_router = APIRouter(prefix="/draft", tags=["draft"])

    @draft_router.post("/generate")
    async def generate_draft(
        payload: dict[str, Any],
        settings: ServiceSettings = Depends(get_settings),
        diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    ) -> dict[str, Any]:
        """Generate draft units using deterministic synthesis."""

        project_root: Path | None = None
        try:
            request_model = DraftGenerateRequest.model_validate(payload)
        except ValidationError as exc:
            project_id = (
                payload.get("project_id") if isinstance(payload, dict) else None
            )
            if isinstance(project_id, str):
                project_root = settings.project_base_dir / project_id
            _raise_validation_error(
                message="Invalid draft generation request.",
                details={"errors": exc.errors()},
                diagnostics=diagnostics,
                project_root=project_root,
            )

        project_root = settings.project_base_dir / request_model.project_id
        try:
            outline = _load_outline_artifact(project_root)
        except DraftRequestError as exc:
            _raise_validation_error(
                message=str(exc),
                details=exc.details,
                diagnostics=diagnostics,
                project_root=project_root,
            )

        try:
            scene_summaries = _resolve_requested_scenes(request_model, outline)
        except DraftRequestError as exc:
            _raise_validation_error(
                message=str(exc),
                details=exc.details,
                diagnostics=diagnostics,
                project_root=project_root,
            )

        budget_state = _load_project_budget_state(project_root, diagnostics)
        synthesizer = DraftSynthesizer()
        overrides = request_model.overrides
        results = [
            synthesizer.synthesize(
                request=request_model,
                scene=scene,
                overrides=overrides.get(scene.id),
                unit_index=index,
            )
            for index, scene in enumerate(scene_summaries)
        ]

        scene_ids = [scene.id for scene in scene_summaries]
        draft_id = _compute_draft_id(
            request_model.project_id, request_model.seed, scene_ids
        )
        total_words = sum(
            int(result.unit["meta"].get("word_target", 0)) for result in results
        )
        estimated_cost = round((total_words / 1000) * 0.02, 2)

        status_label, message, total_after = _classify_budget(
            estimated_cost,
            soft_limit=budget_state.soft_limit,
            hard_limit=budget_state.hard_limit,
            current_spend=budget_state.spent_usd,
        )

        if status_label == "blocked":
            _raise_budget_error(
                message=message,
                details={
                    "estimated_usd": estimated_cost,
                    "spent_before_usd": round(budget_state.spent_usd, 2),
                    "total_after_usd": total_after,
                    "hard_limit_usd": round(budget_state.hard_limit, 2),
                },
                diagnostics=diagnostics,
                project_root=project_root,
            )

        persistence = DraftPersistence(settings=settings)
        for result in results:
            persistence.write_scene(
                request_model.project_id, result.front_matter, result.body
            )

        try:
            _persist_project_budget(budget_state, total_after)
        except OSError as exc:
            diagnostics.log(
                project_root,
                code="INTERNAL",
                message="Failed to update project budget.",
                details={"project_id": request_model.project_id, "error": str(exc)},
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "code": "INTERNAL",
                    "message": "Failed to update project budget.",
                    "details": {"project_id": request_model.project_id},
                },
            ) from exc

        budget_payload = {
            "estimated_usd": estimated_cost,
            "status": status_label,
            "message": message,
            "soft_limit_usd": round(budget_state.soft_limit, 2),
            "hard_limit_usd": round(budget_state.hard_limit, 2),
            "spent_usd": round(total_after, 2),
        }

        return {
            "draft_id": draft_id,
            "schema_version": "DraftUnitSchema v1",
            "units": [result.unit for result in results],
            "budget": budget_payload,
        }

    @draft_router.post("/preflight")
    async def preflight_draft(
        payload: dict[str, Any],
        settings: ServiceSettings = Depends(get_settings),
        diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    ) -> dict[str, Any]:
        """Return an estimate for draft generation costs without writing files."""

        project_root: Path | None = None
        try:
            request_model = DraftGenerateRequest.model_validate(payload)
        except ValidationError as exc:
            project_id = (
                payload.get("project_id") if isinstance(payload, dict) else None
            )
            if isinstance(project_id, str):
                project_root = settings.project_base_dir / project_id
            _raise_validation_error(
                message="Invalid draft preflight request.",
                details={"errors": exc.errors()},
                diagnostics=diagnostics,
                project_root=project_root,
            )

        project_root = settings.project_base_dir / request_model.project_id
        try:
            outline = _load_outline_artifact(project_root)
        except DraftRequestError as exc:
            _raise_validation_error(
                message=str(exc),
                details=exc.details,
                diagnostics=diagnostics,
                project_root=project_root,
            )

        try:
            scene_summaries = _resolve_requested_scenes(request_model, outline)
        except DraftRequestError as exc:
            _raise_validation_error(
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

    @draft_router.post("/rewrite")
    async def rewrite_draft(
        payload: dict[str, Any],
        settings: ServiceSettings = Depends(get_settings),
        diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    ) -> dict[str, Any]:
        """Rewrite a single draft unit and persist the revised markdown."""

        project_root: Path | None = None
        try:
            request_model = DraftRewriteRequest.model_validate(payload)
        except ValidationError as exc:
            project_id = (
                payload.get("project_id") if isinstance(payload, dict) else None
            )
            if isinstance(project_id, str):
                project_root = settings.project_base_dir / project_id
            _raise_validation_error(
                message="Invalid draft rewrite request.",
                details={"errors": exc.errors()},
                diagnostics=diagnostics,
                project_root=project_root,
            )

        project_root = settings.project_base_dir / request_model.project_id
        try:
            target_path, front_matter, current_body = _read_scene_document(
                project_root, request_model.unit_id
            )
        except DraftRequestError as exc:
            _raise_conflict_error(
                message=str(exc),
                details=exc.details,
                diagnostics=diagnostics,
                project_root=project_root,
            )

        if _normalize_markdown(current_body) != _normalize_markdown(
            request_model.unit.text
        ):
            _raise_conflict_error(
                message="The scene on disk no longer matches the submitted draft unit.",
                details={"unit_id": request_model.unit_id},
                diagnostics=diagnostics,
                project_root=project_root,
            )

        revised_text = request_model.new_text
        if revised_text is None:
            revised_text = _apply_rewrite_instructions(
                current_body, request_model.instructions
            )

        normalized_revised = _normalize_markdown(revised_text)
        if not normalized_revised:
            _raise_validation_error(
                message="Revised text must not be empty.",
                details={"unit_id": request_model.unit_id},
                diagnostics=diagnostics,
                project_root=project_root,
            )

        diff_payload = compute_diff(
            _normalize_markdown(current_body), normalized_revised
        )

        updated_front_matter = _merge_meta(front_matter, request_model.unit.meta)
        updated_front_matter["id"] = request_model.unit_id

        persistence = DraftPersistence(settings=settings)
        target_path = project_root / "drafts" / f"{request_model.unit_id}.md"
        backup_path: Path | None = None
        try:
            if target_path.exists():
                backup_path = (
                    target_path.parent / f".{target_path.name}.{uuid4().hex}.bak"
                )
                shutil.copyfile(target_path, backup_path)
            persistence.write_scene(
                request_model.project_id, updated_front_matter, normalized_revised
            )
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

    @draft_router.post("/critique")
    async def critique_draft() -> dict[str, Any]:
        """Return a stubbed draft critique response."""

        return _load_fixture("draft_critique.json")

    # TODO(P2_ACCEPT_PLAN Task 1-4): Insert the `/draft/accept` route implementation here
    # once docs/P2_ACCEPT_PLAN.md tasks are in progress. The handler should live
    # adjacent to the critique stub so future diffs can wire request models,
    # persistence, diagnostics, and snapshot hooks in a single location.

    api.include_router(draft_router)


def create_app(settings: ServiceSettings | None = None) -> FastAPI:
    """Construct the FastAPI application."""

    application = FastAPI(title="Black Skies Services", version=SERVICE_VERSION)
    application.state.settings = settings or ServiceSettings.from_environment()
    application.state.build_tracker = BuildTracker()
    application.state.diagnostics = DiagnosticLogger()
    _register_routes(application)
    return application


app = create_app()

__all__ = [
    "app",
    "create_app",
    "SERVICE_VERSION",
    "BuildTracker",
    "BuildInProgressError",
]
