"""Service helpers for draft generation workflows."""

from __future__ import annotations

import asyncio
import copy
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Sequence
from uuid import uuid4

from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..draft_synthesizer import DraftSynthesizer
from ..heuristics import load_project_heuristics
from ..analytics.runtime import log_runtime_event
from ..http import raise_budget_error
from ..models.draft import DraftGenerateRequest, DraftUnitOverrides, DraftUnitScope
from ..models.outline import OutlineArtifact, OutlineScene
from ..persistence import DraftPersistence
from ..scene_docs import DraftRequestError
from .budget_service import BudgetService, BudgetSummary
from ..constants import DEFAULT_SOFT_BUDGET_LIMIT_USD


@dataclass(slots=True)
class DraftGenerationResult:
    """Response payload for a draft generation request."""

    response: dict[str, Any]


@dataclass(slots=True)
class DraftPreflightResult:
    """Projected budget and scene metadata for a draft generation request."""

    payload: dict[str, Any]


class DraftGenerationTimeoutError(RuntimeError):
    """Raised when draft generation helpers exceed the configured timeout."""


def resolve_requested_scenes(
    request_model: DraftGenerateRequest, outline: OutlineArtifact
) -> list[OutlineScene]:
    """Return the outline scenes that should be generated for the request."""

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


def estimate_word_target(scene: OutlineScene, overrides: DraftUnitOverrides | None) -> int:
    """Return the estimated word target for a scene accounting for overrides."""

    if overrides and overrides.word_target is not None:
        return overrides.word_target
    order_value = overrides.order if overrides and overrides.order is not None else scene.order
    return 850 + (order_value * 40)


def fingerprint_generate_request(
    request: DraftGenerateRequest, scenes: Sequence[OutlineScene]
) -> str:
    """Return a deterministic fingerprint for draft generation caching."""

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


