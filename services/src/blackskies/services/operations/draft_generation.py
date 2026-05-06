"""Service helpers for draft generation workflows."""

from __future__ import annotations

import asyncio
import copy
import hashlib
import json
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from dataclasses import dataclass
from pathlib import Path
from time import perf_counter
from typing import Any, Sequence
from uuid import uuid4

from ..config import ServiceSettings
from ..canon_court import detect_candidate_ruling, persist_candidate_ruling
from ..diagnostics import DiagnosticLogger
from ..draft_synthesizer import DraftSynthesizer
from ..fracture_analysis import FractureInputs, analyze_fractures
from ..heuristics import load_project_heuristics
from ..analytics.runtime import log_runtime_event
from ..http import ensure_trace_id, raise_budget_error
from ..models.draft import DraftGenerateRequest, DraftUnitOverrides, DraftUnitScope
from ..models.outline import OutlineArtifact, OutlineScene
from ..persistence import DraftPersistence
from ..scene_docs import DraftRequestError
from .budget_service import BudgetService, BudgetSummary
from ..constants import DEFAULT_SOFT_BUDGET_LIMIT_USD
from ..model_router import (
    ModelRouter,
    ModelTask,
    ModelRouteDecision,
    format_route_metadata,
)
from ..run_policy import RunPolicyDecision, format_run_policy_metadata
from ..model_adapters import AdapterError, BaseAdapter
from ..prompt_pipeline import (
    SceneContext,
    assemble_scene_context,
    compile_draft_prompt,
    is_usable_draft,
    select_profile,
)
from ..memory_lab.ingest import persist_scene_advisory_entry
from ..memory_lab.options import MemoryLabRuntimeOptions
from ..scene_memory import (
    evaluate_continuity,
    extract_carryover,
    persist_carryover,
)

LOGGER = logging.getLogger(__name__)


def _generate_log(trace_id: str | None, message: str, **details: Any) -> None:
    LOGGER.info("[draft-generate][%s] draft-generate:%s %s", trace_id or "unknown", message, details)


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


class DraftGenerationProviderTimeoutError(RuntimeError):
    """Raised when a provider/model call exceeds its timeout."""


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
        model_router: ModelRouter | None = None,
    ) -> None:
        self._settings = settings
        self._diagnostics = diagnostics
        self._persistence = DraftPersistence(settings=settings, durable_writes=False)
        self._timeout_seconds = getattr(settings, "draft_task_timeout_seconds", 120)
        self._retry_attempts = max(0, int(getattr(settings, "draft_task_retry_attempts", 1)))
        self._budget_service = BudgetService(settings=settings, diagnostics=diagnostics)
        self._model_router = model_router
        self._last_route: ModelRouteDecision | None = None
        self._last_adapter: BaseAdapter | None = None
        self._last_policy: RunPolicyDecision | None = None

    async def generate(
        self,
        request: DraftGenerateRequest,
        scenes: Sequence[OutlineScene],
        *,
        project_root: Path,
    ) -> DraftGenerationResult:
        """Generate draft units for the provided request."""

        trace_id = ensure_trace_id()
        budget_state = self._budget_service.load_state(project_root)
        budget_meta = budget_state.metadata.setdefault("budget", {})

        request_fingerprint = fingerprint_generate_request(request, scenes)
        cached_response = budget_meta.get("last_generate_response")

        if budget_meta.get("last_request_fingerprint") == request_fingerprint and isinstance(
            cached_response, dict
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
        budget_payload = summary.as_dict()

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

        policy_decision = self._evaluate_run_policy(
            task=ModelTask.DRAFT,
            budget_status=status_label,
        )
        synthesizer = self._create_synthesizer(project_root, policy_decision=policy_decision)
        if (
            self._model_router
            and self._model_router.config.routing_metadata_enabled
            and self._last_route
        ):
            routing_payload = format_route_metadata(self._last_route)
            if self._last_policy:
                routing_payload["run_policy"] = format_run_policy_metadata(self._last_policy)
            budget_payload["routing"] = routing_payload
        if self._last_route:
            budget_meta["last_route"] = {
                "policy": self._last_route.policy.value,
                "provider": self._last_route.provider,
                "model": self._last_route.model.name,
                "fallback_used": self._last_route.fallback_used,
            }
        if self._last_policy:
            budget_meta["last_run_policy"] = format_run_policy_metadata(self._last_policy)
            self._diagnostics.log(
                project_root,
                code="POLICY",
                message="Run policy decision recorded.",
                details={
                    "task": self._last_policy.task,
                    "reason": self._last_policy.reason,
                    "budget_status": self._last_policy.budget_status,
                    "allow_local": self._last_policy.allow_local,
                    "allow_api": self._last_policy.allow_api,
                },
            )
        response_payload, artifacts = await self._run_with_timeout(
            self._execute_generation,
            request,
            list(scenes),
            estimated_cost,
            budget_payload,
            summary,
            synthesizer,
            project_root,
            unit_count=len(scenes),
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
                durable_flag = (
                    bool(item.get("durable")) if "durable" in item else index == (total - 1)
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

        trace_id = None
        try:
            from ..http import ensure_trace_id

            trace_id = ensure_trace_id()
        except Exception:
            trace_id = None

        def log_phase(phase: str, *, duration_ms: float | None = None, **details: Any) -> None:
            payload = dict(details)
            if duration_ms is not None:
                payload["duration_ms"] = round(duration_ms, 2)
            LOGGER.info("[preflight][%s] %s %s", trace_id or "unknown", phase, payload)

        preflight_started = perf_counter()
        log_phase(
            "service-start",
            project_id=request.project_id,
            unit_scope=request.unit_scope.value,
            unit_count=len(scenes),
        )

        budget_load_started = perf_counter()
        budget_state = self._budget_service.load_state(project_root)
        log_phase(
            "budget-load",
            duration_ms=(perf_counter() - budget_load_started) * 1000,
            project_id=request.project_id,
        )

        estimate_started = perf_counter()
        total_words = 0
        for scene in scenes:
            overrides = request.overrides.get(scene.id)
            total_words += estimate_word_target(scene, overrides)
        estimated_cost = round((total_words / 1000) * 0.02, 2)
        log_phase(
            "budget-estimate",
            duration_ms=(perf_counter() - estimate_started) * 1000,
            project_id=request.project_id,
            estimated_usd=estimated_cost,
        )

        classify_started = perf_counter()
        status_label, _, _ = self._budget_service.classify(
            state=budget_state,
            estimated_cost=estimated_cost,
        )
        log_phase(
            "budget-classify",
            duration_ms=(perf_counter() - classify_started) * 1000,
            project_id=request.project_id,
            status=status_label,
        )

        policy_started = perf_counter()
        policy_decision = self._evaluate_run_policy(
            task=ModelTask.DRAFT,
            budget_status=status_label,
        )
        synthesizer = self._create_synthesizer(project_root, policy_decision=policy_decision)
        log_phase(
            "provider-estimate",
            duration_ms=(perf_counter() - policy_started) * 1000,
            project_id=request.project_id,
            routing_provider=self._last_route.provider if self._last_route else None,
            routing_model=self._last_route.model.name if self._last_route else None,
        )

        payload_started = perf_counter()
        payload = await self._run_with_timeout(
            self._compute_preflight_payload,
            request,
            list(scenes),
            budget_state,
            synthesizer,
            project_root=project_root,
        )
        log_phase(
            "response-assembly",
            duration_ms=(perf_counter() - payload_started) * 1000,
            project_id=request.project_id,
            scene_count=len(scenes),
        )
        log_phase(
            "service-exit",
            duration_ms=(perf_counter() - preflight_started) * 1000,
            project_id=request.project_id,
        )
        return DraftPreflightResult(payload=payload)

    def _create_synthesizer(
        self,
        project_root: Path | None,
        *,
        policy_decision: RunPolicyDecision | None = None,
    ) -> DraftSynthesizer:
        heuristics = load_project_heuristics(project_root)
        model = self._resolve_model(ModelTask.DRAFT, policy_decision=policy_decision)
        return DraftSynthesizer(heuristics=heuristics, model=model)

    def _resolve_model(
        self,
        task: ModelTask,
        *,
        policy_decision: RunPolicyDecision | None = None,
    ) -> dict[str, str]:
        if not self._model_router:
            return DraftSynthesizer._MODEL.copy()
        if policy_decision:
            decision = self._model_router.route_with_policy(task, policy_decision)
            self._last_policy = policy_decision
        else:
            decision = self._model_router.route(task)
            self._last_policy = None
        self._last_route = decision
        self._last_adapter = None
        if self._model_router.config.provider_calls_enabled:
            provider = self._model_router.providers.get(decision.provider)
            if provider and provider.supports(task):
                self._last_adapter = provider.adapter()
        return {"name": decision.model.name, "provider": decision.model.provider}

    def _evaluate_run_policy(
        self,
        *,
        task: ModelTask,
        budget_status: str,
    ) -> RunPolicyDecision | None:
        if not self._model_router:
            return None
        return self._model_router.evaluate_run_policy(task, budget_status=budget_status)

    def _build_adapter_prompt(
        self,
        *,
        scene: OutlineScene,
        front_matter: dict[str, Any],
        overrides: DraftUnitOverrides | None,
        project_root: Path,
        scene_lookup: dict[str, OutlineScene],
        prompt_profile: str | None,
        context: SceneContext | None = None,
        memory_lab_options: MemoryLabRuntimeOptions | None = None,
    ) -> str:
        if context is None:
            context = assemble_scene_context(
                scene=scene,
                front_matter=front_matter,
                overrides=overrides,
                project_root=project_root,
                scene_lookup=scene_lookup,
                memory_lab_options=memory_lab_options,
            )
        profile = select_profile(prompt_profile)
        return compile_draft_prompt(context, profile=profile)

    def _execute_generation(
        self,
        request: DraftGenerateRequest,
        scenes: list[OutlineScene],
        estimated_cost: float,
        budget_payload: dict[str, Any],
        summary: BudgetSummary,
        synthesizer: DraftSynthesizer,
        project_root: Path,
    ) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        units: list[dict[str, Any]] = []
        artifacts: list[dict[str, Any]] = []
        fracture_reports: list[dict[str, Any]] = []
        total_scenes = len(scenes)
        trace_id = ensure_trace_id()
        adapter = self._last_adapter
        scene_lookup = {scene.id: scene for scene in scenes}
        memory_lab_options = self._settings.memory_lab_runtime_options()

        for index, scene in enumerate(scenes):
            overrides = request.overrides.get(scene.id)
            synthesis = synthesizer.synthesize(
                request=request,
                scene=scene,
                overrides=overrides,
                unit_index=index,
            )
            context = assemble_scene_context(
                scene=scene,
                front_matter=synthesis.front_matter,
                overrides=overrides,
                project_root=project_root,
                scene_lookup=scene_lookup,
                memory_lab_options=memory_lab_options,
            )
            if adapter is not None:
                provider_name = self._last_route.provider if self._last_route else None
                model_name = self._last_route.model.name if self._last_route else None
                _generate_log(
                    trace_id,
                    "provider-start",
                    project_id=request.project_id,
                    scene_id=scene.id,
                    unit_index=index + 1,
                    unit_count=total_scenes,
                    provider=provider_name,
                    model=model_name,
                )
                provider_started = perf_counter()
                prompt = self._build_adapter_prompt(
                    scene=scene,
                    front_matter=synthesis.front_matter,
                    overrides=overrides,
                    project_root=project_root,
                    scene_lookup=scene_lookup,
                    prompt_profile=self._last_route.prompt_profile if self._last_route else None,
                    context=context,
                    memory_lab_options=memory_lab_options,
                )
                payload = {
                    "prompt": prompt,
                    "temperature": request.temperature,
                    "options": (
                        {"temperature": request.temperature}
                    if request.temperature is not None
                    else None
                ),
                }
                provider_timeout_seconds = max(
                    1.0,
                    float(
                        getattr(
                            getattr(adapter, "config", None),
                            "timeout_seconds",
                            30.0,
                        )
                        or 30.0
                    )
                    * max(1, total_scenes),
                )
                provider_executor = ThreadPoolExecutor(max_workers=1)
                try:
                    provider_future = provider_executor.submit(adapter.generate_draft, payload)
                    try:
                        adapter_response = provider_future.result(timeout=provider_timeout_seconds)
                    except FuturesTimeoutError as exc:
                        _generate_log(
                            trace_id,
                            "provider-timeout",
                            project_id=request.project_id,
                            scene_id=scene.id,
                            unit_index=index + 1,
                            unit_count=total_scenes,
                            provider=provider_name,
                            model=model_name,
                            duration_ms=round((perf_counter() - provider_started) * 1000, 2),
                            timeout_seconds=provider_timeout_seconds,
                        )
                        raise DraftGenerationProviderTimeoutError(
                            f"Provider call exceeded {provider_timeout_seconds} seconds."
                        ) from exc
                    _generate_log(
                        trace_id,
                        "provider-response",
                        project_id=request.project_id,
                        scene_id=scene.id,
                        unit_index=index + 1,
                        unit_count=total_scenes,
                        provider=provider_name,
                        model=model_name,
                        duration_ms=round((perf_counter() - provider_started) * 1000, 2),
                    )
                    extract_text = getattr(adapter, "extract_text", None)
                    if callable(extract_text):
                        adapter_text = extract_text(adapter_response)
                    elif isinstance(adapter_response, dict):
                        adapter_text = adapter_response.get("text")
                    else:
                        adapter_text = None
                    if is_usable_draft(adapter_text):
                        synthesis.body = adapter_text.strip()
                        synthesis.unit["text"] = synthesis.body
                except AdapterError as exc:
                    message = str(exc)
                    _generate_log(
                        trace_id,
                        "provider-error",
                        project_id=request.project_id,
                        scene_id=scene.id,
                        unit_index=index + 1,
                        unit_count=total_scenes,
                        provider=provider_name,
                        model=model_name,
                        duration_ms=round((perf_counter() - provider_started) * 1000, 2),
                        error=message,
                    )
                    if "timeout" in message.lower() or "timed out" in message.lower():
                        _generate_log(
                            trace_id,
                            "provider-timeout",
                            project_id=request.project_id,
                            scene_id=scene.id,
                            unit_index=index + 1,
                            unit_count=total_scenes,
                            provider=provider_name,
                            model=model_name,
                            duration_ms=round((perf_counter() - provider_started) * 1000, 2),
                        )
                        raise DraftGenerationProviderTimeoutError(message) from exc
                    self._diagnostics.log(
                        project_root,
                        code="ADAPTER",
                        message="Draft adapter failed; falling back to local synthesis.",
                        details={"error": str(exc)},
                    )
                finally:
                    provider_executor.shutdown(wait=False, cancel_futures=True)
            continuity = evaluate_continuity(
                text=synthesis.body,
                pov=context.pov,
                memory=context.memory,
            )
            if continuity["has_issues"]:
                self._diagnostics.log(
                    project_root,
                    code="CONTINUITY",
                    message="Draft continuity issues detected.",
                    details={"scene_id": scene.id, "issues": continuity["issues"]},
                )
            candidate_ruling = detect_candidate_ruling(
                project_id=request.project_id,
                scene_id=scene.id,
                text=synthesis.body,
                continuity_issues=continuity["issues"],
                locked_facts=context.locked_facts,
            )
            if candidate_ruling is not None:
                try:
                    ruling_path = persist_candidate_ruling(project_root, candidate_ruling)
                    self._diagnostics.log(
                        project_root,
                        code="CANON_COURT",
                        message="Canon Court advisory candidate ruling persisted.",
                        details={
                            "scene_id": scene.id,
                            "contradiction_id": candidate_ruling.contradiction_id,
                            "contradiction_type": candidate_ruling.contradiction_type.value,
                            "severity": candidate_ruling.severity.value,
                            "storage_path": str(ruling_path),
                            "diagnostics_only": True,
                            "advisory": True,
                            "non_blocking": True,
                        },
                    )
                except OSError as exc:
                    self._diagnostics.log(
                        project_root,
                        code="CANON_COURT",
                        message="Failed to persist Canon Court advisory candidate ruling.",
                        details={
                            "scene_id": scene.id,
                            "error": str(exc),
                        },
                    )
            fracture_report = analyze_fractures(
                FractureInputs(
                    source="draft_generation",
                    text=synthesis.body,
                    prior_context_present=bool(context.prior_context),
                    locked_facts=context.locked_facts,
                    unresolved_tensions=(
                        context.memory.unresolved_tensions if context.memory is not None else []
                    ),
                    continuity_issues=continuity["issues"],
                    context_notes=context.notes,
                    goal=context.goal,
                    conflict=context.conflict,
                    turn=context.turn,
                )
            )
            if fracture_report.fractures:
                fracture_reports.append(
                    {
                        "unit_id": scene.id,
                        "report": fracture_report.model_dump(mode="json"),
                    }
                )
                self._diagnostics.log(
                    project_root,
                    code="FRACTURE",
                    message="Advisory fracture diagnostics detected during draft generation.",
                    details={
                        "scene_id": scene.id,
                        "report": fracture_report.model_dump(mode="json"),
                    },
                )
            try:
                carryover = extract_carryover(synthesis.body)
                if self._settings.memory_lab_write_legacy_continuity:
                    persist_carryover(project_root, scene.id, carryover)
                if self._settings.memory_lab_enabled:
                    recency_order = (
                        scene.order if isinstance(getattr(scene, "order", None), int) else 0
                    )
                    try:
                        # Continuity persistence and advisory ingestion remain
                        # separate systems. Draft generation is the explicit
                        # bridge between them.
                        persist_scene_advisory_entry(
                            project_root=project_root,
                            scene_id=scene.id,
                            chapter_id=scene.chapter_id,
                            text=synthesis.body,
                            carryover_payload=carryover,
                            recency_order=recency_order,
                            interpretations_enabled=self._settings.memory_lab_interpretations_enabled,
                            max_interpretations_per_group=self._settings.memory_lab_max_interpretations_per_group,
                        )
                    except Exception as exc:  # noqa: BLE001
                        self._diagnostics.log(
                            project_root,
                            code="MEMORY_LAB",
                            message="Failed to persist Memory Lab ledger entry.",
                            details={"scene_id": scene.id, "error": str(exc)},
                        )
            except OSError as exc:
                self._diagnostics.log(
                    project_root,
                    code="CONTINUITY",
                    message="Failed to persist scene continuity payload.",
                    details={"scene_id": scene.id, "error": str(exc)},
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
            "model": dict(synthesizer._model),
            "budget": budget_payload,
        }
        if fracture_reports:
            # Fracture exposure is additive diagnostics metadata only.
            response_payload["diagnostics"] = {
                "fractures": {
                    "exposure": "advisory_unstable_v1",
                    "diagnostics_only": True,
                    "advisory": True,
                    "non_blocking": True,
                    "reports": fracture_reports,
                }
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
        budget_payload = summary.as_dict()
        if (
            self._model_router
            and self._model_router.config.routing_metadata_enabled
            and self._last_route
        ):
            routing_payload = format_route_metadata(self._last_route)
            if self._last_policy:
                routing_payload["run_policy"] = format_run_policy_metadata(self._last_policy)
            budget_payload["routing"] = routing_payload

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
            "model": dict(synthesizer._model),
            "scenes": scenes_payload,
            "budget": budget_payload,
        }

    def _log_runtime_event(
        self,
        project_root: Path,
        request: DraftGenerateRequest,
        units: list[dict[str, Any]],
        estimated_cost: float,
    ) -> None:
        total_tokens = sum(len(unit.get("text", "").split()) for unit in units)
        hint = "cheap"
        if estimated_cost >= DEFAULT_SOFT_BUDGET_LIMIT_USD * 0.5:
            hint = "expensive"
        route = self._last_route
        event = {
            "service": "draft_generate",
            "project_id": request.project_id,
            "unit_scope": request.unit_scope.value,
            "unit_count": len(units),
            "estimated_usd": round(estimated_cost, 2),
            "tokens": total_tokens,
            "mode": "local" if request.unit_scope is DraftUnitScope.SCENE else "batch",
            "hint": hint,
            "routing_policy": route.policy.value if route else None,
            "routing_provider": route.provider if route else None,
            "routing_model": route.model.name if route else None,
            "routing_fallback": route.fallback_used if route else None,
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

    async def _run_with_timeout(
        self,
        func,
        *args,
        project_root: Path | None = None,
        unit_count: int = 1,
    ) -> Any:
        timeout = max(5, int(self._timeout_seconds) * max(1, unit_count))
        attempts = max(1, int(self._retry_attempts) + 1)
        last_error: Exception | None = None
        diagnostics_root = project_root or Path(self._settings.project_base_dir)

        for attempt in range(attempts):
            try:
                async with asyncio.timeout(timeout):
                    return await asyncio.to_thread(func, *args)
            except DraftGenerationProviderTimeoutError:
                raise
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
    "DraftGenerationProviderTimeoutError",
    "DraftGenerationTimeoutError",
    "DraftGenerationService",
    "estimate_word_target",
    "fingerprint_generate_request",
    "resolve_requested_scenes",
]