class DraftGenerationService:
    """Coordinate scene synthesis, caching, and persistence for draft generation."""

    def __init__(
        self,
        *,
        settings: ServiceSettings,
        diagnostics: DiagnosticLogger,
    ) -> None:
        self._settings = settings
        self._diagnostics = diagnostics
        self._persistence = DraftPersistence(settings=settings, durable_writes=False)
        self._timeout_seconds = getattr(settings, "draft_task_timeout_seconds", 120)
        self._retry_attempts = max(0, int(getattr(settings, "draft_task_retry_attempts", 1)))
        self._budget_service = BudgetService(settings=settings, diagnostics=diagnostics)

    async def generate(
        self,
        request: DraftGenerateRequest,
        scenes: Sequence[OutlineScene],
        *,
        project_root: Path,
    ) -> DraftGenerationResult:
        """Generate draft units for the provided request."""

        budget_state = self._budget_service.load_state(project_root)
        budget_meta = budget_state.metadata.setdefault("budget", {})

        request_fingerprint = fingerprint_generate_request(request, scenes)
        cached_response = budget_meta.get("last_generate_response")

        if (
            budget_meta.get("last_request_fingerprint") == request_fingerprint
            and isinstance(cached_response, dict)
        ):
            rehydrated = await self._rehydrate_cached_artifacts(
                request.project_id,
                project_root=project_root,
                budget_meta=budget_meta,
            )
            if rehydrated:
                return DraftGenerationResult(response=copy.deepcopy(cached_response))
            budget_meta.pop("last_generate_response", None)
            budget_meta.pop("last_generate_artifacts", None)

        total_words = 0
        for scene in scenes:
            overrides = request.overrides.get(scene.id)
            total_words += estimate_word_target(scene, overrides)

        estimated_cost = round((total_words / 1000) * 0.02, 2)
        status_label, message, total_after = self._budget_service.classify(
            state=budget_state,
            estimated_cost=estimated_cost,
        )
        summary = self._budget_service.build_summary(
            state=budget_state,
            estimated_cost=estimated_cost,
            total_after=total_after,
            spent_override=budget_state.spent_usd,
            status=status_label,
            message=message,
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
                diagnostics=self._diagnostics,
                project_root=project_root,
            )

        synthesizer = self._create_synthesizer(project_root)
        response_payload, artifacts = await self._run_with_timeout(
            self._execute_generation,
            request,
            list(scenes),
            estimated_cost,
            summary,
            synthesizer,
            project_root=project_root,
        )

        budget_meta["last_request_fingerprint"] = request_fingerprint
        budget_meta["last_generate_response"] = copy.deepcopy(response_payload)
        budget_meta["last_generate_artifacts"] = artifacts

        self._budget_service.persist_spend(budget_state, budget_state.spent_usd)
        self._log_runtime_event(project_root, request, response_payload["units"], estimated_cost)

        return DraftGenerationResult(response=response_payload)

    async def _rehydrate_cached_artifacts(
        self,
        project_id: str,
        *,
        project_root: Path,
        budget_meta: dict[str, Any],
    ) -> bool:
        artifacts = budget_meta.get("last_generate_artifacts")
        if not isinstance(artifacts, list) or not artifacts:
            return False

        def _restore() -> None:
            total = len(artifacts)
            for index, item in enumerate(artifacts):
                if not isinstance(item, dict):
                    raise ValueError("Cached artifact entry is malformed.")
                front_matter = item.get("front_matter")
                body = item.get("body")
                if not isinstance(front_matter, dict) or not isinstance(body, str):
                    raise ValueError("Cached artifact entry is malformed.")
                durable_flag = bool(item.get("durable")) if "durable" in item else index == (
                    total - 1
                )
                self._persistence.write_scene(
                    project_id,
                    front_matter,
                    body,
                    durable=durable_flag,
                )

        try:
            await asyncio.to_thread(_restore)
        except (OSError, ValueError) as exc:
            self._diagnostics.log(
                project_root,
                code="INTERNAL",
                message="Failed to rehydrate cached draft artifacts. Regenerating.",
                details={"error": str(exc)},
            )
            return False
        return True

    async def preflight(
        self,
        request: DraftGenerateRequest,
        scenes: Sequence[OutlineScene],
        *,
        project_root: Path,
    ) -> DraftPreflightResult:
        """Return cost projections and metadata for a draft request."""

        budget_state = self._budget_service.load_state(project_root)

        synthesizer = self._create_synthesizer(project_root)
        payload = await self._run_with_timeout(
            self._compute_preflight_payload,
            request,
            list(scenes),
            budget_state,
            synthesizer,
            project_root=project_root,
        )
        return DraftPreflightResult(payload=payload)

    def _create_synthesizer(self, project_root: Path | None) -> DraftSynthesizer:
        heuristics = load_project_heuristics(project_root)
        return DraftSynthesizer(heuristics=heuristics)

    def _execute_generation(
        self,
        request: DraftGenerateRequest,
        scenes: list[OutlineScene],
        estimated_cost: float,
        summary: BudgetSummary,
        synthesizer: DraftSynthesizer,
    ) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        units: list[dict[str, Any]] = []
        artifacts: list[dict[str, Any]] = []
        total_scenes = len(scenes)

        for index, scene in enumerate(scenes):
            overrides = request.overrides.get(scene.id)
            synthesis = synthesizer.synthesize(
                request=request,
                scene=scene,
                overrides=overrides,
                unit_index=index,
            )
            durable_write = index == (total_scenes - 1)
            self._persistence.write_scene(
                request.project_id,
                synthesis.front_matter,
                synthesis.body,
                durable=durable_write,
            )
            units.append(synthesis.unit)
            artifacts.append(
                {
                    "scene_id": scene.id,
                    "front_matter": copy.deepcopy(synthesis.front_matter),
                    "body": synthesis.body,
                    "durable": durable_write,
                }
            )

        draft_id = f"dr_{uuid4().hex[:8]}"

        response_payload = {
            "project_id": request.project_id,
            "unit_scope": request.unit_scope.value,
            "unit_ids": request.unit_ids,
            "draft_id": draft_id,
            "schema_version": "DraftUnitSchema v1",
            "units": units,
            "budget": summary.as_dict(),
        }

        return response_payload, artifacts

    def _compute_preflight_payload(
        self,
        request: DraftGenerateRequest,
        scenes: list[OutlineScene],
        budget_state,
        synthesizer: DraftSynthesizer,
    ) -> dict[str, Any]:
        total_words = 0
        for scene in scenes:
            overrides = request.overrides.get(scene.id)
            total_words += estimate_word_target(scene, overrides)

        estimated_cost = round((total_words / 1000) * 0.02, 2)
        status_label, message, total_after = self._budget_service.classify(
            state=budget_state,
            estimated_cost=estimated_cost,
        )
        summary = self._budget_service.build_summary(
            state=budget_state,
            estimated_cost=estimated_cost,
            total_after=total_after,
            spent_override=budget_state.spent_usd,
            status=status_label,
            message=message,
        )

        scenes_payload: list[dict[str, Any]] = []
        for scene in scenes:
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
            "project_id": request.project_id,
            "unit_scope": request.unit_scope.value,
            "unit_ids": request.unit_ids,
            "model": dict(synthesizer._MODEL),
            "scenes": scenes_payload,
            "budget": summary.as_dict(),
        }

    def _log_runtime_event(self, project_root: Path, request: DraftGenerateRequest, units: list[dict[str, Any]], estimated_cost: float) -> None:
        total_tokens = sum(len(unit.get("text", "").split()) for unit in units)
        hint = "cheap"
        if estimated_cost >= DEFAULT_SOFT_BUDGET_LIMIT_USD * 0.5:
            hint = "expensive"
        event = {
            "service": "draft_generate",
            "project_id": request.project_id,
            "unit_scope": request.unit_scope.value,
            "unit_count": len(units),
            "estimated_usd": round(estimated_cost, 2),
            "tokens": total_tokens,
            "mode": "local" if request.unit_scope is DraftUnitScope.SCENE else "batch",
            "hint": hint,
        }
        try:
            log_runtime_event(project_root, event)
        except Exception as exc:
            self._diagnostics.log(
                project_root,
                code="ANALYTICS",
                message="Failed to record analytics runtime event.",
                details={"error": str(exc)},
            )

    async def _run_with_timeout(self, func, *args, project_root: Path | None = None) -> Any:
        timeout = max(5, int(self._timeout_seconds))
        attempts = max(1, int(self._retry_attempts) + 1)
        last_error: Exception | None = None
        diagnostics_root = project_root or Path(self._settings.project_base_dir)

        for attempt in range(attempts):
            try:
                async with asyncio.timeout(timeout):
                    return await asyncio.to_thread(func, *args)
            except asyncio.TimeoutError as exc:
                last_error = DraftGenerationTimeoutError(str(exc))
                self._diagnostics.log(
                    diagnostics_root,
                    code="TIMEOUT",
                    message="Draft task exceeded timeout.",
                    details={"attempt": attempt + 1, "timeout_seconds": timeout},
                )
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                last_error = exc
                self._diagnostics.log(
                    diagnostics_root,
                    code="INTERNAL",
                    message="Draft task failed.",
                    details={"attempt": attempt + 1, "error": str(exc)},
                )
            await asyncio.sleep(0)

        assert last_error is not None
        raise last_error


__all__ = [
    "DraftGenerationResult",
    "DraftPreflightResult",
    "DraftGenerationTimeoutError",
    "DraftGenerationService",
    "estimate_word_target",
    "fingerprint_generate_request",
    "resolve_requested_scenes",
]
