"""Controlled long-form execution loop for multi-chunk drafting."""

from __future__ import annotations

import json
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable
from uuid import uuid4

from ..budgeting import classify_budget
from ..diagnostics import DiagnosticLogger
from ..model_adapters import (
    AdapterConfig,
    AdapterError,
    BaseAdapter,
    OllamaAdapter,
    OpenAIAdapter,
    normalize_ollama_payload,
)
from ..model_router import ModelRouter, ModelTask, format_route_metadata
from ..operations.budget_service import BudgetService
from ..prompt_pipeline import ProviderProfile, select_profile
from ..run_policy import RunPolicyDecision, format_run_policy_metadata
from ..long_form import (
    LongFormChunk,
    ChapterMemoryPacket,
    assemble_chapter_memory,
    assemble_continuation_packet,
    fingerprint_long_form_prompt,
    evaluate_long_form_output,
    is_usable_long_form_output,
    score_long_form_quality,
    normalize_long_form_output,
    extract_narrative_prose,
    trim_initial_reasoning_block,
    persist_long_form_chunk,
    persist_long_form_text,
    persist_long_form_diagnostic,
    aggregate_long_form_budget,
)
from ..config import ServiceSettings


@dataclass(slots=True)
class LongFormExecutionResult:
    chunks: list[LongFormChunk]
    stopped_reason: str | None
    budget_summary: dict[str, Any]


def plan_chunk_sequence(scene_ids: Iterable[str], chunk_size: int) -> list[list[str]]:
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive.")
    ids = [scene_id for scene_id in scene_ids]
    return [ids[index : index + chunk_size] for index in range(0, len(ids), chunk_size)]


class LongFormExecutionService:
    """Execute a controlled, opt-in long-form chunk sequence."""

    _MAX_ATTEMPTS = 2
    _QUALITY_MIN_TOTAL = 28
    _QUALITY_MIN_COHERENCE = 3
    _QUALITY_MIN_CONTINUITY = 3
    _QUALITY_MIN_SPECIFICITY = 5
    _QUALITY_MIN_CLARITY = 3
    _MAX_BORDERLINE_RECOVERY_RETRIES = 1
    _MAX_INTERNAL_REPAIR_PASSES = 1
    _REWRITE_LENGTH_LOWER_RATIO = 0.60
    _REWRITE_LENGTH_UPPER_RATIO = 2.10
    _REPAIR_ONLY_LENGTH_LOWER_RATIO = 0.85
    _REPAIR_ONLY_LENGTH_UPPER_RATIO = 1.50
    _REPAIR_ONLY_PARAGRAPH_TOLERANCE = 2
    _MAX_TRANSIENT_ADAPTER_RETRIES = 1
    _BLOCKED_CAPITALIZED_TERMS = {
        "the", "a", "an", "and", "but", "for", "her", "his", "their", "they", "he", "she",
        "it", "this", "that", "again", "hold", "storm", "chapter", "scene", "yet",
        "did", "does", "do", "can", "could", "would", "should", "will", "was", "were", "are",
    }
    _GENERIC_REPLACEMENT_PHRASES = (
        "hung in the air",
        "flicker of",
        "couldn't quite name",
        "heavy with",
        "mix of fear",
        "pressed in",
        "wrapped around her",
        "truth in his voice",
        "voice barely above a whisper",
        "words trailed off",
        "for a moment",
        "something deep within",
        "uncertainty pooling",
        "the house creaked",
        "heart raced",
        "heart thudding",
        "breath catching",
        "shivers spiraling",
    )
    _PATCH_ACTION_MARKERS = (
        "grip", "gripped", "rub", "rubbed", "press", "pressed", "set", "set down",
        "looked", "watched", "leaned", "nudge", "nudged", "held", "lifted", "turned",
        "stepped", "kept", "wiped", "tapped", "clicked", "dragged", "slid",
    )
    _PATCH_SENSORY_MARKERS = (
        "cold", "warm", "hot", "wet", "damp", "bitter", "sweet", "sharp", "rough",
        "slick", "steam", "rain", "glass", "ceramic", "mug", "puddle", "gravel",
        "petal", "stem", "cheek", "skin", "breath", "mist", "coat", "lamp", "streetlamp",
        "pulse", "throat", "ribs", "lungs", "jaw", "stomach", "palms", "knuckles", "ears",
    )
    _PATCH_SETTING_MARKERS = (
        "path", "counter", "window", "door", "table", "floor", "wall", "square",
        "annex", "burner", "pot", "sink", "saucer", "creek", "roots", "oak",
        "gravel", "cobbles", "stall", "fountain", "alley", "roof", "street", "gutter", "brick",
    )
    _VAGUE_SENTENCE_MARKERS = (
        "felt like",
        "felt ",
        "seemed to",
        "seemed ",
        "as if",
        "uncertainty",
        "unease",
        "tension",
        "serenity",
        "reverie",
        "swirling emotions",
        "hung in the air",
        "distant",
        "hard to pin down",
        "unspoken words",
    )

    def __init__(
        self,
        *,
        settings: ServiceSettings,
        diagnostics: DiagnosticLogger,
        model_router: ModelRouter | None = None,
        enabled: bool = False,
    ) -> None:
        self._settings = settings
        self._diagnostics = diagnostics
        self._model_router = model_router
        self._budget_service = BudgetService(settings=settings, diagnostics=diagnostics)
        self._enabled = enabled

    def execute(
        self,
        *,
        project_root: Path,
        chapter_id: str,
        scene_ids: list[str],
        chunk_size: int = 2,
        target_words_per_chunk: int | None = None,
        constraints: list[str] | None = None,
    ) -> LongFormExecutionResult:
        if not self._enabled or not self._settings.long_form_provider_enabled:
            return LongFormExecutionResult(
                chunks=[],
                stopped_reason="disabled",
                budget_summary={"chunk_count": 0, "estimated_usd": 0.0},
            )

        chunk_plan = plan_chunk_sequence(scene_ids, chunk_size)
        chapter_memory = assemble_chapter_memory(
            project_root=project_root,
            chapter_id=chapter_id,
            scene_ids=scene_ids,
        )
        budget_state = self._budget_service.load_state(project_root)
        running_spend = float(budget_state.spent_usd)

        chunks: list[LongFormChunk] = []
        previous_chunk: LongFormChunk | None = None
        previous_text: str | None = None
        stopped_reason: str | None = None

        for order, chunk_scene_ids in enumerate(chunk_plan, start=1):
            chunk_id = f"lf_{uuid4().hex[:8]}"
            estimated_cost = self._estimate_chunk_cost(
                target_words_per_chunk,
                len(chunk_scene_ids),
            )
            status_label, message, total_after = classify_budget(
                estimated_cost,
                soft_limit=budget_state.soft_limit,
                hard_limit=budget_state.hard_limit,
                current_spend=running_spend,
            )

            policy_decision = self._evaluate_run_policy(status_label)
            if (
                self._settings.long_form_prefer_api
                and policy_decision
                and policy_decision.allow_api
            ):
                policy_decision = RunPolicyDecision(
                    task=policy_decision.task,
                    policy=policy_decision.policy,
                    budget_status=policy_decision.budget_status,
                    allow_local=policy_decision.allow_local,
                    allow_api=policy_decision.allow_api,
                    prefer_local=False,
                    reason="long_form.prefer_api",
                    warnings=list(policy_decision.warnings),
                    blocked=policy_decision.blocked,
                )
            route, adapter = self._resolve_provider(
                policy_decision=policy_decision,
            )
            if self._model_router is not None and route is None:
                stopped_reason = "no_healthy_providers"
                break

            profile = self._select_profile(route)
            continuation = assemble_continuation_packet(
                chunk_id=chunk_id,
                chapter_id=chapter_id,
                order=order,
                previous_chunk=previous_chunk,
                previous_text=previous_text,
                chapter_memory=chapter_memory,
                target_words=target_words_per_chunk,
                constraints=constraints,
            )
            prompt = self._build_chunk_prompt(
                continuation=continuation,
                profile=profile,
                scene_ids=chunk_scene_ids,
            )
            prompt_fingerprint = fingerprint_long_form_prompt(
                {
                    "chunk_id": chunk_id,
                    "chapter_id": chapter_id,
                    "order": order,
                    "scene_ids": chunk_scene_ids,
                    "prompt": prompt,
                    "constraints": constraints or [],
                }
            )

            (
                text,
                fallback_reason,
                provider_failed,
                attempt_count,
                quality_snapshot,
                critique_snapshot,
                acceptance_reason,
                rewrite_used,
                retry_snapshot,
                guardrail_snapshot,
            ) = self._run_chunk_attempts(
                adapter=adapter,
                route=route,
                prompt=prompt,
                continuation=continuation,
                project_root=project_root,
            )
            continuity_snapshot = self._build_continuity_snapshot(
                text,
                fallback_reason=fallback_reason,
            )
            budget_snapshot = self._budget_service.build_summary(
                state=budget_state,
                estimated_cost=estimated_cost,
                total_after=total_after,
                spent_override=running_spend,
                status=status_label,
                message=message,
            ).as_dict()
            routing_snapshot = self._build_routing_snapshot(
                route=route,
                policy_decision=policy_decision,
                fallback_reason=fallback_reason,
            )

            chunk = LongFormChunk(
                chunk_id=chunk_id,
                chapter_id=chapter_id,
                scene_ids=list(chunk_scene_ids),
                order=order,
                continuation_of=previous_chunk.chunk_id if previous_chunk else None,
                prompt_fingerprint=prompt_fingerprint,
                provider=route.provider if route else None,
                model=route.model.name if route else None,
                continuity_snapshot=continuity_snapshot,
                budget_snapshot=budget_snapshot,
                routing_snapshot=routing_snapshot,
                quality_snapshot=quality_snapshot,
                critique_snapshot=critique_snapshot,
                attempt_count=attempt_count,
                acceptance_reason=acceptance_reason,
                rewrite_used=rewrite_used,
                retry_snapshot=retry_snapshot,
                guardrail_snapshot=guardrail_snapshot,
            )
            persist_long_form_chunk(project_root, chunk)
            persist_long_form_text(project_root, chunk_id, text)

            chunks.append(chunk)
            previous_chunk = chunk
            previous_text = text
            running_spend = total_after

            if status_label == "blocked":
                stopped_reason = "budget_blocked"
                break
            if provider_failed:
                stopped_reason = fallback_reason or "provider_failed"
                break

        budget_summary = aggregate_long_form_budget(chunks)
        return LongFormExecutionResult(
            chunks=chunks,
            stopped_reason=stopped_reason,
            budget_summary=budget_summary,
        )

    def _estimate_chunk_cost(self, target_words: int | None, scene_count: int) -> float:
        words = target_words if target_words is not None else max(600, scene_count * 800)
        return round((words / 1000) * 0.02, 2)

    def _evaluate_run_policy(self, budget_status: str) -> RunPolicyDecision | None:
        if not self._model_router:
            return None
        return self._model_router.evaluate_run_policy(ModelTask.DRAFT, budget_status=budget_status)

    def _resolve_provider(
        self,
        *,
        policy_decision: RunPolicyDecision | None,
    ) -> tuple[Any | None, BaseAdapter | None]:
        if not self._model_router:
            return None, None
        try:
            if policy_decision:
                route = self._model_router.route_with_policy(ModelTask.DRAFT, policy_decision)
            else:
                route = self._model_router.route(ModelTask.DRAFT)
        except RuntimeError as exc:
            self._diagnostics.log(
                Path(self._settings.project_base_dir),
                code="POLICY",
                message="No healthy providers for long-form chunk.",
                details={"error": str(exc)},
            )
            return None, None

        adapter = None
        if self._model_router.config.provider_calls_enabled:
            provider = self._model_router.providers.get(route.provider)
            if provider and provider.supports(ModelTask.DRAFT):
                adapter = provider.adapter()
        return route, adapter

    def _select_profile(self, route: Any | None) -> ProviderProfile:
        provider_name = None
        if route is not None:
            provider_name = route.model.provider
        return select_profile(provider_name)

    def _build_chunk_prompt(
        self,
        *,
        continuation,
        profile: ProviderProfile,
        scene_ids: list[str],
    ) -> str:
        style_lines = list(profile.draft_style)
        memory = continuation.chapter_memory
        prior_excerpt = continuation.prior_excerpt
        if isinstance(prior_excerpt, str) and len(prior_excerpt) > 600:
            prior_excerpt = f"{prior_excerpt[:600].rstrip()}…"
        location_state = (
            continuation.continuity_snapshot.get("location")
            or continuation.continuity_snapshot.get("world_state")
            or continuation.continuity_snapshot.get("setting")
        )
        location_state = location_state if isinstance(location_state, str) and location_state else "unspecified"
        lines: list[str] = []
        lines.extend(style_lines)
        lines.extend(
            [
                "ROLE: You are a novelist continuing a single chapter in-scene.",
                "OUTPUT CONTRACT: Return only narrative prose. No headings, no lists, no meta commentary.",
                "ANTI-REASONING: Do not reveal planning, analysis, or chain-of-thought.",
                "ANTI-RECAP: Do not recap prior scenes or reset the scene.",
                "ANTI-PROMPT-ECHO: Never repeat prompt labels or instructions.",
                "CHAPTER CONTINUITY: Stay consistent with established events and tone.",
                f"CHAPTER: {memory.chapter_context or memory.chapter_id}",
                f"SCENE IDS: {', '.join(scene_ids)}",
            ]
        )
        if profile.name.startswith("local_ollama"):
            lines.extend(
                [
                    "WRITE ONLY THE STORY. Do not explain what you are about to write.",
                    "NO ANALYSIS, NO PLANNING, NO NOTES, NO PREFACE.",
                    "DO NOT USE LABELS like 'Scene:', 'Draft:', 'Analysis:', or 'Notes:'.",
                    "BEGIN WITH NARRATIVE ON LINE 1.",
                ]
            )
        if continuation.target_words:
            min_target = max(100, int(continuation.target_words * 0.9))
            max_target = int(continuation.target_words * 1.1)
            lines.append(f"TARGET WORD RANGE: {min_target}-{max_target}")
        if memory.locked_facts:
            lines.append(f"LOCKED FACTS: {'; '.join(memory.locked_facts)}")
        if memory.scene_titles:
            lines.append(f"SCENE OUTLINE TITLES: {' | '.join(memory.scene_titles)}")
        if memory.beat_refs:
            lines.append(f"SCENE BEAT REFS: {', '.join(memory.beat_refs)}")
        if memory.accumulated_summaries:
            lines.append(f"CHAPTER MEMORY: {' | '.join(memory.accumulated_summaries)}")
        if memory.unresolved_tensions:
            lines.append(f"UNRESOLVED TENSIONS: {', '.join(memory.unresolved_tensions)}")
        if memory.emotional_carryover:
            lines.append(f"EMOTIONAL CARRYOVER: {memory.emotional_carryover}")
        lines.append(f"LOCATION/WORLD STATE: {location_state}")
        if continuation.prior_summary:
            lines.append(f"PRIOR SUMMARY: {continuation.prior_summary}")
        if prior_excerpt:
            lines.append(f"PRIOR EXCERPT: {prior_excerpt}")
        if continuation.prior_summary or prior_excerpt:
            lines.append(
                "CONTINUITY PRESSURE: carry forward at least one concrete detail from the prior summary/excerpt."
            )
            lines.append(
                "CONTINUITY CHECKLIST: location state, object state, emotional carryover."
            )
        if not continuation.prior_summary and not continuation.prior_excerpt:
            lines.append("CHUNK OBJECTIVE: Open the chapter with immersive scene prose.")
        if continuation.constraints:
            lines.append(f"NEGATIVE CONSTRAINTS: {' | '.join(continuation.constraints)}")
        lines.extend(
            [
                "POV RULES: Stay in a consistent POV; do not head-hop.",
                "PROSE RULES: Show action, sensation, and dialogue where natural.",
                "OUTLINE RULES: Stay faithful to the outline, current scene subject, and locked facts. Do not invent new roles, twists, or off-outline events.",
                "FINAL: Begin the scene now with concrete action.",
                "NO PREFACE: Do not include planning, analysis, or acknowledgements.",
            ]
        )
        return "\n".join(lines)

    def _run_chunk_attempts(
        self,
        *,
        adapter: BaseAdapter | None,
        route: Any | None,
        prompt: str,
        continuation,
        project_root: Path,
    ) -> tuple[
        str,
        str | None,
        bool,
        int,
        dict[str, Any] | None,
        dict[str, Any] | None,
        str | None,
        bool,
        dict[str, Any] | None,
        dict[str, Any] | None,
    ]:
        if not self._model_router or not self._model_router.config.provider_calls_enabled:
            return (
                self._fallback_text(continuation),
                "provider_calls_disabled",
                False,
                0,
                None,
                None,
                "provider_calls_disabled",
                False,
                None,
                {"evaluated": False},
            )
        if adapter is None:
            return (
                self._fallback_text(continuation),
                "provider_unavailable",
                False,
                0,
                None,
                None,
                "provider_unavailable",
                False,
                None,
                {"evaluated": False},
            )

        payload: dict[str, Any] = {
            "prompt": prompt,
            "temperature": 0.7,
            "system": "You are a novelist. Output only narrative prose. Do not include analysis or planning.",
            "options": {
                "temperature": 0.7,
                "reasoning": False,
            },
        }
        if continuation.target_words:
            payload["max_tokens"] = int(continuation.target_words * 1.3)
            # Cap local generation length to reduce Ollama timeouts.
            payload["options"]["num_ctx"] = 2048
            payload["options"]["num_predict"] = min(200, int(continuation.target_words))
        attempt_diagnostics: list[dict[str, Any]] = []
        critique_snapshot: dict[str, Any] | None = None
        quality_snapshot: dict[str, Any] | None = None
        previous_quality_snapshot: dict[str, Any] | None = None
        acceptance_reason: str | None = None
        rewrite_used = False
        retry_snapshot: dict[str, Any] | None = None
        retry_attempts_used = 0
        internal_repair_attempts_used = 0
        same_slot_specificity_retry_used = 0
        guardrail_snapshot: dict[str, Any] | None = {"evaluated": False}
        rescue_contract: dict[str, Any] | None = None
        rescue_generation_strategy = (
            str(self._settings.rescue_generation_strategy or "slot_patch").strip() or "slot_patch"
        )

        try:
            current_payload = dict(payload)
            attempt = 1
            while True:
                if attempt == 1:
                    attempt_kind = "draft"
                elif retry_snapshot and internal_repair_attempts_used > 0 and attempt > self._MAX_ATTEMPTS + 1:
                    attempt_kind = "repair_only"
                elif retry_snapshot and retry_attempts_used > 0 and attempt > self._MAX_ATTEMPTS:
                    attempt_kind = "recovery_retry"
                else:
                    attempt_kind = "rewrite"
                if attempt > 1:
                    rewrite_used = True
                attempt_adapter = adapter
                model_snapshot = self._build_attempt_model_snapshot(
                    route=route,
                    adapter=attempt_adapter,
                    mode=attempt_kind,
                    escalated=False,
                    reason="draft_route" if attempt_kind == "draft" else "rewrite_default",
                )
                if attempt_kind in {"recovery_retry", "repair_only"}:
                    attempt_adapter, model_snapshot = self._resolve_rescue_adapter(
                        route=route,
                        default_adapter=adapter,
                    )
                    if retry_snapshot is not None:
                        retry_snapshot["model_snapshot"] = model_snapshot
                        retry_snapshot["rescue_model_name"] = str(model_snapshot.get("model") or "")
                        retry_snapshot["stronger_model_used"] = bool(model_snapshot.get("escalated"))
                        retry_snapshot["rescue_model_used"] = bool(model_snapshot.get("escalated"))
                source_text = ""
                active_generation_strategy = rescue_generation_strategy
                active_rescue_contract = rescue_contract
                rescue_slots: list[dict[str, Any]] = []
                if attempt_kind in {"recovery_retry", "repair_only"} and rescue_contract is not None:
                    source_text = (
                        previous_quality_snapshot.get("text")
                        if isinstance(previous_quality_snapshot, dict)
                        else None
                    ) or ""
                    active_generation_strategy = self._resolve_rescue_generation_strategy(
                        strategy=rescue_generation_strategy,
                        mode=attempt_kind,
                    )
                    if attempt_kind == "repair_only":
                        if bool(active_rescue_contract.get("skip_refresh_once")):
                            active_rescue_contract = dict(active_rescue_contract)
                            active_rescue_contract.pop("skip_refresh_once", None)
                        else:
                            active_rescue_contract = self._refresh_rescue_contract_for_current_text(
                                current_text=source_text,
                                rescue_contract=rescue_contract,
                                continuation=continuation,
                                critique_snapshot=critique_snapshot,
                                quality_snapshot=previous_quality_snapshot,
                            )
                        rescue_contract = active_rescue_contract
                    rescue_slots = self._materialize_rescue_generation_slots(
                        current_text=source_text,
                        rescue_contract=active_rescue_contract,
                        strategy=active_generation_strategy,
                    )
                if attempt_kind in {"recovery_retry", "repair_only"} and active_generation_strategy == "structured_slot_patch":
                    candidate = self._generate_structured_rescue_candidate(
                        adapter=attempt_adapter,
                        payload=current_payload,
                        continuation=continuation,
                        project_root=project_root,
                        call_mode=attempt_kind,
                        latest_text=source_text,
                        rescue_contract=active_rescue_contract or {},
                        rescue_slots=rescue_slots,
                    )
                else:
                    candidate = self._generate_candidate(
                        adapter=attempt_adapter,
                        payload=current_payload,
                        continuation=continuation,
                        project_root=project_root,
                        call_mode=attempt_kind,
                    )
                attempt_record = {
                    "attempt": attempt,
                    "mode": attempt_kind,
                    "extracted_field": candidate.get("extracted_field"),
                    "thinking_fallback": candidate.get("thinking_fallback"),
                    "reasoning_trim_applied": candidate.get("reasoning_trim_applied"),
                    "model_snapshot": model_snapshot,
                }
                if candidate.get("adapter_error"):
                    attempt_record["error"] = candidate["adapter_error"]
                    attempt_record["adapter_failure_class"] = candidate.get("adapter_failure_class")
                    if candidate.get("adapter_retry_used"):
                        attempt_record["adapter_retry_used"] = True
                        attempt_record["adapter_retry_count"] = candidate.get("adapter_retry_count")
                    attempt_diagnostics.append(attempt_record)
                    persist_long_form_diagnostic(
                        project_root,
                        continuation.chunk_id,
                        {
                            "chunk_id": continuation.chunk_id,
                            "validation_decision": False,
                            "fallback_reason": "adapter_error",
                            "attempts": attempt_diagnostics,
                            "adapter_failure_class": candidate.get("adapter_failure_class"),
                            "adapter_retry_count": candidate.get("adapter_retry_count"),
                        },
                    )
                    return (
                        self._fallback_text(continuation),
                        "adapter_error",
                        True,
                        attempt,
                        quality_snapshot,
                        critique_snapshot,
                        "adapter_error",
                        rewrite_used,
                        retry_snapshot,
                        guardrail_snapshot,
                    )
                cleaned = candidate.get("text")
                attempt_record["raw_preview"] = candidate.get("raw_preview")
                attempt_record["normalized_preview"] = candidate.get("normalized_preview")
                attempt_record["raw_length"] = candidate.get("raw_length")
                attempt_record["normalized_length"] = candidate.get("normalized_length")
                attempt_record["raw_payload_keys"] = candidate.get("raw_payload_keys")
                attempt_record["raw_payload_preview"] = candidate.get("raw_payload_preview")
                if candidate.get("repair_plan") is not None:
                    attempt_record["repair_plan"] = candidate.get("repair_plan")
                    attempt_record["repair_plan_raw_preview"] = candidate.get("repair_plan_raw_preview")
                if attempt_kind in {"recovery_retry", "repair_only"} and rescue_contract is not None:
                    patch_response = self._parse_patch_response(cleaned)
                    attempt_record["rescue_slots"] = rescue_slots
                    attempt_record["rescue_generation_strategy"] = active_generation_strategy
                    attempt_record["configured_rescue_generation_strategy"] = rescue_generation_strategy
                    attempt_record["patch_response"] = patch_response
                    patch_result = self._validate_and_apply_patch_response(
                        source_text=source_text,
                        rescue_slots=rescue_slots,
                        patch_response=patch_response,
                        continuation=continuation,
                        rescue_contract=active_rescue_contract,
                        mode=attempt_kind,
                    )
                    attempt_record["patch_validation"] = patch_result
                    if retry_snapshot is not None:
                        retry_snapshot["patch_rescue_used"] = True
                        retry_snapshot["rescue_generation_strategy"] = active_generation_strategy
                        retry_snapshot["configured_rescue_generation_strategy"] = rescue_generation_strategy
                        retry_snapshot["rescue_slots_summary"] = {
                            "slot_count": len(rescue_slots),
                            "target_types": [str(target.get("target_type")) for target in rescue_slots],
                        }
                    if not patch_result.get("accepted"):
                        if retry_snapshot is not None:
                            retry_snapshot["rescue_failure_class"] = str(
                                patch_result.get("failure_class") or "patch_under_applied"
                            )
                            retry_snapshot["rescue_under_improved"] = True
                            retry_snapshot["rescue_guardrail_fail"] = False
                            retry_snapshot["rescue_fidelity_risk"] = retry_snapshot["rescue_failure_class"] == "patch_fidelity_risk"
                        failed_slot_ids = [
                            str(item.get("slot_id") or "").strip()
                            for item in (patch_response or [])
                            if isinstance(item, dict) and str(item.get("slot_id") or "").strip()
                        ]
                        failed_slots_by_id = {
                            str(slot.get("slot_id") or "").strip(): slot
                            for slot in (active_rescue_contract.get("rescue_slots") or [])
                            if isinstance(slot, dict) and str(slot.get("slot_id") or "").strip()
                        }
                        targeted_dialogue_grounding = bool(
                            (critique_snapshot or {}).get("dialogue_grounding_targets")
                            or (critique_snapshot or {}).get("grounding_targets")
                        )
                        specificity_retry_slot_ids = [
                            slot_id
                            for slot_id in failed_slot_ids
                            if str((failed_slots_by_id.get(slot_id) or {}).get("target_type") or "generic") != "dialogue"
                        ]
                        if (
                            same_slot_specificity_retry_used < 1
                            and str(patch_result.get("failure_class") or "") == "patch_specificity_unresolved"
                            and patch_response
                            and not targeted_dialogue_grounding
                            and specificity_retry_slot_ids
                            and len(specificity_retry_slot_ids) == len(failed_slot_ids)
                        ):
                            same_slot_specificity_retry_used += 1
                            same_slot_contract = self._build_same_slot_retry_contract(
                                rescue_contract=active_rescue_contract,
                                slot_ids=specificity_retry_slot_ids,
                            )
                            rescue_contract = dict(same_slot_contract)
                            if attempt_kind == "repair_only":
                                rescue_contract["skip_refresh_once"] = True
                            if retry_snapshot is not None:
                                retry_snapshot["same_slot_specificity_retry_used"] = True
                                retry_snapshot["same_slot_specificity_retry_slot_ids"] = specificity_retry_slot_ids
                            current_payload = dict(payload)
                            current_payload["prompt"] = self._build_same_slot_specificity_retry_prompt(
                                latest_text=source_text,
                                continuation=continuation,
                                rescue_contract=rescue_contract,
                                retry_mode=attempt_kind,
                            )
                            current_payload["system"] = (
                                "Perform a bounded same-slot specificity retry. Return JSON only."
                            )
                            attempt += 1
                            continue
                        attempt_diagnostics.append(attempt_record)
                        if (
                            attempt_kind == "recovery_retry"
                            and internal_repair_attempts_used < self._MAX_INTERNAL_REPAIR_PASSES
                            and str(patch_result.get("failure_class") or "") in {
                                "patch_generic_replacement_unresolved",
                                "patch_dialogue_grounding_unresolved",
                                "patch_specificity_unresolved",
                                "patch_clarity_unresolved",
                                "patch_under_applied",
                                "patch_parse_failed",
                            }
                        ):
                            internal_repair_attempts_used += 1
                            patch_failure_class = str(patch_result.get("failure_class") or "")
                            retry_snapshot["repair_only_pass_used"] = True
                            retry_snapshot["repair_only_pass_rescued"] = False
                            rescue_contract = self._refresh_rescue_contract_for_current_text(
                                current_text=source_text,
                                rescue_contract=rescue_contract,
                                continuation=continuation,
                                critique_snapshot=critique_snapshot,
                                quality_snapshot=previous_quality_snapshot,
                            )
                            current_payload = dict(payload)
                            current_payload["prompt"] = self._build_rescue_generation_prompt(
                                strategy=rescue_generation_strategy,
                                mode="repair_only",
                                original_text=source_text,
                                latest_text=source_text,
                                continuation=continuation,
                                critique_snapshot=critique_snapshot or {},
                                quality_snapshot=previous_quality_snapshot or {},
                                failure_classification={},
                                rescue_contract=rescue_contract or {},
                                rescue_failure_class=patch_failure_class or "patch_under_applied",
                            )
                            current_payload["system"] = (
                                "Perform a repair-only patch edit. Return JSON only."
                            )
                            attempt += 1
                            continue
                        persist_long_form_diagnostic(
                            project_root,
                            continuation.chunk_id,
                            {
                                "chunk_id": continuation.chunk_id,
                                "validation_decision": False,
                                "fallback_reason": "quality_failed",
                                "attempts": attempt_diagnostics,
                                "quality_snapshot": quality_snapshot,
                                "critique_snapshot": critique_snapshot,
                                "retry_snapshot": retry_snapshot,
                                "guardrail_snapshot": guardrail_snapshot,
                            },
                        )
                        return (
                            self._fallback_text(continuation),
                            "quality_failed",
                            True,
                            attempt,
                            quality_snapshot,
                            critique_snapshot,
                            "quality_failed",
                            rewrite_used,
                            retry_snapshot,
                            guardrail_snapshot,
                        )
                    cleaned = str(patch_result.get("patched_text") or source_text)
                    if rescue_contract is not None and patch_result.get("patch_snapshots"):
                        rescue_contract = dict(rescue_contract)
                        rescue_contract["accepted_patch_snapshots"] = list(patch_result.get("patch_snapshots") or [])
                        rescue_contract["accepted_local_specificity_credit"] = any(
                            str(snapshot.get("target_type") or "") == "generic"
                            for snapshot in (patch_result.get("patch_snapshots") or [])
                        )
                    attempt_record["patched_preview"] = cleaned[:200]
                    attempt_record["patch_snapshot"] = patch_result.get("patch_snapshots")
                report = evaluate_long_form_output(
                    cleaned, prior_excerpt=continuation.prior_excerpt
                )
                attempt_record["basic_validation"] = report
                attempt_diagnostics.append(attempt_record)

                if not report.get("usable"):
                    self._diagnostics.log(
                        project_root,
                        code="VALIDATION",
                        message="Long-form output rejected (basic validation).",
                        details={"reason": report, "attempt": attempt},
                    )
                    persist_long_form_diagnostic(
                        project_root,
                        continuation.chunk_id,
                        {
                            "chunk_id": continuation.chunk_id,
                            "reason": report,
                            "validation_decision": False,
                            "fallback_reason": "invalid_output",
                            "attempts": attempt_diagnostics,
                        },
                    )
                    return (
                        self._fallback_text(continuation),
                        "invalid_output",
                        True,
                        attempt,
                        quality_snapshot,
                        critique_snapshot,
                        "invalid_output",
                        rewrite_used,
                        retry_snapshot,
                        guardrail_snapshot,
                    )

                quality_snapshot = score_long_form_quality(
                    cleaned,
                    prior_excerpt=continuation.prior_excerpt,
                    prior_summary=continuation.prior_summary,
                )
                quality_snapshot["text"] = cleaned
                if attempt_kind == "repair_only":
                    repair_local_snapshot = self._evaluate_repair_only_local_constraints(
                        previous_text=previous_quality_snapshot.get("text")
                        if isinstance(previous_quality_snapshot, dict)
                        else None,
                        repaired_text=cleaned,
                        rescue_contract=rescue_contract,
                    )
                    attempt_record["repair_local_snapshot"] = repair_local_snapshot
                    if retry_snapshot is not None:
                        retry_snapshot["repair_local_snapshot"] = repair_local_snapshot
                    if not repair_local_snapshot.get("accepted"):
                        if retry_snapshot is not None:
                            retry_snapshot["rescue_failure_class"] = str(
                                repair_local_snapshot.get("failure_reason") or "repair_length_collapse"
                            )
                            retry_snapshot["rescue_under_improved"] = True
                            retry_snapshot["rescue_guardrail_fail"] = False
                            retry_snapshot["rescue_fidelity_risk"] = False
                        persist_long_form_diagnostic(
                            project_root,
                            continuation.chunk_id,
                            {
                                "chunk_id": continuation.chunk_id,
                                "validation_decision": False,
                                "fallback_reason": "quality_failed",
                                "attempts": attempt_diagnostics,
                                "quality_snapshot": quality_snapshot,
                                "critique_snapshot": critique_snapshot,
                                "retry_snapshot": retry_snapshot,
                                "guardrail_snapshot": guardrail_snapshot,
                            },
                        )
                        return (
                            self._fallback_text(continuation),
                            "quality_failed",
                            True,
                            attempt,
                            quality_snapshot,
                            critique_snapshot,
                            "quality_failed",
                            rewrite_used,
                            retry_snapshot,
                            guardrail_snapshot,
                        )
                if attempt_kind in {"rewrite", "recovery_retry", "repair_only"}:
                    guardrail_snapshot = self._evaluate_rewrite_guardrails(
                        original_text=previous_quality_snapshot.get("text") if isinstance(previous_quality_snapshot, dict) else None,
                        fallback_original_text=None,
                        rewritten_text=cleaned,
                        continuation=continuation,
                        chapter_memory=continuation.chapter_memory,
                        quality_snapshot=quality_snapshot,
                        mode=attempt_kind,
                    )
                    attempt_record["guardrail_snapshot"] = guardrail_snapshot
                    if not guardrail_snapshot.get("accepted"):
                        if retry_snapshot and attempt_kind == "recovery_retry":
                            rescue_delta_summary = self._build_rescue_delta_summary(
                                previous_quality_snapshot=previous_quality_snapshot,
                                rewritten_quality_snapshot=quality_snapshot,
                                critique_snapshot=critique_snapshot,
                                rescue_contract=rescue_contract,
                            )
                            retry_snapshot["rescue_delta_summary"] = rescue_delta_summary
                            retry_snapshot["rescue_failure_class"] = "guardrail_failed"
                            retry_snapshot["rescue_guardrail_fail"] = True
                            retry_snapshot["rescue_under_improved"] = False
                            retry_snapshot["rescue_fidelity_risk"] = True
                        attempt_record["guardrail_blocked"] = True
                        persist_long_form_diagnostic(
                            project_root,
                            continuation.chunk_id,
                            {
                                "chunk_id": continuation.chunk_id,
                                "validation_decision": False,
                                "fallback_reason": "rewrite_guardrail_failed",
                                "attempts": attempt_diagnostics,
                                "quality_snapshot": quality_snapshot,
                                "critique_snapshot": critique_snapshot,
                                "retry_snapshot": retry_snapshot,
                                "guardrail_snapshot": guardrail_snapshot,
                            },
                        )
                        self._diagnostics.log(
                            project_root,
                            code="VALIDATION",
                            message="Rewrite rejected by outline/length guardrails.",
                            details={"guardrail_snapshot": guardrail_snapshot, "attempt": attempt},
                        )
                        return (
                            self._fallback_text(continuation),
                            "rewrite_guardrail_failed",
                            True,
                            attempt,
                            quality_snapshot,
                            critique_snapshot,
                            "rewrite_guardrail_failed",
                            rewrite_used,
                            retry_snapshot,
                            guardrail_snapshot,
                        )
                quality_pass = self._quality_passes(
                    quality_snapshot,
                    rewrite_used=rewrite_used,
                    previous_quality_snapshot=previous_quality_snapshot,
                    critique_snapshot=critique_snapshot,
                    rescue_contract=rescue_contract,
                    continuation_chunk=bool(continuation.prior_summary or continuation.prior_excerpt),
                )
                attempt_record["quality_snapshot"] = quality_snapshot
                attempt_record["quality_pass"] = quality_pass
                if rewrite_used and previous_quality_snapshot is not None:
                    attempt_record["rewrite_delta"] = {
                        "total_delta": int(quality_snapshot.get("total_score") or 0)
                        - int(previous_quality_snapshot.get("total_score") or 0),
                        "stock_phrase_delta": int(previous_quality_snapshot.get("stock_phrase_hits") or 0)
                        - int(quality_snapshot.get("stock_phrase_hits") or 0),
                        "specificity_delta": int((quality_snapshot.get("scores") or {}).get("specificity") or 0)
                        - int((previous_quality_snapshot.get("scores") or {}).get("specificity") or 0),
                        "clarity_delta": int((quality_snapshot.get("scores") or {}).get("clarity") or 0)
                        - int((previous_quality_snapshot.get("scores") or {}).get("clarity") or 0),
                        "continuity_delta": int((quality_snapshot.get("scores") or {}).get("continuity") or 0)
                        - int((previous_quality_snapshot.get("scores") or {}).get("continuity") or 0),
                    }
                if retry_snapshot and attempt_kind in {"recovery_retry", "repair_only"}:
                    rescue_delta_summary = self._build_rescue_delta_summary(
                        previous_quality_snapshot=previous_quality_snapshot,
                        rewritten_quality_snapshot=quality_snapshot,
                        critique_snapshot=critique_snapshot,
                        rescue_contract=rescue_contract,
                    )
                    retry_snapshot["rescue_delta_summary"] = rescue_delta_summary
                    attempt_record["rescue_delta_summary"] = rescue_delta_summary

                if quality_pass:
                    if retry_snapshot and attempt_kind in {"recovery_retry", "repair_only"}:
                        retry_snapshot["succeeded"] = True
                        retry_snapshot["accepted_reason"] = "retry_pass"
                        retry_snapshot["rescue_failure_class"] = None
                        retry_snapshot["rescue_guardrail_fail"] = False
                        retry_snapshot["rescue_under_improved"] = False
                        retry_snapshot["rescue_fidelity_risk"] = False
                        retry_snapshot["patch_rescue_success"] = True
                    if retry_snapshot and attempt_kind == "repair_only":
                        retry_snapshot["repair_only_pass_rescued"] = True
                    acceptance_reason = (
                        "quality_pass"
                        if attempt == 1
                        else ("retry_pass" if attempt_kind in {"recovery_retry", "repair_only"} else "rewrite_pass")
                    )
                    if rewrite_used:
                        persist_long_form_diagnostic(
                            project_root,
                            continuation.chunk_id,
                            {
                                "chunk_id": continuation.chunk_id,
                                "validation_decision": True,
                                "attempts": attempt_diagnostics,
                                "acceptance_reason": acceptance_reason,
                                "critique_snapshot": critique_snapshot,
                                "retry_snapshot": retry_snapshot,
                                "guardrail_snapshot": guardrail_snapshot,
                            },
                        )
                    return (
                        cleaned.strip(),
                        None,
                        False,
                        attempt,
                        quality_snapshot,
                        critique_snapshot,
                        acceptance_reason,
                        rewrite_used,
                        retry_snapshot,
                        guardrail_snapshot,
                    )

                if attempt < self._MAX_ATTEMPTS:
                    previous_quality_snapshot = quality_snapshot
                    previous_quality_snapshot["text"] = cleaned
                    critique_snapshot = self._run_chunk_critique(
                        adapter=attempt_adapter,
                        text=cleaned,
                        continuation=continuation,
                        project_root=project_root,
                        quality_snapshot=quality_snapshot,
                    )
                    current_payload = dict(payload)
                    current_payload["prompt"] = self._build_rewrite_prompt(
                        original_text=cleaned,
                        critique_snapshot=critique_snapshot,
                        continuation=continuation,
                        quality_snapshot=quality_snapshot,
                    )
                    current_payload["system"] = (
                        "Rewrite the scene. Output only narrative prose. "
                        "No analysis, no planning, no headings."
                    )
                    attempt += 1
                    continue

                if retry_snapshot and attempt_kind in {"recovery_retry", "repair_only"}:
                    rescue_failure_class = self._classify_rescue_failure(
                        previous_quality_snapshot=previous_quality_snapshot,
                        rewritten_quality_snapshot=quality_snapshot,
                        critique_snapshot=critique_snapshot,
                        guardrail_snapshot=guardrail_snapshot,
                        rescue_contract=rescue_contract,
                    )
                    retry_snapshot["rescue_failure_class"] = rescue_failure_class
                    retry_snapshot["rescue_guardrail_fail"] = rescue_failure_class == "guardrail_failed"
                    retry_snapshot["rescue_under_improved"] = rescue_failure_class not in {
                        "guardrail_failed",
                        "quality_threshold_miss",
                    }
                    retry_snapshot["rescue_fidelity_risk"] = rescue_failure_class in {
                        "guardrail_failed",
                        "patch_fidelity_risk",
                    }
                    attempt_record["rescue_failure_class"] = rescue_failure_class

                failure_classification = self._classify_quality_failure(
                    quality_snapshot,
                    continuation_chunk=bool(continuation.prior_summary or continuation.prior_excerpt),
                )
                if (
                    retry_attempts_used < self._MAX_BORDERLINE_RECOVERY_RETRIES
                    and self._is_retry_eligible_quality_failure(
                        failure_classification=failure_classification,
                        rewrite_used=rewrite_used,
                    )
                ):
                    retry_attempts_used += 1
                    retry_snapshot = {
                        "used": True,
                        "succeeded": False,
                        "attempts_used": retry_attempts_used,
                        "max_attempts": self._MAX_BORDERLINE_RECOVERY_RETRIES,
                        "eligible": True,
                        "failure_classification": failure_classification,
                        "reason": failure_classification.get("reason"),
                        "triggered_after_attempt": attempt,
                        "stronger_model_used": False,
                        "rescue_mode_used": True,
                        "rescue_model_used": False,
                        "rescue_model_name": None,
                        "rescue_guardrail_fail": False,
                        "rescue_under_improved": False,
                        "rescue_fidelity_risk": False,
                        "patch_rescue_used": False,
                        "patch_rescue_success": False,
                        "repair_only_pass_used": False,
                        "repair_only_pass_rescued": False,
                        "same_slot_specificity_retry_used": False,
                    }
                    attempt_record["retry_decision"] = {
                        "eligible": True,
                        "reason": failure_classification.get("reason"),
                        "classification": failure_classification.get("classification"),
                    }
                    previous_quality_snapshot = quality_snapshot
                    previous_quality_snapshot["text"] = cleaned
                    current_payload = dict(payload)
                    rescue_contract = self._build_rescue_contract(
                        original_text=cleaned,
                        continuation=continuation,
                        critique_snapshot=critique_snapshot,
                        quality_snapshot=quality_snapshot,
                    )
                    retry_snapshot["rescue_targets_summary"] = {
                        "dialogue_beats_requiring_grounding": list(rescue_contract.get("dialogue_beats_requiring_grounding") or []),
                        "generic_phrases_to_replace": list(rescue_contract.get("generic_phrases_to_replace") or []),
                        "lines_to_repair": list(rescue_contract.get("lines_to_repair") or []),
                        "required_concrete_anchor_terms": list(rescue_contract.get("required_concrete_anchor_terms") or []),
                        "repair_min_word_count": rescue_contract.get("repair_min_word_count"),
                        "repair_max_word_count": rescue_contract.get("repair_max_word_count"),
                        "min_paragraph_count": rescue_contract.get("min_paragraph_count"),
                        "max_paragraph_count": rescue_contract.get("max_paragraph_count"),
                    }
                    current_payload["prompt"] = self._build_rescue_generation_prompt(
                        strategy=rescue_generation_strategy,
                        mode="recovery_retry",
                        original_text=cleaned,
                        latest_text=cleaned,
                        critique_snapshot=critique_snapshot,
                        continuation=continuation,
                        quality_snapshot=quality_snapshot,
                        failure_classification=failure_classification,
                        rescue_contract=rescue_contract,
                        rescue_failure_class=None,
                    )
                    current_payload["system"] = (
                        "Perform a single recovery patch edit. Return JSON only."
                    )
                    current_payload["rescue_contract"] = rescue_contract
                    attempt += 1
                    continue

                if retry_snapshot and retry_snapshot.get("used"):
                    rescue_delta_summary = retry_snapshot.get("rescue_delta_summary") or self._build_rescue_delta_summary(
                        previous_quality_snapshot=previous_quality_snapshot,
                        rewritten_quality_snapshot=quality_snapshot,
                        critique_snapshot=critique_snapshot,
                        rescue_contract=rescue_contract,
                    )
                    rescue_failure_class = self._classify_rescue_failure(
                        previous_quality_snapshot=previous_quality_snapshot,
                        rewritten_quality_snapshot=quality_snapshot,
                        critique_snapshot=critique_snapshot,
                        guardrail_snapshot=guardrail_snapshot,
                        rescue_contract=rescue_contract,
                    )
                    retry_snapshot["rescue_delta_summary"] = rescue_delta_summary
                    retry_snapshot["rescue_failure_class"] = rescue_failure_class
                    retry_snapshot["rescue_guardrail_fail"] = rescue_failure_class == "guardrail_failed"
                    retry_snapshot["rescue_under_improved"] = rescue_failure_class in {
                        "under_improved",
                        "dialogue_grounding_unresolved",
                        "specificity_unresolved",
                        "clarity_unresolved",
                        "generic_replacement_unresolved",
                        "critique_followthrough_weak",
                    }
                    retry_snapshot["rescue_fidelity_risk"] = bool(
                        (guardrail_snapshot or {}).get("failure_reason")
                    )
                    if (
                        attempt_kind == "recovery_retry"
                        and internal_repair_attempts_used < self._MAX_INTERNAL_REPAIR_PASSES
                        and rescue_failure_class in {
                            "dialogue_grounding_unresolved",
                            "specificity_unresolved",
                            "clarity_unresolved",
                            "generic_replacement_unresolved",
                            "under_improved",
                            "critique_followthrough_weak",
                        }
                        and not retry_snapshot["rescue_fidelity_risk"]
                    ):
                        internal_repair_attempts_used += 1
                        retry_snapshot["repair_only_pass_used"] = True
                        retry_snapshot["repair_only_pass_rescued"] = False
                        retry_snapshot["rescue_targets_summary"] = {
                            "dialogue_beats_requiring_grounding": list((rescue_contract or {}).get("dialogue_beats_requiring_grounding") or []),
                            "generic_phrases_to_replace": list((rescue_contract or {}).get("generic_phrases_to_replace") or []),
                            "lines_to_repair": list((rescue_contract or {}).get("lines_to_repair") or []),
                            "required_concrete_anchor_terms": list((rescue_contract or {}).get("required_concrete_anchor_terms") or []),
                            "repair_min_word_count": (rescue_contract or {}).get("repair_min_word_count"),
                            "repair_max_word_count": (rescue_contract or {}).get("repair_max_word_count"),
                            "min_paragraph_count": (rescue_contract or {}).get("min_paragraph_count"),
                            "max_paragraph_count": (rescue_contract or {}).get("max_paragraph_count"),
                        }
                        attempt_record["repair_only_decision"] = {
                            "used": True,
                            "failure_class": rescue_failure_class,
                        }
                        previous_quality_snapshot = quality_snapshot
                        previous_quality_snapshot["text"] = cleaned
                        rescue_contract = self._refresh_rescue_contract_for_current_text(
                            current_text=cleaned,
                            rescue_contract=rescue_contract,
                            continuation=continuation,
                            critique_snapshot=critique_snapshot,
                            quality_snapshot=previous_quality_snapshot,
                        )
                        current_payload = dict(payload)
                        current_payload["prompt"] = self._build_rescue_generation_prompt(
                            strategy=rescue_generation_strategy,
                            mode="repair_only",
                            original_text=cleaned,
                            latest_text=cleaned,
                            critique_snapshot=critique_snapshot or {},
                            continuation=continuation,
                            quality_snapshot=previous_quality_snapshot or {},
                            failure_classification={},
                            rescue_contract=rescue_contract or {},
                            rescue_failure_class=rescue_failure_class,
                        )
                        current_payload["system"] = (
                            "Perform a repair-only edit. Output only narrative prose. "
                            "No analysis, no planning, no headings."
                        )
                        attempt += 1
                        continue
                persist_long_form_diagnostic(
                    project_root,
                    continuation.chunk_id,
                    {
                        "chunk_id": continuation.chunk_id,
                        "validation_decision": False,
                        "fallback_reason": "quality_failed",
                        "attempts": attempt_diagnostics,
                        "quality_snapshot": quality_snapshot,
                        "critique_snapshot": critique_snapshot,
                        "guardrail_snapshot": guardrail_snapshot,
                        "retry_snapshot": retry_snapshot
                        or {
                            "used": False,
                            "succeeded": False,
                            "attempts_used": retry_attempts_used,
                            "max_attempts": self._MAX_BORDERLINE_RECOVERY_RETRIES,
                            "eligible": failure_classification.get("retry_eligible"),
                            "failure_classification": failure_classification,
                            "reason": failure_classification.get("reason"),
                        },
                    },
                )
                self._diagnostics.log(
                    project_root,
                    code="VALIDATION",
                    message="Long-form output rejected (quality threshold).",
                    details={"quality_snapshot": quality_snapshot, "attempts": attempt_diagnostics},
                )
                return (
                    self._fallback_text(continuation),
                    "quality_failed",
                    True,
                    attempt,
                    quality_snapshot,
                    critique_snapshot,
                    "quality_failed",
                    rewrite_used,
                    retry_snapshot
                    or {
                        "used": False,
                        "succeeded": False,
                        "attempts_used": retry_attempts_used,
                        "max_attempts": self._MAX_BORDERLINE_RECOVERY_RETRIES,
                        "eligible": failure_classification.get("retry_eligible"),
                        "failure_classification": failure_classification,
                        "reason": failure_classification.get("reason"),
                    },
                    guardrail_snapshot,
                )
        except AdapterError as exc:
            self._diagnostics.log(
                Path(self._settings.project_base_dir),
                code="ADAPTER",
                message="Long-form adapter failed; falling back.",
                details={"error": str(exc)},
            )
            return (
                self._fallback_text(continuation),
                "adapter_error",
                True,
                1,
                quality_snapshot,
                critique_snapshot,
                "adapter_error",
                rewrite_used,
                retry_snapshot,
                guardrail_snapshot,
            )
        except Exception as exc:  # pragma: no cover - defensive
            self._diagnostics.log(
                Path(self._settings.project_base_dir),
                code="ADAPTER",
                message="Long-form adapter unexpected error; falling back.",
                details={"error": str(exc)},
            )
            return (
                self._fallback_text(continuation),
                "adapter_exception",
                True,
                1,
                quality_snapshot,
                critique_snapshot,
                "adapter_exception",
                rewrite_used,
                retry_snapshot,
                guardrail_snapshot,
            )

    def _build_attempt_model_snapshot(
        self,
        *,
        route: Any | None,
        adapter: BaseAdapter,
        mode: str,
        escalated: bool,
        reason: str,
    ) -> dict[str, Any]:
        provider = route.provider if route is not None else adapter.provider_name
        route_model = route.model.name if route is not None else None
        adapter_model = getattr(adapter.config, "model", None)
        return {
            "provider": provider,
            "model": adapter_model or route_model,
            "baseline_model": route_model or adapter_model,
            "mode": mode,
            "escalated": escalated,
            "reason": reason,
        }

    def _resolve_rescue_adapter(
        self,
        *,
        route: Any | None,
        default_adapter: BaseAdapter,
    ) -> tuple[BaseAdapter, dict[str, Any]]:
        if route is not None and route.provider == "openai":
            model = (
                self._settings.openai_rescue_model
                or self._settings.openai_rewrite_retry_model
                or self._settings.openai_model
            )
            if not isinstance(default_adapter, OpenAIAdapter):
                snapshot = self._build_attempt_model_snapshot(
                    route=route,
                    adapter=default_adapter,
                    mode="recovery_retry",
                    escalated=model != route.model.name,
                    reason="rescue_model_stub",
                )
                snapshot["model"] = model
                return default_adapter, snapshot
            adapter = OpenAIAdapter(
                AdapterConfig(
                    base_url=self._settings.openai_base_url,
                    model=model,
                    timeout_seconds=self._settings.openai_timeout_seconds,
                ),
                api_key=self._settings.openai_api_key,
            )
            return adapter, self._build_attempt_model_snapshot(
                route=route,
                adapter=adapter,
                mode="recovery_retry",
                escalated=model != route.model.name,
                reason="rescue_model",
            )
        if route is not None and route.provider == "local_llm":
            model = (
                self._settings.local_llm_rescue_model
                or self._settings.local_llm_rewrite_retry_model
                or self._settings.local_llm_model
            )
            if not isinstance(default_adapter, OllamaAdapter):
                snapshot = self._build_attempt_model_snapshot(
                    route=route,
                    adapter=default_adapter,
                    mode="recovery_retry",
                    escalated=model != route.model.name,
                    reason="rescue_model_stub",
                )
                snapshot["model"] = model
                return default_adapter, snapshot
            adapter = OllamaAdapter(
                AdapterConfig(
                    base_url=self._settings.local_llm_base_url,
                    model=model,
                    timeout_seconds=self._settings.local_llm_timeout_seconds,
                )
            )
            return adapter, self._build_attempt_model_snapshot(
                route=route,
                adapter=adapter,
                mode="recovery_retry",
                escalated=model != route.model.name,
                reason="rescue_model",
            )
        return default_adapter, self._build_attempt_model_snapshot(
            route=route,
            adapter=default_adapter,
            mode="recovery_retry",
            escalated=False,
            reason="rescue_model_unavailable",
        )

    def _classify_quality_failure(
        self,
        quality_snapshot: dict[str, Any] | None,
        *,
        continuation_chunk: bool,
    ) -> dict[str, Any]:
        if not quality_snapshot:
            return {
                "classification": "hard",
                "reason": "missing_quality_snapshot",
                "retry_eligible": False,
            }
        scores = quality_snapshot.get("scores") or {}
        meta_free = int(scores.get("meta_free") or 0)
        missing_carryover = bool(quality_snapshot.get("missing_carryover"))
        weak_carryover = bool(quality_snapshot.get("weak_carryover"))
        meta_contamination = bool(quality_snapshot.get("meta_contamination")) or bool(
            quality_snapshot.get("meta_summary")
        )
        material_carryover = bool(quality_snapshot.get("material_carryover", True))
        total = int(quality_snapshot.get("total_score") or 0)
        specificity = int(scores.get("specificity") or 0)
        clarity = int(scores.get("clarity") or 0)
        coherence = int(scores.get("coherence") or 0)
        continuity = int(scores.get("continuity") or 0)
        dialogue_present = bool(quality_snapshot.get("dialogue_present"))
        dialogue_grounded = bool(quality_snapshot.get("dialogue_grounded", True))
        concrete_hits = int(quality_snapshot.get("concrete_hits") or 0)

        if meta_free <= 0 or meta_contamination:
            return {
                "classification": "hard",
                "reason": "meta_contamination",
                "retry_eligible": False,
            }
        if missing_carryover or weak_carryover:
            return {
                "classification": "hard",
                "reason": "missing_carryover",
                "retry_eligible": False,
            }
        if continuation_chunk and not material_carryover:
            return {
                "classification": "hard",
                "reason": "material_carryover_missing",
                "retry_eligible": False,
            }
        near_threshold = (
            total >= self._QUALITY_MIN_TOTAL - 2
            and coherence >= self._QUALITY_MIN_COHERENCE
            and continuity >= max(2, self._QUALITY_MIN_CONTINUITY - 1)
            and specificity >= max(3, self._QUALITY_MIN_SPECIFICITY - 2)
            and clarity >= max(2, self._QUALITY_MIN_CLARITY - 1)
        )
        targeted_editorial_miss = (
            coherence >= self._QUALITY_MIN_COHERENCE
            and continuity >= max(3, self._QUALITY_MIN_CONTINUITY - 1)
            and total >= max(20, self._QUALITY_MIN_TOTAL - 9)
            and (
                (dialogue_present and not dialogue_grounded)
                or specificity <= 3
                or clarity <= 3
                or concrete_hits <= 1
            )
        )
        if targeted_editorial_miss:
            return {
                "classification": "targeted_editorial",
                "reason": "targeted_editorial_miss_after_rewrite",
                "retry_eligible": True,
            }
        if near_threshold:
            return {
                "classification": "borderline",
                "reason": "borderline_quality_after_rewrite",
                "retry_eligible": True,
            }
        return {
            "classification": "hard",
            "reason": "quality_threshold_miss",
            "retry_eligible": False,
        }

    def _is_retry_eligible_quality_failure(
        self,
        *,
        failure_classification: dict[str, Any],
        rewrite_used: bool,
    ) -> bool:
        return rewrite_used and bool(failure_classification.get("retry_eligible"))

    def _build_recovery_retry_prompt(
        self,
        *,
        original_text: str,
        critique_snapshot: dict[str, Any] | None,
        continuation,
        quality_snapshot: dict[str, Any] | None,
        failure_classification: dict[str, Any],
        rescue_contract: dict[str, Any],
    ) -> str:
        rescue_slots = rescue_contract.get("rescue_slots") or []
        scores = (quality_snapshot or {}).get("scores") or {}
        unresolved: list[str] = []
        if int((quality_snapshot or {}).get("total_score") or 0) < self._QUALITY_MIN_TOTAL:
            unresolved.append(f"Raise total score to at least {self._QUALITY_MIN_TOTAL}.")
        if int(scores.get("specificity") or 0) < self._QUALITY_MIN_SPECIFICITY:
            unresolved.append("Increase scene-specific detail and avoid generic wording.")
        if int(scores.get("clarity") or 0) < self._QUALITY_MIN_CLARITY:
            unresolved.append("Make actions and spatial beats easier to follow.")
        if int(scores.get("continuity") or 0) < self._QUALITY_MIN_CONTINUITY:
            unresolved.append("Strengthen continuity without recapping.")
        if bool(quality_snapshot.get("dialogue_present")) and not bool(
            quality_snapshot.get("dialogue_grounded", True)
        ):
            unresolved.append(
                "Attach each important spoken beat to a visible action, handled object, or nearby setting cue."
            )
        unresolved_text = "\n".join(f"- {item}" for item in unresolved) if unresolved else "- Tighten the weakest remaining quality dimensions."
        subject_entities = ", ".join(rescue_contract.get("subject_entities") or []) or "Keep the same speaker/subject roster."
        scene_anchors = ", ".join(rescue_contract.get("scene_anchors") or []) or "Preserve the same scene anchors."
        dialogue_lines = "\n".join(
            f"- {line}" for line in (rescue_contract.get("dialogue_lines") or [])
        ) or "- Preserve the same dialogue beats and ground them in action."
        dialogue_targets = "\n".join(
            f"- {line}" for line in (rescue_contract.get("dialogue_beats_requiring_grounding") or [])
        ) or "- No unresolved dialogue grounding targets."
        generic_targets = "\n".join(
            f"- {line}" for line in (rescue_contract.get("generic_phrases_to_replace") or [])
        ) or "- No explicit generic phrase replacements required."
        local_lines = "\n".join(
            f"- {line}" for line in (rescue_contract.get("lines_to_repair") or [])
        ) or "- Patch only the weakest local lines if repair is needed."
        anchor_terms = ", ".join(rescue_contract.get("required_concrete_anchor_terms") or []) or "Use the existing scene anchors."
        scene_state_text = self._format_rescue_scene_state(
            continuation=continuation,
            rescue_contract=rescue_contract,
        )
        rescue_slots_text = json.dumps(rescue_slots, ensure_ascii=False, indent=2)
        return (
            "Precision patch rescue.\n"
            f"CHAPTER: {continuation.chapter_memory.chapter_context or continuation.chapter_id}\n"
            f"SCENE OUTLINE TITLES: {' | '.join(continuation.chapter_memory.scene_titles) if continuation.chapter_memory.scene_titles else 'Unknown'}\n"
            f"SCENE BEAT REFS: {', '.join(continuation.chapter_memory.beat_refs) if continuation.chapter_memory.beat_refs else 'None'}\n"
            f"LOCKED FACTS: {'; '.join(continuation.chapter_memory.locked_facts) if continuation.chapter_memory.locked_facts else 'None'}\n"
            f"SUBJECT ENTITIES: {subject_entities}\n"
            f"SCENE ANCHORS: {scene_anchors}\n"
            f"LENGTH BAND: {rescue_contract.get('min_word_count')} to {rescue_contract.get('max_word_count')} words\n"
            f"PRIOR SUMMARY: {continuation.prior_summary or 'No prior summary.'}\n"
            f"{scene_state_text}"
            f"PRIOR EXCERPT: {continuation.prior_excerpt or 'None'}\n"
            f"REWRITE GOALS: {', '.join(critique_snapshot.get('rewrite_goals') or []) if critique_snapshot else 'Improve the scene without changing its story function.'}\n"
            "PRECISION RESCUE RULES:\n"
            "This is the only allowed recovery retry after a borderline rewrite miss.\n"
            f"Retry reason: {failure_classification.get('reason')}\n"
            "Use the stronger rewrite model path as a precision editor, not as a freeform rewriter.\n"
            "Keep the same subject, same scene premise, same location, and same core action sequence.\n"
            "Do not invent new named people, places, objects with story significance, twists, or causal events.\n"
            "Do not swap the scene subject or broaden the scope of the scene.\n"
            "Do not compress the scene into a summary or expand it into a larger sequence.\n"
            "Preserve the dialogue beats already present, but ground them in gesture, object handling, movement, or environment when relevant.\n"
            "When SCENE STATE is present and relevant to the targeted slot, use at least one scene-state element to ground or concretize the replacement.\n"
            "Edit only the specified slots. Do not rewrite untouched paragraphs.\n"
            "Return JSON only.\n"
            "UNRESOLVED QUALITY TARGETS:\n"
            f"{unresolved_text}\n"
            "LINES / BEATS TO REPAIR:\n"
            f"{local_lines}\n"
            "DIALOGUE BEATS TO PRESERVE AND GROUND:\n"
            f"{dialogue_lines}\n\n"
            "TARGETED DIALOGUE BEATS REQUIRING GROUNDING:\n"
            f"{dialogue_targets}\n"
            "GENERIC PHRASES TO REPLACE:\n"
            f"{generic_targets}\n"
            "REQUIRED CONCRETE ANCHOR TERMS:\n"
            f"- {anchor_terms}\n"
            "HARD RESCUE OBLIGATIONS:\n"
            f"- Add at least {rescue_contract.get('minimum_action_cues_to_add')} visible action/gesture/object cues across the targeted beats.\n"
            "- Every targeted dialogue beat must gain nearby action, gesture, handled object, or setting cue.\n"
            "- For every dialogue-targeted slot, borrow at least one concrete local anchor term from that slot's context_before or context_after fields and use it inside the replacement_text.\n"
            "- The borrowed dialogue anchor must be a nearby object, surface, place element, weather cue, or other visible setting/body noun from the neighboring context, not just a generic voice or mood word.\n"
            "- Every dialogue-targeted replacement must pair that borrowed local anchor with one visible action, body cue, or object interaction in the same slot.\n"
            "- Every targeted generic phrase must be replaced with one concrete physical, sensory, or object-level detail in the replacement span.\n"
            "- For every specificity-targeted replacement span, name at least one local concrete cue: a handled object, body part, visible action, or setting surface. Abstract mood language alone does not count.\n"
            "- For every specificity-targeted slot, keep the same subject, local action intent, and scene role, but replace the vague wording with at least one literal nearby detail taken from the slot or its context_before/context_after fields: object, body cue, visible action, surface/material, or setting element.\n"
            "- If the original slot is social or emotional, make the replacement physically observable on the page instead of describing a mood cloud, vibe, or metaphorical state.\n"
            "- Do not answer a vague sentence with another metaphor. Replace the weak wording with literal scene detail on the page.\n"
            "- Replace the exact weak line, not just its mood; keep the same meaning but make the line more observable on the page.\n"
            f"- Raise specificity by at least {rescue_contract.get('minimum_specificity_delta')} if targeted, or add concrete scene detail.\n"
            f"- Raise clarity by at least {rescue_contract.get('minimum_clarity_delta')} if targeted.\n\n"
            "RESCUE SLOTS JSON:\n"
            f"{rescue_slots_text}\n\n"
            "Return exactly this schema:\n"
            "{\"patches\":[{\"slot_id\":\"s1\",\"replacement_text\":\"replacement span only\"}]}\n\n"
            "ORIGINAL SCENE:\n"
            f"{original_text}\n"
        )

    def _build_repair_only_prompt(
        self,
        *,
        latest_text: str,
        continuation,
        rescue_contract: dict[str, Any],
        rescue_failure_class: str,
    ) -> str:
        rescue_slots = rescue_contract.get("rescue_slots") or []
        local_lines = "\n".join(
            f"- {line}" for line in (rescue_contract.get("lines_to_repair") or [])
        ) or "- Patch only the unresolved weak lines."
        dialogue_targets = "\n".join(
            f"- {line}" for line in (rescue_contract.get("dialogue_beats_requiring_grounding") or [])
        ) or "- No unresolved dialogue targets."
        generic_targets = "\n".join(
            f"- {line}" for line in (rescue_contract.get("generic_phrases_to_replace") or [])
        ) or "- No unresolved generic targets."
        scene_state_text = self._format_rescue_scene_state(
            continuation=continuation,
            rescue_contract=rescue_contract,
        )
        rescue_slots_text = json.dumps(rescue_slots, ensure_ascii=False, indent=2)
        return (
            "Repair-only patch rescue pass.\n"
            "The prior rescue stayed fidelity-safe but still missed one editorial target.\n"
            f"Failure class: {rescue_failure_class}\n"
            "Patch only the unresolved weaknesses. Keep the rest of the scene intact.\n"
            "Do not add new entities, events, or scene directions.\n"
            f"CHAPTER: {continuation.chapter_memory.chapter_context or continuation.chapter_id}\n"
            f"LENGTH BAND: {rescue_contract.get('min_word_count')} to {rescue_contract.get('max_word_count')} words\n"
            f"REPAIR-ONLY LOCAL LENGTH BAND: {rescue_contract.get('repair_min_word_count')} to {rescue_contract.get('repair_max_word_count')} words\n"
            f"PARAGRAPH BAND: {rescue_contract.get('min_paragraph_count')} to {rescue_contract.get('max_paragraph_count')} paragraphs\n"
            f"{scene_state_text}"
            "UNRESOLVED LINES / BEATS:\n"
            f"{local_lines}\n"
            "UNRESOLVED DIALOGUE GROUNDING TARGETS:\n"
            f"{dialogue_targets}\n"
            "UNRESOLVED GENERIC TARGETS:\n"
            f"{generic_targets}\n"
            "PATCH RULES:\n"
            "- Return JSON only.\n"
            "- Keep dialogue order and overall paragraph flow where possible.\n"
            "- Preserve approximately the same paragraph count and scene beat count.\n"
            "- Add only the missing action/gesture/object cues or concrete physical or sensory details on the targeted lines.\n"
            "- When SCENE STATE is present and relevant, use at least one scene-state element to ground or concretize the targeted replacement.\n"
            "- For each dialogue-targeted slot, borrow at least one concrete local anchor term from that slot's context_before or context_after fields and use it inside the replacement_text.\n"
            "- The borrowed dialogue anchor must be a nearby object, surface, place element, weather cue, or other visible setting/body noun from neighboring context, not just a generic voice or mood word.\n"
            "- Pair that borrowed local anchor with one visible action, body cue, or object interaction in the same dialogue replacement.\n"
            "- For each specificity-targeted patch, add literal local detail in the replacement span: object, body, surface, movement, or setting cue. Metaphor by itself does not count.\n"
            "- For each specificity-targeted slot, preserve the same subject, local action intent, and scene role, and pull at least one literal nearby detail from the slot or its context_before/context_after fields.\n"
            "- Replace abstract crowd/mood language with something physically observable on the page: clothing, hands, eyes, pavement, wall, breath, sound, weather, or another local material cue.\n"
            "- Replace the exact weak phrase in the targeted span; do not answer with another vague paraphrase.\n"
            "- If a targeted slot has unit_type=sentence, replacement_text must be one full sentence, not a clause fragment, and should stay close to the original slot's local scope and length.\n"
            "- Do not compress the scene into a short excerpt, summary, or tail fragment.\n"
            "- Do not broadly rephrase already acceptable sections.\n"
            "RESCUE SLOTS JSON:\n"
            f"{rescue_slots_text}\n"
            "Return exactly this schema:\n"
            "{\"patches\":[{\"slot_id\":\"s1\",\"replacement_text\":\"replacement span only\"}]}\n\n"
            "CURRENT SCENE:\n"
            f"{latest_text}\n"
        )

    def _build_local_rewrite_block_prompt(
        self,
        *,
        original_text: str,
        latest_text: str,
        continuation,
        rescue_contract: dict[str, Any],
        mode: str,
        rescue_failure_class: str | None,
        failure_classification: dict[str, Any] | None,
    ) -> str:
        rescue_slots = rescue_contract.get("rescue_slots") or []
        rescue_slots_text = json.dumps(rescue_slots, ensure_ascii=False, indent=2)
        scene_state_text = self._format_rescue_scene_state(
            continuation=continuation,
            rescue_contract=rescue_contract,
        )
        shared_header = (
            "Bounded local rewrite rescue.\n"
            "Rewrite only the provided local excerpts. Do not rewrite the whole scene.\n"
            "Preserve the same subject, local action intent, scene role, and outline-faithful meaning.\n"
            "Do not invent new named entities, causal events, or story turns.\n"
            "For dialogue-targeted excerpts, keep the same spoken beat but anchor it in one borrowed local noun from context_before/context_after plus one visible action, object interaction, or body cue.\n"
            "For generic-targeted excerpts, replace vague wording with literal local concrete detail.\n"
            "When SCENE STATE is present and relevant, use at least one scene-state element inside the rewritten excerpt to ground or concretize the local beat.\n"
            "Return JSON only.\n"
            "Schema:\n"
            "{\"rewrites\":[{\"slot_id\":\"s1\",\"rewritten_excerpt\":\"rewritten bounded excerpt only\"}]}\n\n"
            f"CHAPTER: {continuation.chapter_memory.chapter_context or continuation.chapter_id}\n"
            f"LENGTH BAND: {rescue_contract.get('min_word_count')} to {rescue_contract.get('max_word_count')} words\n"
            f"{scene_state_text}"
            "LOCAL REWRITE EXCERPTS JSON:\n"
            f"{rescue_slots_text}\n\n"
        )
        if mode == "repair_only":
            return (
                shared_header
                + f"Failure class: {rescue_failure_class or 'under_improved'}\n"
                + "Repair only the unresolved local excerpts.\n"
                + "CURRENT SCENE:\n"
                + latest_text
                + "\n"
            )
        return (
            shared_header
            + f"Retry reason: {(failure_classification or {}).get('reason')}\n"
            + "ORIGINAL SCENE:\n"
            + original_text
            + "\n"
        )

    def _build_rescue_generation_prompt(
        self,
        *,
        strategy: str,
        mode: str,
        original_text: str,
        latest_text: str,
        continuation,
        critique_snapshot: dict[str, Any] | None,
        quality_snapshot: dict[str, Any] | None,
        failure_classification: dict[str, Any] | None,
        rescue_contract: dict[str, Any],
        rescue_failure_class: str | None,
    ) -> str:
        active_strategy = self._resolve_rescue_generation_strategy(strategy=strategy, mode=mode)
        if active_strategy == "local_rewrite_block":
            active_text = latest_text or original_text
            rewrite_contract = dict(rescue_contract or {})
            rewrite_contract["rescue_slots"] = self._materialize_rescue_generation_slots(
                current_text=active_text,
                rescue_contract=rescue_contract,
                strategy=active_strategy,
            )
            return self._build_local_rewrite_block_prompt(
                original_text=original_text,
                latest_text=latest_text,
                continuation=continuation,
                rescue_contract=rewrite_contract,
                mode=mode,
                rescue_failure_class=rescue_failure_class,
                failure_classification=failure_classification,
            )
        if active_strategy == "structured_slot_patch":
            return self._build_structured_slot_patch_prompt(
                latest_text=latest_text or original_text,
                continuation=continuation,
                rescue_contract=rescue_contract,
                repair_plan=[],
                mode=mode,
                rescue_failure_class=rescue_failure_class,
            )
        if mode == "repair_only":
            return self._build_repair_only_prompt(
                latest_text=latest_text,
                continuation=continuation,
                rescue_contract=rescue_contract,
                rescue_failure_class=rescue_failure_class or "under_improved",
            )
        return self._build_recovery_retry_prompt(
            original_text=original_text,
            critique_snapshot=critique_snapshot,
            continuation=continuation,
            quality_snapshot=quality_snapshot,
            failure_classification=failure_classification or {},
            rescue_contract=rescue_contract,
        )

    def _resolve_rescue_generation_strategy(self, *, strategy: str, mode: str) -> str:
        normalized = str(strategy or "slot_patch").strip() or "slot_patch"
        if normalized != "hybrid_escalation":
            return normalized
        if mode == "repair_only":
            return "local_rewrite_block"
        return "slot_patch"

    def _build_structured_repair_plan_prompt(
        self,
        *,
        latest_text: str,
        continuation,
        rescue_contract: dict[str, Any],
        rescue_slots: list[dict[str, Any]],
        mode: str,
        rescue_failure_class: str | None,
    ) -> str:
        rescue_slots_text = json.dumps(rescue_slots, ensure_ascii=False, indent=2)
        scene_state_text = self._format_rescue_scene_state(
            continuation=continuation,
            rescue_contract=rescue_contract,
        )
        return (
            "Structured slot repair planning.\n"
            "Create a tiny bounded repair plan for each targeted rescue slot.\n"
            "Do not write final prose yet.\n"
            "Keep the plan local to the slot and its immediate context.\n"
            "Preserve the same subject or speaker, local meaning, and scene role.\n"
            "Return JSON only.\n"
            "Schema:\n"
            "{\"plans\":[{\"slot_id\":\"s1\",\"subject_or_speaker\":\"...\",\"physical_anchor\":\"...\",\"environmental_anchor\":\"...\",\"action_or_interaction\":\"...\",\"preserve_meaning\":\"...\",\"preserve_scene_role\":\"...\"}]}\n\n"
            f"CHAPTER: {continuation.chapter_memory.chapter_context or continuation.chapter_id}\n"
            f"{scene_state_text}"
            f"MODE: {mode}\n"
            f"FAILURE CLASS: {rescue_failure_class or 'under_improved'}\n"
            "RULES:\n"
            "- Use only local slot context plus neighboring context_before/context_after.\n"
            "- For dialogue slots, include at least one concrete grounding anchor and one visible action or interaction.\n"
            "- For specificity slots, include at least one literal concrete detail.\n"
            "- Metaphor alone does not count.\n"
            "- Do not invent new named entities or story turns.\n"
            "RESCUE SLOTS JSON:\n"
            f"{rescue_slots_text}\n\n"
            "CURRENT SCENE:\n"
            f"{latest_text}\n"
        )

    def _build_structured_slot_patch_prompt(
        self,
        *,
        latest_text: str,
        continuation,
        rescue_contract: dict[str, Any],
        repair_plan: list[dict[str, Any]],
        mode: str,
        rescue_failure_class: str | None,
    ) -> str:
        rescue_slots_text = json.dumps(rescue_contract.get("rescue_slots") or [], ensure_ascii=False, indent=2)
        plan_text = json.dumps(repair_plan, ensure_ascii=False, indent=2)
        scene_state_text = self._format_rescue_scene_state(
            continuation=continuation,
            rescue_contract=rescue_contract,
        )
        return (
            "Structured slot patch rescue.\n"
            "Write replacement_text only for the targeted slots.\n"
            "Use the repair plan as a hard local constraint.\n"
            "Stay within each slot. Do not rewrite untouched text.\n"
            "Preserve subject, local intent, and scene role.\n"
            "Use at least one concrete grounding element from the repair plan in each replacement.\n"
            "Avoid metaphor-only repairs.\n"
            "Return JSON only.\n"
            "Schema:\n"
            "{\"patches\":[{\"slot_id\":\"s1\",\"replacement_text\":\"replacement span only\"}]}\n\n"
            f"CHAPTER: {continuation.chapter_memory.chapter_context or continuation.chapter_id}\n"
            f"{scene_state_text}"
            f"MODE: {mode}\n"
            f"FAILURE CLASS: {rescue_failure_class or 'under_improved'}\n"
            "REPAIR PLAN JSON:\n"
            f"{plan_text}\n\n"
            "RESCUE SLOTS JSON:\n"
            f"{rescue_slots_text}\n\n"
            "CURRENT SCENE:\n"
            f"{latest_text}\n"
        )

    def _parse_repair_plan_response(self, response_text: str | None) -> list[dict[str, Any]] | None:
        if not response_text:
            return None
        try:
            payload = json.loads(response_text)
        except (TypeError, ValueError):
            return None
        plans = payload.get("plans") if isinstance(payload, dict) else None
        if not isinstance(plans, list):
            return None
        normalized: list[dict[str, Any]] = []
        for item in plans:
            if not isinstance(item, dict):
                continue
            slot_id = str(item.get("slot_id") or "").strip()
            if not slot_id:
                continue
            normalized.append(
                {
                    "slot_id": slot_id,
                    "subject_or_speaker": str(item.get("subject_or_speaker") or "").strip(),
                    "physical_anchor": str(item.get("physical_anchor") or "").strip(),
                    "environmental_anchor": str(item.get("environmental_anchor") or "").strip(),
                    "action_or_interaction": str(item.get("action_or_interaction") or "").strip(),
                    "preserve_meaning": str(item.get("preserve_meaning") or "").strip(),
                    "preserve_scene_role": str(item.get("preserve_scene_role") or "").strip(),
                }
            )
        return normalized or None

    def _generate_structured_rescue_candidate(
        self,
        *,
        adapter,
        payload: dict[str, Any],
        continuation,
        project_root: Path,
        call_mode: str,
        latest_text: str,
        rescue_contract: dict[str, Any],
        rescue_slots: list[dict[str, Any]],
    ) -> dict[str, Any]:
        plan_payload = dict(payload)
        plan_payload["prompt"] = self._build_structured_repair_plan_prompt(
            latest_text=latest_text,
            continuation=continuation,
            rescue_contract=rescue_contract,
            rescue_slots=rescue_slots,
            mode=call_mode,
            rescue_failure_class=None,
        )
        plan_payload["system"] = "Create a bounded structured repair plan. Return JSON only."
        plan_candidate = self._generate_candidate(
            adapter=adapter,
            payload=plan_payload,
            continuation=continuation,
            project_root=project_root,
            call_mode=call_mode,
        )
        if plan_candidate.get("adapter_error"):
            return plan_candidate
        repair_plan = self._parse_repair_plan_response(plan_candidate.get("text"))
        prose_payload = dict(payload)
        prose_payload["prompt"] = self._build_structured_slot_patch_prompt(
            latest_text=latest_text,
            continuation=continuation,
            rescue_contract=rescue_contract,
            repair_plan=repair_plan or [],
            mode=call_mode,
            rescue_failure_class=None,
        )
        prose_payload["system"] = "Perform a structured slot patch edit. Return JSON only."
        prose_candidate = self._generate_candidate(
            adapter=adapter,
            payload=prose_payload,
            continuation=continuation,
            project_root=project_root,
            call_mode=call_mode,
        )
        prose_candidate["repair_plan"] = repair_plan
        prose_candidate["repair_plan_raw_preview"] = plan_candidate.get("raw_preview")
        return prose_candidate

    def _materialize_rescue_generation_slots(
        self,
        *,
        current_text: str,
        rescue_contract: dict[str, Any],
        strategy: str,
    ) -> list[dict[str, Any]]:
        rescue_slots = list((rescue_contract or {}).get("rescue_slots") or [])
        if strategy != "local_rewrite_block":
            return rescue_slots
        materialized: list[dict[str, Any]] = []
        for slot in rescue_slots:
            focus_text = str(slot.get("original_text") or "").strip()
            if not focus_text:
                continue
            excerpt = self._build_local_rewrite_excerpt(
                current_text=current_text,
                focus_text=focus_text,
                context_before=str(slot.get("context_before") or ""),
                context_after=str(slot.get("context_after") or ""),
            )
            rewritten = dict(slot)
            rewritten["focus_text"] = focus_text
            rewritten["original_text"] = excerpt
            rewritten["unit_type"] = "local_excerpt"
            materialized.append(rewritten)
        return materialized

    def _build_local_rewrite_excerpt(
        self,
        *,
        current_text: str,
        focus_text: str,
        context_before: str,
        context_after: str,
    ) -> str:
        if focus_text and focus_text in current_text:
            pieces = [segment.strip() for segment in (context_before, focus_text, context_after) if segment and segment.strip()]
            excerpt = " ".join(pieces).strip()
            if excerpt and excerpt in current_text:
                return excerpt
        rebound = self._find_best_local_patch_unit(
            current_text=current_text,
            target_text=focus_text,
        )
        if rebound:
            return rebound
        return focus_text

    def _format_rescue_scene_state(
        self,
        *,
        continuation,
        rescue_contract: dict[str, Any],
    ) -> str:
        if not bool(self._settings.rescue_scene_state_enabled):
            return ""
        scene_state = self._build_rescue_scene_state(
            continuation=continuation,
            rescue_contract=rescue_contract,
        )
        if not any(scene_state.values()):
            return ""
        return (
            "SCENE STATE:\n"
            f"- characters_present: {', '.join(scene_state['characters_present']) if scene_state['characters_present'] else 'None'}\n"
            f"- location: {scene_state['location'] or 'Unknown'}\n"
            f"- active_action_or_threat: {scene_state['active_action_or_threat'] or 'None'}\n"
            f"- notable_objects_or_environmental_anchors: {', '.join(scene_state['notable_objects_or_environmental_anchors']) if scene_state['notable_objects_or_environmental_anchors'] else 'None'}\n"
        )

    def _build_rescue_scene_state(
        self,
        *,
        continuation,
        rescue_contract: dict[str, Any],
    ) -> dict[str, Any]:
        chapter_memory = continuation.chapter_memory
        location = (
            str(((getattr(continuation, "continuity_snapshot", None) or {}).get("location") or "")).strip()
            or " | ".join(chapter_memory.scene_titles or [])
            or ""
        )
        characters_present = [
            item
            for item in list(rescue_contract.get("subject_entities") or [])[:4]
            if str(item).strip()
        ]
        anchor_candidates: list[str] = []
        for term in list(rescue_contract.get("required_concrete_anchor_terms") or []) + list(
            rescue_contract.get("scene_anchors") or []
        ):
            cleaned = str(term).strip()
            if cleaned and cleaned not in anchor_candidates:
                anchor_candidates.append(cleaned)
        action_candidates: list[str] = []
        for item in list(rescue_contract.get("unresolved_targets") or []) + list(
            rescue_contract.get("lines_to_repair") or []
        ):
            cleaned = str(item).strip()
            if cleaned and cleaned not in action_candidates:
                action_candidates.append(cleaned)
        return {
            "characters_present": characters_present[:4],
            "location": location,
            "active_action_or_threat": action_candidates[0] if action_candidates else "",
            "notable_objects_or_environmental_anchors": anchor_candidates[:4],
        }

    def _build_same_slot_retry_contract(
        self,
        *,
        rescue_contract: dict[str, Any] | None,
        slot_ids: list[str],
    ) -> dict[str, Any]:
        filtered = dict(rescue_contract or {})
        wanted = {str(slot_id).strip() for slot_id in slot_ids if str(slot_id).strip()}
        slots = [slot for slot in (filtered.get("rescue_slots") or []) if str(slot.get("slot_id") or "").strip() in wanted]
        filtered["rescue_slots"] = slots
        filtered["lines_to_repair"] = [str(slot.get("original_text") or "").strip() for slot in slots if str(slot.get("original_text") or "").strip()]
        filtered["dialogue_beats_requiring_grounding"] = [
            str(slot.get("original_text") or "").strip()
            for slot in slots
            if str(slot.get("target_type") or "") == "dialogue" and str(slot.get("original_text") or "").strip()
        ]
        filtered["generic_phrases_to_replace"] = [
            str(slot.get("target_phrase") or "").strip()
            for slot in slots
            if str(slot.get("target_phrase") or "").strip()
        ]
        return filtered

    def _build_same_slot_specificity_retry_prompt(
        self,
        *,
        latest_text: str,
        continuation,
        rescue_contract: dict[str, Any],
        retry_mode: str,
    ) -> str:
        rescue_slots = rescue_contract.get("rescue_slots") or []
        rescue_slots_text = json.dumps(rescue_slots, ensure_ascii=False, indent=2)
        return (
            "Same-slot literal specificity retry.\n"
            f"MODE: {retry_mode}\n"
            "The prior bounded slot patch stayed vague or metaphorical.\n"
            "Regenerate only the same slot ids shown below. Do not reselect, merge, or expand slots.\n"
            "Keep the same subject, local action intent, and scene role.\n"
            "Stay inside each bounded slot only.\n"
            "Do not invent new named entities, story events, or scene directions.\n"
            "Literal checklist:\n"
            "- Add at least one literal local object, body cue, visible action, surface/material, or setting element inside the replacement slot.\n"
            "- Pull the concrete cue from the slot itself or its context_before/context_after fields.\n"
            "- Metaphor alone does not count.\n"
            "- If the line is social or emotional, make it physically observable on the page.\n"
            "- Keep the replacement fidelity-safe and locally bounded.\n"
            "RESCUE SLOTS JSON:\n"
            f"{rescue_slots_text}\n"
            "Return exactly this schema:\n"
            "{\"patches\":[{\"slot_id\":\"s1\",\"replacement_text\":\"replacement span only\"}]}\n\n"
            "CURRENT SCENE:\n"
            f"{latest_text}\n"
            f"CHAPTER: {continuation.chapter_memory.chapter_context or continuation.chapter_id}\n"
        )

    def _evaluate_repair_only_local_constraints(
        self,
        *,
        previous_text: str | None,
        repaired_text: str,
        rescue_contract: dict[str, Any] | None,
    ) -> dict[str, Any]:
        previous_word_count = len((previous_text or "").split())
        repaired_word_count = len(repaired_text.split())
        previous_paragraph_count = max(
            1, len([seg for seg in (previous_text or "").split("\n\n") if seg.strip()])
        )
        repaired_paragraph_count = max(
            1, len([seg for seg in repaired_text.split("\n\n") if seg.strip()])
        )
        min_words = int(
            (rescue_contract or {}).get("repair_min_word_count")
            or max(80, int(previous_word_count * self._REPAIR_ONLY_LENGTH_LOWER_RATIO))
        )
        max_words = int(
            (rescue_contract or {}).get("repair_max_word_count")
            or max(min_words + 20, int(previous_word_count * self._REPAIR_ONLY_LENGTH_UPPER_RATIO))
        )
        min_paragraphs = int(
            (rescue_contract or {}).get("min_paragraph_count")
            or max(1, previous_paragraph_count - self._REPAIR_ONLY_PARAGRAPH_TOLERANCE)
        )
        max_paragraphs = int(
            (rescue_contract or {}).get("max_paragraph_count")
            or previous_paragraph_count + self._REPAIR_ONLY_PARAGRAPH_TOLERANCE
        )
        within_word_band = min_words <= repaired_word_count <= max_words
        within_paragraph_band = min_paragraphs <= repaired_paragraph_count <= max_paragraphs
        failure_reason = None
        if not within_word_band:
            failure_reason = "repair_length_collapse"
        elif not within_paragraph_band:
            failure_reason = "repair_paragraph_collapse"
        return {
            "evaluated": True,
            "previous_word_count": previous_word_count,
            "repaired_word_count": repaired_word_count,
            "min_word_count": min_words,
            "max_word_count": max_words,
            "within_word_band": within_word_band,
            "previous_paragraph_count": previous_paragraph_count,
            "repaired_paragraph_count": repaired_paragraph_count,
            "min_paragraph_count": min_paragraphs,
            "max_paragraph_count": max_paragraphs,
            "within_paragraph_band": within_paragraph_band,
            "accepted": failure_reason is None,
            "failure_reason": failure_reason,
        }

    def _build_rescue_slots(
        self,
        *,
        original_text: str,
        continuation,
        critique_snapshot: dict[str, Any] | None,
        quality_snapshot: dict[str, Any] | None,
        rescue_contract: dict[str, Any],
    ) -> list[dict[str, Any]]:
        targets: list[dict[str, Any]] = []
        seen: set[str] = set()

        def add_target(
            target_text: str,
            target_type: str,
            target_phrase: str | None = None,
            *,
            unit_type: str = "sentence",
            target_reason: str | None = None,
        ) -> None:
            cleaned = target_text.strip()
            if not cleaned or cleaned in seen or len(targets) >= 12:
                return
            if target_type == "dialogue" and any(
                cleaned in existing or existing in cleaned for existing in seen
            ):
                return
            seen.add(cleaned)
            context_before, context_after = self._slot_context(original_text, cleaned)
            target: dict[str, Any] = {
                "slot_id": f"s{len(targets) + 1}",
                "unit_type": unit_type,
                "target_type": target_type,
                "original_text": cleaned,
                "context_before": context_before,
                "context_after": context_after,
                "target_reason": target_reason or target_type,
            }
            if target_type == "dialogue":
                local_anchor_terms = self._dialogue_local_anchor_terms(
                    context_before=context_before,
                    context_after=context_after,
                )
                if local_anchor_terms:
                    target["local_anchor_terms"] = local_anchor_terms
            if target_phrase:
                target["target_phrase"] = target_phrase
            targets.append(target)

        for line in rescue_contract.get("lines_to_repair") or []:
            lowered = line.lower()
            target_type = "generic"
            phrase = None
            for generic_phrase in rescue_contract.get("generic_phrases_to_replace") or []:
                if generic_phrase.lower() in lowered:
                    phrase = generic_phrase
                    break
            if line in (rescue_contract.get("dialogue_beats_requiring_grounding") or []) or '"' in line:
                target_type = "dialogue"
            elif continuation.prior_summary and any(term in lowered for term in (quality_snapshot or {}).get("carryover_terms") or []):
                target_type = "carryover"
            unit_text = line
            unit_type = "sentence"
            if target_type == "dialogue":
                refined_dialogue = self._select_dialogue_patch_unit(
                    current_text=original_text,
                    target_text=line,
                    target_phrase=phrase,
                    required_anchor_terms=list(rescue_contract.get("required_concrete_anchor_terms") or []),
                )
                if refined_dialogue is None:
                    continue
                unit_text, unit_type = refined_dialogue
            add_target(unit_text, target_type, phrase, unit_type=unit_type)

        for line in rescue_contract.get("dialogue_beats_requiring_grounding") or []:
            refined_dialogue = self._select_dialogue_patch_unit(
                current_text=original_text,
                target_text=line,
                required_anchor_terms=list(rescue_contract.get("required_concrete_anchor_terms") or []),
            )
            if refined_dialogue is None:
                continue
            unit_text, unit_type = refined_dialogue
            add_target(
                unit_text,
                "dialogue",
                unit_type=unit_type,
                target_reason="dialogue_grounding",
            )

        for line in self._extract_sentences_with_phrase_markers(original_text, limit=4)[1]:
            phrase = None
            lowered = line.lower()
            for generic_phrase in rescue_contract.get("generic_phrases_to_replace") or []:
                if generic_phrase.lower() in lowered:
                    phrase = generic_phrase
                    break
            add_target(line, "generic", phrase, target_reason="specificity")

        if not targets:
            fallback_generic_lines = self._extract_vague_emotional_sentences(original_text, limit=3)
            for line in fallback_generic_lines:
                add_target(line, "generic", target_reason="specificity")

        return targets[:12]

    def _normalize_patch_target_text(self, text: str | None) -> str:
        normalized = (text or "").strip().lower()
        normalized = normalized.replace("“", '"').replace("”", '"').replace("’", "'").replace("—", "-")
        normalized = re.sub(r"\s+", " ", normalized)
        normalized = re.sub(r"[^\w\s\"'-]", "", normalized)
        return normalized.strip()

    def _extract_vague_emotional_sentences(self, text: str | None, *, limit: int = 3) -> list[str]:
        if not text:
            return []
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        matches: list[str] = []
        for sentence in sentences:
            lowered = sentence.lower()
            if not any(marker in lowered for marker in self._VAGUE_SENTENCE_MARKERS):
                continue
            cleaned = sentence.strip()
            if cleaned and cleaned not in matches:
                matches.append(cleaned)
            if len(matches) >= limit:
                break
        return matches

    def _extract_sentence_windows(self, text: str | None) -> list[str]:
        if not text:
            return []
        sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", text.strip()) if sentence.strip()]
        windows: list[str] = []
        for index, sentence in enumerate(sentences):
            if sentence not in windows:
                windows.append(sentence)
            if index + 1 < len(sentences):
                combined = f"{sentence} {sentences[index + 1]}".strip()
                if combined not in windows:
                    windows.append(combined)
        return windows

    def _looks_like_dialogue_fragment(self, text: str | None) -> bool:
        candidate = str(text or "").strip()
        if not candidate:
            return False
        if candidate.endswith(("...", "…", ",", "—", "-", ";", ":")):
            return True
        quote_markers = candidate.count('"') + candidate.count("â€œ") + candidate.count("â€")
        if quote_markers == 1:
            return True
        normalized = re.sub(r'["â€œâ€]', "", candidate).strip()
        return len(normalized.split()) <= 2

    def _dialogue_slot_needs_grounding(self, text: str | None) -> bool:
        candidate = str(text or "").strip()
        if not candidate:
            return False
        quality = score_long_form_quality(candidate)
        if bool(quality.get("dialogue_present")) and bool(quality.get("dialogue_grounded")):
            return False
        return not self._dialogue_span_has_grounding_cue(candidate)

    def _select_dialogue_patch_unit(
        self,
        *,
        current_text: str,
        target_text: str,
        target_phrase: str | None = None,
        required_anchor_terms: list[str] | None = None,
    ) -> tuple[str, str] | None:
        rebound = self._find_best_local_patch_unit(
            current_text=current_text,
            target_text=target_text,
            target_phrase=target_phrase,
            required_anchor_terms=required_anchor_terms,
        )
        unit_text = (rebound or target_text or "").strip()
        if not unit_text:
            return None
        unit_type = "sentence_window" if rebound and rebound != target_text else "sentence"
        normalized_target = self._normalize_patch_target_text(target_text)
        candidate_windows = [
            window
            for window in self._extract_sentence_windows(current_text)
            if normalized_target
            and normalized_target in self._normalize_patch_target_text(window)
            and window.strip() != unit_text
        ]
        if self._looks_like_dialogue_fragment(unit_text):
            forward_windows = [window for window in candidate_windows if window.strip().startswith(unit_text)]
            for window in forward_windows + candidate_windows:
                if len(window.split()) > len(unit_text.split()):
                    unit_text = window.strip()
                    unit_type = "sentence_window"
                    break
        if self._dialogue_slot_needs_grounding(unit_text):
            for window in candidate_windows:
                if self._dialogue_span_has_grounding_cue(window):
                    return None
            return unit_text, unit_type
        return None

    def _slot_context(self, text: str | None, slot_text: str) -> tuple[str, str]:
        sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", (text or "").strip()) if sentence.strip()]
        if not sentences or not slot_text:
            return "", ""
        for index, sentence in enumerate(sentences):
            if sentence == slot_text:
                before = sentences[index - 1] if index > 0 else ""
                after = sentences[index + 1] if index + 1 < len(sentences) else ""
                return before, after
        for index in range(len(sentences) - 1):
            combined = f"{sentences[index]} {sentences[index + 1]}".strip()
            if combined == slot_text:
                before = sentences[index - 1] if index > 0 else ""
                after = sentences[index + 2] if index + 2 < len(sentences) else ""
                return before, after
        return "", ""

    def _find_best_local_patch_unit(
        self,
        *,
        current_text: str,
        target_text: str,
        target_phrase: str | None = None,
        required_anchor_terms: list[str] | None = None,
    ) -> str | None:
        windows = self._extract_sentence_windows(current_text)
        normalized_target = self._normalize_patch_target_text(target_text)
        normalized_phrase = self._normalize_patch_target_text(target_phrase)
        anchor_terms = [self._normalize_patch_target_text(term) for term in (required_anchor_terms or []) if term]

        if target_text.strip() and target_text.strip() in current_text:
            return target_text.strip()
        for window in windows:
            normalized_window = self._normalize_patch_target_text(window)
            if normalized_target and normalized_window == normalized_target:
                return window
            if normalized_target and (
                normalized_target in normalized_window or normalized_window in normalized_target
            ):
                return window
            if normalized_phrase and normalized_phrase in normalized_window:
                return window
        if normalized_target:
            request_tokens = set(token for token in normalized_target.split() if len(token) > 2)
            best_window: str | None = None
            best_score = 0.0
            for window in windows:
                normalized_window = self._normalize_patch_target_text(window)
                window_tokens = set(token for token in normalized_window.split() if len(token) > 2)
                if not request_tokens or not window_tokens:
                    continue
                overlap = len(request_tokens & window_tokens) / max(len(request_tokens), len(window_tokens))
                if anchor_terms and not any(term in normalized_window for term in anchor_terms):
                    overlap *= 0.85
                if overlap >= 0.35 and overlap > best_score:
                    best_window = window
                    best_score = overlap
            if best_window is not None:
                return best_window
        if anchor_terms:
            paragraphs = [paragraph.strip() for paragraph in current_text.split("\n\n") if paragraph.strip()]
            for paragraph in paragraphs:
                normalized_paragraph = self._normalize_patch_target_text(paragraph)
                if any(term in normalized_paragraph for term in anchor_terms):
                    return paragraph
        return windows[0] if windows else None

    def _refresh_rescue_contract_for_current_text(
        self,
        *,
        current_text: str,
        rescue_contract: dict[str, Any] | None,
        continuation,
        critique_snapshot: dict[str, Any] | None,
        quality_snapshot: dict[str, Any] | None,
    ) -> dict[str, Any]:
        refreshed = dict(rescue_contract or {})
        refreshed_lines: list[str] = []
        refreshed_dialogue_lines: list[str] = []
        refreshed_generic_phrases: list[str] = []
        anchor_terms = list(refreshed.get("required_concrete_anchor_terms") or [])
        source_targets = list((rescue_contract or {}).get("rescue_slots") or [])

        for target in source_targets:
            if not isinstance(target, dict):
                continue
            target_text = str(target.get("original_text") or "").strip()
            target_phrase = str(target.get("target_phrase") or "").strip() or None
            local_unit = self._find_best_local_patch_unit(
                current_text=current_text,
                target_text=target_text,
                target_phrase=target_phrase,
                required_anchor_terms=anchor_terms,
            )
            if not local_unit:
                continue
            if local_unit not in refreshed_lines:
                refreshed_lines.append(local_unit)
            if target_phrase and target_phrase.lower() in current_text.lower() and target_phrase not in refreshed_generic_phrases:
                refreshed_generic_phrases.append(target_phrase)
            if str(target.get("target_type") or "") == "dialogue" and local_unit not in refreshed_dialogue_lines:
                refreshed_dialogue_lines.append(local_unit)

        if not refreshed_lines:
            refreshed_lines.extend(self._extract_vague_emotional_sentences(current_text, limit=3))
        if not refreshed_dialogue_lines and (
            bool((critique_snapshot or {}).get("dialogue_grounding_targets"))
            or bool((critique_snapshot or {}).get("grounding_targets"))
        ):
            refreshed_dialogue_lines.extend(self._extract_dialogue_lines(current_text))
        refreshed["lines_to_repair"] = refreshed_lines[:6]
        refreshed["dialogue_beats_requiring_grounding"] = refreshed_dialogue_lines[:4]
        if refreshed_generic_phrases:
            refreshed["generic_phrases_to_replace"] = refreshed_generic_phrases[:4]
        refreshed["rescue_slots"] = self._build_rescue_slots(
            original_text=current_text,
            continuation=continuation,
            critique_snapshot=critique_snapshot,
            quality_snapshot=quality_snapshot,
            rescue_contract={
                "lines_to_repair": refreshed["lines_to_repair"],
                "dialogue_beats_requiring_grounding": refreshed["dialogue_beats_requiring_grounding"],
                "generic_phrases_to_replace": list(refreshed.get("generic_phrases_to_replace") or []),
                "required_concrete_anchor_terms": anchor_terms,
            },
        )
        return refreshed

    def _find_rescue_slot(
        self,
        *,
        patched_text: str,
        rescue_slots: list[dict[str, Any]],
        slot_id: str,
    ) -> tuple[dict[str, Any] | None, str | None]:
        normalized_slot_id = str(slot_id or "").strip()
        target_by_id = {
            str(target.get("slot_id")): target
            for target in rescue_slots
            if isinstance(target, dict) and target.get("slot_id")
        }
        target = target_by_id.get(normalized_slot_id)
        if target is None:
            legacy_match = re.fullmatch(r"p(\d+)", normalized_slot_id.lower())
            if legacy_match:
                legacy_index = int(legacy_match.group(1)) - 1
                if 0 <= legacy_index < len(rescue_slots):
                    candidate = rescue_slots[legacy_index]
                    if isinstance(candidate, dict):
                        target = candidate
        if target:
            target_text = str(target.get("original_text") or "").strip()
            if target_text and target_text in patched_text:
                return target, target_text
            rebound_target_text = self._find_best_local_patch_unit(
                current_text=patched_text,
                target_text=target_text,
                target_phrase=str(target.get("target_phrase") or "").strip() or None,
                required_anchor_terms=list(target.get("anchor_terms") or []),
            )
            if rebound_target_text and rebound_target_text in patched_text:
                return target, rebound_target_text
        return None, None

    def _is_dialogue_span(self, text: str | None) -> bool:
        candidate = str(text or "")
        return any(marker in candidate for marker in {'"', "“", "”"})

    def _parse_patch_response(self, raw_text: str | None) -> list[dict[str, Any]] | None:
        if not isinstance(raw_text, str) or not raw_text.strip():
            return None
        normalized = raw_text.strip()
        if normalized.startswith("```"):
            lines = normalized.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            normalized = "\n".join(lines).strip()
        if normalized and not normalized.startswith("{") and not normalized.startswith("["):
            start = normalized.find("{")
            end = normalized.rfind("}")
            if start != -1 and end != -1 and end > start:
                normalized = normalized[start : end + 1]
        try:
            payload = json.loads(normalized)
        except json.JSONDecodeError:
            return None
        if isinstance(payload, dict):
            patches = payload.get("patches")
            if not isinstance(patches, list):
                patches = payload.get("rewrites")
        else:
            patches = payload
        if not isinstance(patches, list):
            return None
        normalized_patches: list[dict[str, Any]] = []
        for patch in patches:
            if not isinstance(patch, dict):
                continue
            span_id = str(patch.get("slot_id") or patch.get("span_id") or "").strip()
            replacement_text = str(
                patch.get("replacement_text") or patch.get("rewritten_excerpt") or ""
            ).strip()
            if not span_id or not replacement_text:
                continue
            normalized_patches.append(
                {
                    "slot_id": span_id,
                    "replacement_text": replacement_text,
                }
            )
        return normalized_patches or None

    def _validate_and_apply_patch_response(
        self,
        *,
        source_text: str,
        rescue_slots: list[dict[str, Any]],
        patch_response: list[dict[str, Any]] | None,
        continuation,
        rescue_contract: dict[str, Any],
        mode: str,
    ) -> dict[str, Any]:
        if not patch_response:
            return {"accepted": False, "failure_class": "patch_parse_failed"}
        allowed_names = (
            self._capitalized_terms(source_text)
            | self._capitalized_terms(continuation.prior_summary)
            | self._capitalized_terms(continuation.prior_excerpt)
            | self._capitalized_terms(" ".join(continuation.chapter_memory.scene_titles or []))
            | self._capitalized_terms(" ".join(continuation.chapter_memory.locked_facts or []))
        )
        patched_text = source_text
        patch_snapshots: list[dict[str, Any]] = []
        for patch in patch_response:
            slot_id = str(patch.get("slot_id"))
            target, target_text = self._find_rescue_slot(
                patched_text=patched_text,
                rescue_slots=rescue_slots,
                slot_id=slot_id,
            )
            if not target or not target_text:
                return {"accepted": False, "failure_class": "patch_target_missing"}
            replacement_text = str(patch.get("replacement_text") or "")
            target_type = str(target.get("target_type") or "generic")
            focus_text = str(target.get("focus_text") or target_text)
            if self._is_dialogue_span(focus_text):
                target_type = "dialogue"
            target_phrase = str(target.get("target_phrase") or "").lower()
            lowered_replacement = replacement_text.lower()
            if target_type == "dialogue":
                if self._is_dialogue_span(focus_text) and not self._is_dialogue_span(replacement_text):
                    return {"accepted": False, "failure_class": "patch_dialogue_grounding_unresolved"}
                if not self._dialogue_span_has_grounding_cue(replacement_text):
                    return {"accepted": False, "failure_class": "patch_dialogue_grounding_unresolved"}
                if not self._dialogue_replacement_uses_local_anchor(replacement_text, target):
                    return {"accepted": False, "failure_class": "patch_dialogue_grounding_unresolved"}
                original_grounding_signals = self._dialogue_grounding_signal_count(focus_text)
                replacement_grounding_signals = self._dialogue_grounding_signal_count(replacement_text)
                if replacement_grounding_signals <= original_grounding_signals:
                    return {"accepted": False, "failure_class": "patch_dialogue_grounding_unresolved"}
            if target_type == "generic" and target_phrase and target_phrase in lowered_replacement:
                return {"accepted": False, "failure_class": "patch_generic_replacement_unresolved"}
            target_word_count = max(1, len(target_text.split()))
            replacement_word_count = len(replacement_text.split())
            min_ratio = 0.6 if mode == "repair_only" else 0.45
            max_ratio = 1.8 if mode == "repair_only" else 2.4
            if replacement_word_count < int(target_word_count * min_ratio) or replacement_word_count > int(target_word_count * max_ratio) + 8:
                return {"accepted": False, "failure_class": "patch_length_distortion"}
            if not self._local_patch_fidelity_ok(
                source_text=source_text,
                target_text=target_text,
                replacement_text=replacement_text,
                allowed_names=allowed_names,
                rescue_contract=rescue_contract,
            ):
                return {"accepted": False, "failure_class": "patch_fidelity_risk"}
            if target_type == "generic":
                target_quality = score_long_form_quality(target_text)
                replacement_quality = score_long_form_quality(replacement_text)
                target_specificity_signals = self._generic_specificity_signal_count(target_text)
                replacement_specificity_signals = self._generic_specificity_signal_count(replacement_text)
                if (
                    int(replacement_quality.get("concrete_hits") or 0) < 1
                    and int(replacement_quality.get("sensory_hits") or 0) < 1
                    and not any(self._marker_present(replacement_text, marker) for marker in self._PATCH_SETTING_MARKERS)
                    and not any(self._marker_present(replacement_text, marker) for marker in self._PATCH_SENSORY_MARKERS)
                    and not any(self._marker_present(replacement_text, marker) for marker in self._PATCH_ACTION_MARKERS)
                ):
                    return {"accepted": False, "failure_class": "patch_specificity_unresolved"}
                if (
                    replacement_specificity_signals <= target_specificity_signals
                    and int(replacement_quality.get("concrete_hits") or 0)
                    <= int(target_quality.get("concrete_hits") or 0)
                    and int(replacement_quality.get("sensory_hits") or 0)
                    <= int(target_quality.get("sensory_hits") or 0)
                ):
                    return {"accepted": False, "failure_class": "patch_specificity_unresolved"}
                if replacement_specificity_signals <= target_specificity_signals + 1:
                    literal_local_gain = (
                        any(self._marker_present(replacement_text, marker) for marker in self._PATCH_ACTION_MARKERS)
                        or any(self._marker_present(replacement_text, marker) for marker in self._PATCH_SETTING_MARKERS)
                    ) and (
                        any(self._marker_present(replacement_text, marker) for marker in self._PATCH_SENSORY_MARKERS)
                        or int(replacement_quality.get("concrete_hits") or 0) > int(target_quality.get("concrete_hits") or 0)
                    )
                    if not literal_local_gain:
                        return {"accepted": False, "failure_class": "patch_specificity_unresolved"}
            patched_text = patched_text.replace(target_text, replacement_text, 1)
            patch_snapshots.append(
                {
                    "slot_id": slot_id,
                    "unit_type": str(target.get("unit_type") or "sentence"),
                    "target_type": target_type,
                    "target_text": target_text,
                    "replacement_text": replacement_text,
                    "target_word_count": target_word_count,
                    "replacement_word_count": replacement_word_count,
                }
            )
        if not patch_snapshots:
            return {"accepted": False, "failure_class": "patch_under_applied"}
        return {
            "accepted": True,
            "patched_text": patched_text,
            "patch_snapshots": patch_snapshots,
        }

    def _extract_dialogue_lines(self, text: str | None, *, limit: int = 4) -> list[str]:
        if not text:
            return []
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        lines: list[str] = []
        for sentence in sentences:
            cleaned = sentence.strip()
            if not cleaned:
                continue
            if any(marker in cleaned for marker in ('"', "“", "”", "â€œ", "â€")) and cleaned not in lines:
                lines.append(cleaned)
            if len(lines) >= limit:
                break
        return lines

    def _marker_present(self, text: str | None, marker: str) -> bool:
        normalized_text = str(text or "").lower()
        normalized_marker = marker.lower().strip()
        if not normalized_text or not normalized_marker:
            return False
        pattern = r"\b" + re.escape(normalized_marker).replace(r"\ ", r"\s+") + r"\b"
        return re.search(pattern, normalized_text) is not None

    def _dialogue_grounding_signal_count(self, text: str | None) -> int:
        markers = set(self._PATCH_ACTION_MARKERS) | set(self._PATCH_SENSORY_MARKERS) | set(self._PATCH_SETTING_MARKERS)
        return sum(1 for marker in markers if self._marker_present(text, marker))

    def _dialogue_span_has_grounding_cue(self, text: str | None) -> bool:
        has_action = any(self._marker_present(text, marker) for marker in self._PATCH_ACTION_MARKERS)
        has_anchor = any(
            self._marker_present(text, marker) for marker in self._PATCH_SENSORY_MARKERS + self._PATCH_SETTING_MARKERS
        )
        return has_action and has_anchor

    def _dialogue_replacement_uses_local_anchor(
        self,
        replacement_text: str | None,
        target: dict[str, Any] | None,
    ) -> bool:
        replacement = str(replacement_text or "")
        if not replacement:
            return False
        explicit_local_terms = [
            str(term).strip().lower()
            for term in list((target or {}).get("local_anchor_terms") or [])
            if str(term).strip()
        ]
        if explicit_local_terms:
            return any(self._marker_present(replacement, term) for term in explicit_local_terms)
        context_terms = set(self._anchor_terms(str((target or {}).get("context_before") or ""), limit=10))
        context_terms.update(self._anchor_terms(str((target or {}).get("context_after") or ""), limit=10))
        context_terms.difference_update(
            {
                "voice",
                "words",
                "word",
                "line",
                "look",
                "gaze",
                "eyes",
                "face",
                "hand",
                "hands",
                "body",
                "shoulder",
                "shoulders",
            }
        )
        context_markers = {
            term
            for term in context_terms
            if term in self._PATCH_SETTING_MARKERS or term in self._PATCH_SENSORY_MARKERS
        }
        if not context_markers:
            return True
        return any(self._marker_present(replacement, marker) for marker in context_markers)

    def _dialogue_local_anchor_terms(
        self,
        *,
        context_before: str,
        context_after: str,
    ) -> list[str]:
        context_terms = []
        for term in self._anchor_terms(f"{context_before} {context_after}", limit=12):
            if term in {
                "voice",
                "words",
                "word",
                "line",
                "look",
                "gaze",
                "eyes",
                "face",
                "hand",
                "hands",
                "body",
                "shoulder",
                "shoulders",
            }:
                continue
            if (
                term in self._PATCH_SETTING_MARKERS
                or term in self._PATCH_SENSORY_MARKERS
                or term in {"shadow", "dust", "stone", "wall", "sun", "hair", "wheel", "metal"}
            ):
                if term not in context_terms:
                    context_terms.append(term)
        return context_terms[:4]

    def _generic_specificity_signal_count(self, text: str | None) -> int:
        markers = set(self._PATCH_ACTION_MARKERS) | set(self._PATCH_SENSORY_MARKERS) | set(self._PATCH_SETTING_MARKERS)
        return sum(1 for marker in markers if self._marker_present(text, marker))

    def _local_patch_fidelity_ok(
        self,
        *,
        source_text: str,
        target_text: str,
        replacement_text: str,
        allowed_names: set[str],
        rescue_contract: dict[str, Any] | None,
    ) -> bool:
        replacement_name_counts = self._capitalized_term_counts(replacement_text)
        source_lower_tokens = set(re.findall(r"\b[a-z]{3,}\b", f"{source_text} {target_text}".lower()))
        unexpected_names = [
            term
            for term, count in replacement_name_counts.items()
            if term not in allowed_names and term not in source_lower_tokens and count > 0
        ]
        if unexpected_names:
            return False

        target_anchors = set(self._anchor_terms(target_text, limit=8))
        replacement_anchors = set(self._anchor_terms(replacement_text, limit=8))
        required_anchors = set(str(term).lower() for term in ((rescue_contract or {}).get("required_concrete_anchor_terms") or []))
        if target_anchors and not (target_anchors & replacement_anchors):
            if required_anchors and not (required_anchors & replacement_anchors):
                return False
        return True

    def _extract_sentences_with_terms(
        self,
        text: str | None,
        terms: list[str],
        *,
        limit: int = 4,
    ) -> list[str]:
        if not text or not terms:
            return []
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        matches: list[str] = []
        lowered_terms = [term.lower() for term in terms if term]
        for sentence in sentences:
            lowered = sentence.lower()
            if any(term in lowered for term in lowered_terms):
                cleaned = sentence.strip()
                if cleaned and cleaned not in matches:
                    matches.append(cleaned)
            if len(matches) >= limit:
                break
        return matches

    def _extract_sentences_with_phrase_markers(
        self,
        text: str | None,
        *,
        limit: int = 4,
    ) -> tuple[list[str], list[str]]:
        if not text:
            return [], []
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        phrases: list[str] = []
        matches: list[str] = []
        for sentence in sentences:
            lowered = sentence.lower()
            hit_phrases = [
                phrase for phrase in self._GENERIC_REPLACEMENT_PHRASES if phrase in lowered
            ]
            if not hit_phrases:
                continue
            for phrase in hit_phrases:
                if phrase not in phrases:
                    phrases.append(phrase)
            cleaned = sentence.strip()
            if cleaned and cleaned not in matches:
                matches.append(cleaned)
            if len(matches) >= limit:
                break
        return phrases[:limit], matches[:limit]

    def _build_rescue_contract(
        self,
        *,
        original_text: str,
        continuation,
        critique_snapshot: dict[str, Any] | None,
        quality_snapshot: dict[str, Any] | None,
    ) -> dict[str, Any]:
        original_word_count = len(original_text.split())
        min_words, max_words = self._rewrite_length_bounds(max(1, original_word_count))
        subject_entities = sorted(
            self._capitalized_terms(original_text)
            | self._capitalized_terms(continuation.prior_summary)
            | self._capitalized_terms(continuation.prior_excerpt)
            | self._capitalized_terms(" ".join(continuation.chapter_memory.scene_titles or []))
        )
        scene_anchors = []
        for term in self._anchor_terms(
            " ".join(
                [
                    original_text,
                    continuation.prior_summary or "",
                    continuation.prior_excerpt or "",
                    " ".join(continuation.chapter_memory.scene_titles or []),
                    " ".join(continuation.chapter_memory.locked_facts or []),
                ]
            ),
            limit=10,
        ):
            if term not in scene_anchors:
                scene_anchors.append(term)
        unresolved_targets = list((critique_snapshot or {}).get("rewrite_goals") or [])
        generic_targets = [
            str(item).strip()
            for item in (
                (critique_snapshot or {}).get("generic_phrase_targets")
                or (critique_snapshot or {}).get("replacement_targets")
                or []
            )
            if str(item).strip()
        ]
        generic_phrases_to_replace = [
            target for target in generic_targets if target.lower() in original_text.lower()
        ][:4]
        generic_marker_phrases, generic_target_lines = self._extract_sentences_with_phrase_markers(
            original_text,
            limit=4,
        )
        for phrase in generic_marker_phrases:
            if phrase not in generic_phrases_to_replace:
                generic_phrases_to_replace.append(phrase)
        generic_phrases_to_replace = generic_phrases_to_replace[:4]
        dialogue_beats_requiring_grounding = []
        dialogue_targeted = bool((critique_snapshot or {}).get("dialogue_grounding_targets")) or bool(
            (critique_snapshot or {}).get("grounding_targets")
        )
        if bool(quality_snapshot.get("dialogue_present")) and (
            not bool(quality_snapshot.get("dialogue_grounded", True)) or dialogue_targeted
        ):
            unresolved_targets.append("Ground dialogue in visible action or setting.")
            dialogue_beats_requiring_grounding = self._extract_dialogue_lines(original_text)
        lines_to_repair = []
        lines_to_repair.extend(
            self._extract_sentences_with_terms(original_text, generic_phrases_to_replace, limit=3)
        )
        lines_to_repair.extend(
            line for line in generic_target_lines if line not in lines_to_repair
        )
        lines_to_repair.extend(
            line
            for line in dialogue_beats_requiring_grounding
            if line not in lines_to_repair
        )
        filtered_anchor_terms = [
            term
            for term in scene_anchors
            if len(term) >= 4
            and term
            not in {
                "that",
                "with",
                "have",
                "from",
                "they",
                "room",
                "felt",
                "silence",
                "moment",
                "things",
                "everything",
                "nothing",
                "their",
                "there",
                "looked",
                "waited",
            }
        ]
        original_paragraph_count = max(
            1,
            len([seg for seg in original_text.split("\n\n") if seg.strip()]),
        )
        rescue_slots = self._build_rescue_slots(
            original_text=original_text,
            continuation=continuation,
            critique_snapshot=critique_snapshot,
            quality_snapshot=quality_snapshot,
            rescue_contract={
                "lines_to_repair": lines_to_repair[:6],
                "dialogue_beats_requiring_grounding": dialogue_beats_requiring_grounding[:4],
                "generic_phrases_to_replace": generic_phrases_to_replace,
                "required_concrete_anchor_terms": (filtered_anchor_terms or scene_anchors)[:3],
            },
        )
        return {
            "subject_entities": subject_entities[:8],
            "scene_anchors": scene_anchors[:10],
            "dialogue_lines": self._extract_dialogue_lines(original_text),
            "dialogue_beats_requiring_grounding": dialogue_beats_requiring_grounding[:4],
            "generic_phrases_to_replace": generic_phrases_to_replace,
            "lines_to_repair": lines_to_repair[:6],
            "required_concrete_anchor_terms": (filtered_anchor_terms or scene_anchors)[:3],
            "minimum_action_cues_to_add": 2 if dialogue_beats_requiring_grounding else 1,
            "minimum_specificity_delta": 1,
            "minimum_clarity_delta": 1,
            "min_word_count": min_words,
            "max_word_count": max_words,
            "repair_min_word_count": max(80, int(original_word_count * self._REPAIR_ONLY_LENGTH_LOWER_RATIO)),
            "repair_max_word_count": max(120, int(original_word_count * self._REPAIR_ONLY_LENGTH_UPPER_RATIO)),
            "original_paragraph_count": original_paragraph_count,
            "min_paragraph_count": max(1, original_paragraph_count - self._REPAIR_ONLY_PARAGRAPH_TOLERANCE),
            "max_paragraph_count": original_paragraph_count + self._REPAIR_ONLY_PARAGRAPH_TOLERANCE,
            "original_word_count": original_word_count,
            "unresolved_targets": unresolved_targets[:8],
            "rescue_slots": rescue_slots,
        }

    def _build_rescue_delta_summary(
        self,
        *,
        previous_quality_snapshot: dict[str, Any] | None,
        rewritten_quality_snapshot: dict[str, Any] | None,
        critique_snapshot: dict[str, Any] | None,
        rescue_contract: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        previous_scores = (previous_quality_snapshot or {}).get("scores") or {}
        rewritten_scores = (rewritten_quality_snapshot or {}).get("scores") or {}
        weaknesses = " ".join(
            str(item).lower() for item in (critique_snapshot or {}).get("weaknesses") or []
        )
        dialogue_targets = bool((critique_snapshot or {}).get("dialogue_grounding_targets")) or "dialogue" in weaknesses
        return {
            "total_delta": int((rewritten_quality_snapshot or {}).get("total_score") or 0)
            - int((previous_quality_snapshot or {}).get("total_score") or 0),
            "specificity_delta": int(rewritten_scores.get("specificity") or 0)
            - int(previous_scores.get("specificity") or 0),
            "clarity_delta": int(rewritten_scores.get("clarity") or 0)
            - int(previous_scores.get("clarity") or 0),
            "continuity_delta": int(rewritten_scores.get("continuity") or 0)
            - int(previous_scores.get("continuity") or 0),
            "dialogue_delta": int(rewritten_scores.get("dialogue") or 0)
            - int(previous_scores.get("dialogue") or 0),
            "concrete_delta": int((rewritten_quality_snapshot or {}).get("concrete_hits") or 0)
            - int((previous_quality_snapshot or {}).get("concrete_hits") or 0),
            "stock_phrase_delta": int((previous_quality_snapshot or {}).get("stock_phrase_hits") or 0)
            - int((rewritten_quality_snapshot or {}).get("stock_phrase_hits") or 0),
            "dialogue_grounding_fixed": bool(
                (rewritten_quality_snapshot or {}).get("dialogue_grounded")
            )
            and not bool((previous_quality_snapshot or {}).get("dialogue_grounded", True)),
            "dialogue_grounding_targeted": dialogue_targets,
            "specificity_target_met": int(rewritten_scores.get("specificity") or 0)
            > int(previous_scores.get("specificity") or 0),
            "clarity_target_met": int(rewritten_scores.get("clarity") or 0)
            > int(previous_scores.get("clarity") or 0),
            "generic_replacement_target_met": int((previous_quality_snapshot or {}).get("stock_phrase_hits") or 0)
            > int((rewritten_quality_snapshot or {}).get("stock_phrase_hits") or 0),
            "concrete_target_met": int((rewritten_quality_snapshot or {}).get("concrete_hits") or 0)
            >= int((previous_quality_snapshot or {}).get("concrete_hits") or 0) + 2,
            "local_specificity_credit": self._rescue_contract_has_local_specificity_credit(rescue_contract),
        }

    def _classify_rescue_failure(
        self,
        *,
        previous_quality_snapshot: dict[str, Any] | None,
        rewritten_quality_snapshot: dict[str, Any] | None,
        critique_snapshot: dict[str, Any] | None,
        guardrail_snapshot: dict[str, Any] | None,
        rescue_contract: dict[str, Any] | None = None,
    ) -> str:
        if (guardrail_snapshot or {}).get("failure_reason"):
            return "guardrail_failed"
        rescue_delta_summary = self._build_rescue_delta_summary(
            previous_quality_snapshot=previous_quality_snapshot,
            rewritten_quality_snapshot=rewritten_quality_snapshot,
            critique_snapshot=critique_snapshot,
            rescue_contract=rescue_contract,
        )
        if rescue_delta_summary.get("dialogue_grounding_targeted") and not rescue_delta_summary.get(
            "dialogue_grounding_fixed"
        ) and not bool((rewritten_quality_snapshot or {}).get("dialogue_grounded", True)):
            return "dialogue_grounding_unresolved"
        if not bool(rescue_delta_summary.get("generic_replacement_target_met")) and int(
            (previous_quality_snapshot or {}).get("stock_phrase_hits") or 0
        ) > 0:
            return "generic_replacement_unresolved"
        if not bool(rescue_delta_summary.get("clarity_target_met")) and int(
            (((previous_quality_snapshot or {}).get("scores") or {}).get("clarity") or 0)
        ) <= self._QUALITY_MIN_CLARITY:
            return "clarity_unresolved"
        if (
            int((rewritten_quality_snapshot or {}).get("concrete_hits") or 0)
            <= int((previous_quality_snapshot or {}).get("concrete_hits") or 0)
            and int(((rewritten_quality_snapshot or {}).get("scores") or {}).get("specificity") or 0)
            <= int(((previous_quality_snapshot or {}).get("scores") or {}).get("specificity") or 0)
            and not bool(rescue_delta_summary.get("local_specificity_credit"))
        ):
            return "specificity_unresolved"
        if (
            int(rescue_delta_summary.get("total_delta") or 0) <= 0
            and int(rescue_delta_summary.get("specificity_delta") or 0) <= 0
            and int(rescue_delta_summary.get("clarity_delta") or 0) <= 0
            and int(rescue_delta_summary.get("concrete_delta") or 0) <= 0
            and not bool(rescue_delta_summary.get("local_specificity_credit"))
        ):
            return "under_improved"
        if not self._rewrite_targets_aligned(
            previous_quality_snapshot=previous_quality_snapshot,
            rewritten_quality_snapshot=rewritten_quality_snapshot,
            critique_snapshot=critique_snapshot,
            continuation_chunk=False,
        ) and not self._rewrite_targets_aligned(
            previous_quality_snapshot=previous_quality_snapshot,
            rewritten_quality_snapshot=rewritten_quality_snapshot,
            critique_snapshot=critique_snapshot,
            continuation_chunk=True,
        ):
            return "critique_followthrough_weak"
        return "quality_threshold_miss"

    def _rewrite_length_bounds(self, original_word_count: int) -> tuple[int, int]:
        min_words = max(80, int(original_word_count * self._REWRITE_LENGTH_LOWER_RATIO))
        max_words = max(min_words + 40, int(original_word_count * self._REWRITE_LENGTH_UPPER_RATIO))
        return min_words, max_words

    def _anchor_terms(self, text: str | None, *, limit: int = 12) -> list[str]:
        if not text:
            return []
        words = re.findall(r"[A-Za-z][A-Za-z'-]{2,}", text.lower())
        stopwords = {
            "about", "after", "again", "along", "around", "before", "being", "between",
            "could", "every", "first", "from", "into", "just", "like", "maybe", "might",
            "other", "over", "still", "their", "there", "these", "those", "through",
            "under", "until", "while", "with", "would",
        }
        counts = Counter(word for word in words if word not in stopwords)
        return [term for term, _ in counts.most_common(limit)]

    def _capitalized_terms(self, text: str | None) -> set[str]:
        if not text:
            return set()
        tokens = re.findall(r"\b[A-Z][a-z]{2,}\b", text)
        return {token.lower() for token in tokens if token.lower() not in self._BLOCKED_CAPITALIZED_TERMS}

    def _capitalized_term_counts(self, text: str | None) -> Counter[str]:
        if not text:
            return Counter()
        tokens = re.findall(r"\b[A-Z][a-z]{2,}\b", text)
        return Counter(
            token.lower() for token in tokens if token.lower() not in self._BLOCKED_CAPITALIZED_TERMS
        )

    def _evaluate_rewrite_guardrails(
        self,
        *,
        original_text: str | None,
        fallback_original_text: str | None,
        rewritten_text: str,
        continuation,
        chapter_memory,
        quality_snapshot: dict[str, Any] | None,
        mode: str,
    ) -> dict[str, Any]:
        source_text = original_text or fallback_original_text or ""
        original_word_count = len(source_text.split())
        rewritten_word_count = len(rewritten_text.split())
        min_words, max_words = self._rewrite_length_bounds(max(1, original_word_count))
        within_length_band = min_words <= rewritten_word_count <= max_words

        original_anchor_terms = self._anchor_terms(source_text)
        context_terms = self._anchor_terms(
            " ".join(
                [
                    continuation.prior_summary or "",
                    continuation.prior_excerpt or "",
                    " ".join(chapter_memory.scene_titles or []),
                    " ".join(chapter_memory.locked_facts or []),
                ]
            )
        )
        rewritten_anchor_terms = set(self._anchor_terms(rewritten_text, limit=18))
        retained_anchors = [term for term in original_anchor_terms if term in rewritten_anchor_terms]
        outline_anchor_hits = [term for term in context_terms if term in rewritten_anchor_terms]
        required_overlap = 1 if original_anchor_terms else 0
        scene_anchor_drift = bool(
            required_overlap
            and len(retained_anchors) < required_overlap
            and not outline_anchor_hits
        )

        authoritative_names = self._capitalized_terms(continuation.prior_summary)
        authoritative_names.update(self._capitalized_terms(continuation.prior_excerpt))
        authoritative_names.update(self._capitalized_terms(" ".join(chapter_memory.scene_titles or [])))
        authoritative_names.update(self._capitalized_terms(" ".join(chapter_memory.locked_facts or [])))
        allowed_names = set(authoritative_names)
        allowed_names.update(self._capitalized_terms(source_text))
        authoritative_name_check = bool(authoritative_names)
        rewritten_name_counts = self._capitalized_term_counts(rewritten_text)
        introduced_names = sorted(
            term
            for term, count in rewritten_name_counts.items()
            if count > 1 and term not in allowed_names
        )
        blocking_new_story_elements = introduced_names if authoritative_name_check else []
        outline_fidelity_pass = not scene_anchor_drift and not blocking_new_story_elements

        failure_reason = None
        if not within_length_band:
            failure_reason = "length_band_failed"
        elif blocking_new_story_elements:
            failure_reason = "outline_drift_detected"
        elif scene_anchor_drift:
            failure_reason = "scene_anchor_drift_detected"

        return {
            "evaluated": True,
            "mode": mode,
            "outline_titles": list(chapter_memory.scene_titles or []),
            "beat_refs": list(chapter_memory.beat_refs or []),
            "locked_facts_evaluated": bool(chapter_memory.locked_facts),
            "length_band_evaluated": True,
            "original_word_count": original_word_count,
            "rewritten_word_count": rewritten_word_count,
            "min_word_count": min_words,
            "max_word_count": max_words,
            "within_length_band": within_length_band,
            "outline_fidelity_evaluated": True,
            "outline_fidelity_pass": outline_fidelity_pass,
            "original_anchor_terms": original_anchor_terms,
            "retained_anchor_terms": retained_anchors,
            "outline_anchor_hits": outline_anchor_hits,
            "required_anchor_overlap": required_overlap,
            "scene_anchor_drift_detected": scene_anchor_drift,
            "new_story_elements": introduced_names,
            "blocking_new_story_elements": blocking_new_story_elements,
            "authoritative_name_check": authoritative_name_check,
            "uncertainty_triggered": failure_reason is not None,
            "failure_reason": failure_reason,
            "accepted": failure_reason is None,
            "quality_total_score": int((quality_snapshot or {}).get("total_score") or 0),
        }

    def _generate_candidate(
        self,
        *,
        adapter: BaseAdapter,
        payload: dict[str, Any],
        continuation,
        project_root: Path,
        call_mode: str,
    ) -> dict[str, Any]:
        try:
            response = self._call_with_transient_adapter_retry(
                adapter=adapter,
                payload=payload,
                call_mode=call_mode,
            )
            raw_payload = response.get("raw") if isinstance(response, dict) else None
            if not isinstance(raw_payload, dict) and isinstance(response, dict):
                raw_payload = response
            raw_payload_keys: list[str] | None = None
            raw_payload_preview: str | None = None
            if isinstance(raw_payload, dict):
                raw_payload_keys = sorted(
                    [str(key) for key in raw_payload.keys() if key is not None]
                )
                try:
                    raw_payload_preview = json.dumps(
                        raw_payload, ensure_ascii=False, default=str
                    )[:500]
                except Exception:  # pragma: no cover - defensive
                    raw_payload_preview = None
            raw_text, thinking_fallback, extracted_field = normalize_ollama_payload(response)
            if thinking_fallback:
                self._diagnostics.log(
                    project_root,
                    code="ADAPTER",
                    message="Ollama thinking fallback used.",
                    details={"thinking_fallback": True},
                )
            cleaned = normalize_long_form_output(raw_text)
            cleaned = extract_narrative_prose(cleaned)
            cleaned, reasoning_trim_applied = trim_initial_reasoning_block(cleaned)
            if cleaned and cleaned.lower().startswith(("okay", "hmm", "the user", "i should", "i'll")):
                cleaned = cleaned.split("\n\n", 1)[-1]
            if cleaned:
                cleaned = cleaned.lstrip("* ").strip()
            return {
                "text": cleaned.strip() if isinstance(cleaned, str) and cleaned else cleaned,
                "raw_text": raw_text,
                "raw_preview": raw_text[:200] if isinstance(raw_text, str) else None,
                "normalized_preview": cleaned[:200] if isinstance(cleaned, str) else None,
                "raw_length": len(raw_text) if isinstance(raw_text, str) else 0,
                "normalized_length": len(cleaned) if isinstance(cleaned, str) else 0,
                "extracted_field": extracted_field,
                "reasoning_trim_applied": reasoning_trim_applied,
                "thinking_fallback": thinking_fallback,
                "raw_payload_keys": raw_payload_keys,
                "raw_payload_preview": raw_payload_preview,
                "adapter_retry_used": bool(
                    isinstance(response, dict) and response.get("_adapter_retry_used")
                ),
                "adapter_retry_count": (
                    int(response.get("_adapter_retry_count") or 0)
                    if isinstance(response, dict)
                    else 0
                ),
            }
        except AdapterError as exc:
            return {
                "adapter_error": str(exc),
                "adapter_failure_class": self._classify_adapter_error(str(exc)),
                "adapter_retry_used": False,
                "adapter_retry_count": 0,
            }

    def _classify_adapter_error(self, message: str) -> str:
        lowered = message.lower()
        transient_markers = (
            "timed out",
            "timeout",
            "connection reset",
            "temporarily unavailable",
            "connection aborted",
            "rate limit",
            "overloaded",
            "service unavailable",
            "bad gateway",
            "gateway timeout",
            "remote end closed",
            "provider request failed",
        )
        hard_markers = (
            "http error 400",
            "bad request",
            "api key is missing",
            "missing prompt",
            "invalid json",
            "response missing",
            "payload missing",
            "unsupported",
            "not an object",
        )
        if any(marker in lowered for marker in hard_markers):
            return "hard_adapter_error"
        if any(marker in lowered for marker in transient_markers):
            return "transient_adapter_error"
        return "hard_adapter_error"

    def _call_with_transient_adapter_retry(
        self,
        *,
        adapter: BaseAdapter,
        payload: dict[str, Any],
        call_mode: str,
    ) -> dict[str, Any]:
        adapter_retry_count = 0
        while True:
            try:
                if call_mode in {"rewrite", "recovery_retry", "repair_only"}:
                    response = adapter.rewrite(payload)
                else:
                    response = adapter.generate_draft(payload)
                if adapter_retry_count and isinstance(response, dict):
                    response = dict(response)
                    response["_adapter_retry_used"] = True
                    response["_adapter_retry_count"] = adapter_retry_count
                return response
            except AdapterError as exc:
                if (
                    self._classify_adapter_error(str(exc)) != "transient_adapter_error"
                    or adapter_retry_count >= self._MAX_TRANSIENT_ADAPTER_RETRIES
                ):
                    raise
                adapter_retry_count += 1

    def _quality_passes(
        self,
        quality_snapshot: dict[str, Any] | None,
        *,
        rewrite_used: bool = False,
        previous_quality_snapshot: dict[str, Any] | None = None,
        critique_snapshot: dict[str, Any] | None = None,
        rescue_contract: dict[str, Any] | None = None,
        continuation_chunk: bool = False,
    ) -> bool:
        if not quality_snapshot or not quality_snapshot.get("usable"):
            return False
        scores = quality_snapshot.get("scores") or {}
        total = quality_snapshot.get("total_score", 0)
        coherence = scores.get("coherence", 0)
        continuity = scores.get("continuity", 0)
        specificity = scores.get("specificity", 0)
        clarity = scores.get("clarity", 0)
        meta_free = scores.get("meta_free", 0)
        carryover_terms = quality_snapshot.get("carryover_terms") or []
        required_specificity = max(4, self._QUALITY_MIN_SPECIFICITY - 1)
        weak_carryover = bool(quality_snapshot.get("weak_carryover"))
        generic_risk = bool(quality_snapshot.get("generic_risk"))
        stock_phrase_hits = int(quality_snapshot.get("stock_phrase_hits") or 0)
        dialogue_present = bool(quality_snapshot.get("dialogue_present"))
        dialogue_grounded = bool(quality_snapshot.get("dialogue_grounded", True))
        if meta_free <= 0:
            return False
        if weak_carryover:
            return False
        patch_rescue_recovery_pass = (
            rewrite_used
            and previous_quality_snapshot is not None
            and bool((rescue_contract or {}).get("rescue_slots"))
            and total >= max(24, self._QUALITY_MIN_TOTAL - 6)
            and coherence >= max(2, self._QUALITY_MIN_COHERENCE - 1)
            and continuity >= max(3, self._QUALITY_MIN_CONTINUITY - 1)
            and specificity >= max(3, required_specificity - 1)
            and clarity >= max(3, self._QUALITY_MIN_CLARITY - 1)
        )
        if continuation_chunk:
            previous_generic_risk = bool(previous_quality_snapshot.get("generic_risk")) if previous_quality_snapshot else False
            rewrite_recovery_pass = (
                rewrite_used
                and continuity >= 4
                and specificity >= max(3, required_specificity - 1)
                and clarity >= self._QUALITY_MIN_CLARITY
                and total >= max(self._QUALITY_MIN_TOTAL, 30)
                and stock_phrase_hits <= 3
                and (
                    generic_risk
                    or previous_generic_risk
                )
            )
            if generic_risk and not rewrite_recovery_pass and (
                specificity < required_specificity or clarity <= 2
            ):
                return False
            base_pass = (
                total >= self._QUALITY_MIN_TOTAL
                and coherence >= self._QUALITY_MIN_COHERENCE
                and continuity >= self._QUALITY_MIN_CONTINUITY
                and specificity >= required_specificity
                and clarity >= self._QUALITY_MIN_CLARITY
            )
            if base_pass and rewrite_used and previous_quality_snapshot is not None:
                return self._rewrite_delta_passes(
                    previous_quality_snapshot=previous_quality_snapshot,
                    rewritten_quality_snapshot=quality_snapshot,
                    continuation_chunk=True,
                    rescue_contract=rescue_contract,
                ) and self._rewrite_targets_aligned(
                    previous_quality_snapshot=previous_quality_snapshot,
                    rewritten_quality_snapshot=quality_snapshot,
                    critique_snapshot=critique_snapshot,
                    continuation_chunk=True,
                ) and self._rescue_targets_satisfied(
                    previous_quality_snapshot=previous_quality_snapshot,
                    rewritten_quality_snapshot=quality_snapshot,
                    critique_snapshot=critique_snapshot,
                    rescue_contract=rescue_contract,
                )
            if base_pass:
                return True
            if rewrite_recovery_pass:
                return self._rewrite_delta_passes(
                    previous_quality_snapshot=previous_quality_snapshot,
                    rewritten_quality_snapshot=quality_snapshot,
                    continuation_chunk=True,
                    rescue_contract=rescue_contract,
                ) and self._rewrite_targets_aligned(
                    previous_quality_snapshot=previous_quality_snapshot,
                    rewritten_quality_snapshot=quality_snapshot,
                    critique_snapshot=critique_snapshot,
                    continuation_chunk=True,
                ) and self._rescue_targets_satisfied(
                    previous_quality_snapshot=previous_quality_snapshot,
                    rewritten_quality_snapshot=quality_snapshot,
                    critique_snapshot=critique_snapshot,
                    rescue_contract=rescue_contract,
                )
            if patch_rescue_recovery_pass:
                return self._rewrite_delta_passes(
                    previous_quality_snapshot=previous_quality_snapshot,
                    rewritten_quality_snapshot=quality_snapshot,
                    continuation_chunk=True,
                    rescue_contract=rescue_contract,
                ) and self._rewrite_targets_aligned(
                    previous_quality_snapshot=previous_quality_snapshot,
                    rewritten_quality_snapshot=quality_snapshot,
                    critique_snapshot=critique_snapshot,
                    continuation_chunk=True,
                ) and self._rescue_targets_satisfied(
                    previous_quality_snapshot=previous_quality_snapshot,
                    rewritten_quality_snapshot=quality_snapshot,
                    critique_snapshot=critique_snapshot,
                    rescue_contract=rescue_contract,
                )
            return False

        opening_rewrite_recovery_pass = (
            rewrite_used
            and coherence >= self._QUALITY_MIN_COHERENCE
            and continuity >= self._QUALITY_MIN_CONTINUITY
            and clarity >= 4
            and specificity >= 3
            and total >= self._QUALITY_MIN_TOTAL + 1
        )
        base_pass = (
            total >= self._QUALITY_MIN_TOTAL
            and coherence >= self._QUALITY_MIN_COHERENCE
            and continuity >= self._QUALITY_MIN_CONTINUITY
            and specificity >= required_specificity
            and clarity >= self._QUALITY_MIN_CLARITY
        )
        if base_pass and rewrite_used and previous_quality_snapshot is not None:
            return self._rewrite_delta_passes(
                previous_quality_snapshot=previous_quality_snapshot,
                rewritten_quality_snapshot=quality_snapshot,
                continuation_chunk=False,
                rescue_contract=rescue_contract,
            ) and self._rewrite_targets_aligned(
                previous_quality_snapshot=previous_quality_snapshot,
                rewritten_quality_snapshot=quality_snapshot,
                critique_snapshot=critique_snapshot,
                continuation_chunk=False,
            ) and self._rescue_targets_satisfied(
                previous_quality_snapshot=previous_quality_snapshot,
                rewritten_quality_snapshot=quality_snapshot,
                critique_snapshot=critique_snapshot,
                rescue_contract=rescue_contract,
            )
        if base_pass:
            return True
        if opening_rewrite_recovery_pass:
            return self._rewrite_delta_passes(
                previous_quality_snapshot=previous_quality_snapshot,
                rewritten_quality_snapshot=quality_snapshot,
                continuation_chunk=False,
                rescue_contract=rescue_contract,
            ) and self._rewrite_targets_aligned(
                previous_quality_snapshot=previous_quality_snapshot,
                rewritten_quality_snapshot=quality_snapshot,
                critique_snapshot=critique_snapshot,
                continuation_chunk=False,
            ) and self._rescue_targets_satisfied(
                previous_quality_snapshot=previous_quality_snapshot,
                rewritten_quality_snapshot=quality_snapshot,
                critique_snapshot=critique_snapshot,
                rescue_contract=rescue_contract,
            )
        if patch_rescue_recovery_pass:
            return self._rewrite_delta_passes(
                previous_quality_snapshot=previous_quality_snapshot,
                rewritten_quality_snapshot=quality_snapshot,
                continuation_chunk=False,
                rescue_contract=rescue_contract,
            ) and self._rewrite_targets_aligned(
                previous_quality_snapshot=previous_quality_snapshot,
                rewritten_quality_snapshot=quality_snapshot,
                critique_snapshot=critique_snapshot,
                continuation_chunk=False,
            ) and self._rescue_targets_satisfied(
                previous_quality_snapshot=previous_quality_snapshot,
                rewritten_quality_snapshot=quality_snapshot,
                critique_snapshot=critique_snapshot,
                rescue_contract=rescue_contract,
            )
        return False

    def _rescue_targets_satisfied(
        self,
        *,
        previous_quality_snapshot: dict[str, Any] | None,
        rewritten_quality_snapshot: dict[str, Any] | None,
        critique_snapshot: dict[str, Any] | None,
        rescue_contract: dict[str, Any] | None = None,
    ) -> bool:
        if not previous_quality_snapshot or not rewritten_quality_snapshot or not critique_snapshot:
            return True
        previous_scores = previous_quality_snapshot.get("scores") or {}
        rewritten_scores = rewritten_quality_snapshot.get("scores") or {}
        weaknesses = " ".join(
            str(item).lower() for item in critique_snapshot.get("weaknesses") or []
        )
        dialogue_targeted = bool(critique_snapshot.get("dialogue_grounding_targets")) or "dialogue" in weaknesses
        specificity_targeted = (
            bool(critique_snapshot.get("detail_targets"))
            or bool(critique_snapshot.get("replacement_targets"))
            or bool(critique_snapshot.get("grounding_targets"))
            or "specific" in weaknesses
            or "vague" in weaknesses
        )
        local_specificity_credit = self._rescue_contract_has_local_specificity_credit(rescue_contract)
        if dialogue_targeted and bool(previous_quality_snapshot.get("dialogue_present")):
            if not bool(rewritten_quality_snapshot.get("dialogue_grounded", True)):
                return False
            if int(rewritten_scores.get("dialogue") or 0) < int(previous_scores.get("dialogue") or 0):
                return False
        if specificity_targeted:
            previous_specificity = int(previous_scores.get("specificity") or 0)
            rewritten_specificity = int(rewritten_scores.get("specificity") or 0)
            previous_concrete_hits = int(previous_quality_snapshot.get("concrete_hits") or 0)
            rewritten_concrete_hits = int(rewritten_quality_snapshot.get("concrete_hits") or 0)
            specificity_delta = int(rewritten_scores.get("specificity") or 0) - int(
                previous_scores.get("specificity") or 0
            )
            concrete_delta = rewritten_concrete_hits - previous_concrete_hits
            specificity_already_safe = previous_specificity >= self._QUALITY_MIN_SPECIFICITY
            concrete_already_safe = previous_concrete_hits >= 3
            if local_specificity_credit:
                if rewritten_specificity < previous_specificity or rewritten_concrete_hits < previous_concrete_hits:
                    return False
            elif specificity_already_safe and concrete_already_safe:
                if rewritten_specificity < previous_specificity or rewritten_concrete_hits < previous_concrete_hits:
                    return False
            elif specificity_delta < 1 and concrete_delta < 2:
                return False
        targeted_generic_phrases = [
            str(item).lower()
            for item in ((rescue_contract or {}).get("generic_phrases_to_replace") or [])
            if str(item).strip()
        ]
        using_patch_rescue = bool((rescue_contract or {}).get("rescue_slots"))
        rewritten_text = str(rewritten_quality_snapshot.get("text") or "").lower()
        if targeted_generic_phrases and not using_patch_rescue:
            if any(phrase in rewritten_text for phrase in targeted_generic_phrases):
                return False
        if int(previous_quality_snapshot.get("stock_phrase_hits") or 0) > 0:
            previous_stock_hits = int(previous_quality_snapshot.get("stock_phrase_hits") or 0)
            rewritten_stock_hits = int(rewritten_quality_snapshot.get("stock_phrase_hits") or 0)
            if rewritten_stock_hits >= previous_stock_hits:
                return False
            if using_patch_rescue and rewritten_stock_hits > max(0, previous_stock_hits - 1):
                return False
        return True

    def _rewrite_delta_passes(
        self,
        *,
        previous_quality_snapshot: dict[str, Any] | None,
        rewritten_quality_snapshot: dict[str, Any] | None,
        continuation_chunk: bool,
        rescue_contract: dict[str, Any] | None = None,
    ) -> bool:
        if not previous_quality_snapshot or not rewritten_quality_snapshot:
            return False
        previous_scores = previous_quality_snapshot.get("scores") or {}
        rewritten_scores = rewritten_quality_snapshot.get("scores") or {}
        total_delta = int(rewritten_quality_snapshot.get("total_score") or 0) - int(
            previous_quality_snapshot.get("total_score") or 0
        )
        stock_delta = int(previous_quality_snapshot.get("stock_phrase_hits") or 0) - int(
            rewritten_quality_snapshot.get("stock_phrase_hits") or 0
        )
        specificity_delta = int(rewritten_scores.get("specificity") or 0) - int(
            previous_scores.get("specificity") or 0
        )
        clarity_delta = int(rewritten_scores.get("clarity") or 0) - int(
            previous_scores.get("clarity") or 0
        )
        continuity_delta = int(rewritten_scores.get("continuity") or 0) - int(
            previous_scores.get("continuity") or 0
        )
        concrete_delta = int(rewritten_quality_snapshot.get("concrete_hits") or 0) - int(
            previous_quality_snapshot.get("concrete_hits") or 0
        )
        material_carryover_delta = int(
            rewritten_quality_snapshot.get("material_carryover_hits") or 0
        ) - int(previous_quality_snapshot.get("material_carryover_hits") or 0)
        if total_delta >= 2:
            return True
        if stock_delta >= 1 and self._rescue_contract_has_local_specificity_credit(rescue_contract):
            return True
        if stock_delta >= 1 and (specificity_delta >= 1 or clarity_delta >= 1 or continuity_delta >= 1):
            return True
        if not continuation_chunk and stock_delta >= 1 and concrete_delta >= 1:
            return True
        if continuation_chunk and material_carryover_delta >= 1 and (
            stock_delta >= 1 or specificity_delta >= 1 or clarity_delta >= 1
        ):
            return True
        if continuation_chunk and previous_scores.get("continuity", 0) <= 3 and continuity_delta >= 1 and total_delta >= 1:
            return True
        return False

    def _rescue_contract_has_local_specificity_credit(
        self,
        rescue_contract: dict[str, Any] | None,
    ) -> bool:
        if bool((rescue_contract or {}).get("accepted_local_specificity_credit")):
            return True
        for snapshot in (rescue_contract or {}).get("accepted_patch_snapshots") or []:
            if isinstance(snapshot, dict) and str(snapshot.get("target_type") or "") == "generic":
                return True
        return False

    def _rewrite_targets_aligned(
        self,
        *,
        previous_quality_snapshot: dict[str, Any] | None,
        rewritten_quality_snapshot: dict[str, Any] | None,
        critique_snapshot: dict[str, Any] | None,
        continuation_chunk: bool,
    ) -> bool:
        if not previous_quality_snapshot or not rewritten_quality_snapshot or not critique_snapshot:
            return False
        previous_scores = previous_quality_snapshot.get("scores") or {}
        rewritten_scores = rewritten_quality_snapshot.get("scores") or {}
        weaknesses = " ".join(str(item).lower() for item in critique_snapshot.get("weaknesses") or [])
        continuity_notes = " ".join(
            str(item).lower() for item in critique_snapshot.get("continuity_issues") or []
        )
        replacement_targets = critique_snapshot.get("replacement_targets") or []
        grounding_targets = critique_snapshot.get("grounding_targets") or []
        carryover_targets = critique_snapshot.get("carryover_targets") or []
        generic_phrase_targets = critique_snapshot.get("generic_phrase_targets") or []
        detail_targets = critique_snapshot.get("detail_targets") or []
        dialogue_grounding_targets = critique_snapshot.get("dialogue_grounding_targets") or []
        emotional_show_targets = critique_snapshot.get("emotional_show_targets") or []

        targeted_improvements: list[bool] = []
        if "generic" in weaknesses or "stock" in weaknesses or replacement_targets or generic_phrase_targets:
            targeted_improvements.append(
                int(previous_quality_snapshot.get("stock_phrase_hits") or 0)
                > int(rewritten_quality_snapshot.get("stock_phrase_hits") or 0)
            )
        if "dialogue" in weaknesses or grounding_targets or dialogue_grounding_targets:
            targeted_improvements.append(
                bool(rewritten_quality_snapshot.get("dialogue_grounded"))
                and (
                    not bool(previous_quality_snapshot.get("dialogue_grounded"))
                    or int(rewritten_scores.get("dialogue") or 0)
                    > int(previous_scores.get("dialogue") or 0)
                )
            )
        if continuation_chunk and (
            "vague" in weaknesses
            or "specific" in weaknesses
            or "emotion" in weaknesses
            or replacement_targets
            or detail_targets
            or emotional_show_targets
        ):
            targeted_improvements.append(
                int(rewritten_scores.get("specificity") or 0)
                > int(previous_scores.get("specificity") or 0)
                or int(rewritten_scores.get("clarity") or 0)
                > int(previous_scores.get("clarity") or 0)
                or int(rewritten_quality_snapshot.get("concrete_hits") or 0)
                > int(previous_quality_snapshot.get("concrete_hits") or 0)
            )
        if not continuation_chunk and (
            "vague" in weaknesses
            or "specific" in weaknesses
            or replacement_targets
            or detail_targets
            or emotional_show_targets
        ):
            targeted_improvements.append(
                int(rewritten_quality_snapshot.get("concrete_hits") or 0)
                > int(previous_quality_snapshot.get("concrete_hits") or 0)
                or int(rewritten_scores.get("specificity") or 0)
                > int(previous_scores.get("specificity") or 0)
            )
        if continuation_chunk and ("continuity" in continuity_notes or "flow" in continuity_notes or carryover_targets):
            targeted_improvements.append(
                int(rewritten_scores.get("continuity") or 0)
                > int(previous_scores.get("continuity") or 0)
                or (
                    not bool(previous_quality_snapshot.get("material_carryover"))
                    and bool(rewritten_quality_snapshot.get("material_carryover"))
                )
                or int(rewritten_quality_snapshot.get("material_carryover_hits") or 0)
                > int(previous_quality_snapshot.get("material_carryover_hits") or 0)
            )
        return any(targeted_improvements) if targeted_improvements else True

    def _run_chunk_critique(
        self,
        *,
        adapter: BaseAdapter,
        text: str,
        continuation,
        project_root: Path,
        quality_snapshot: dict[str, Any] | None,
    ) -> dict[str, Any]:
        prompt = self._build_critique_prompt(
            text=text,
            continuation=continuation,
            quality_snapshot=quality_snapshot,
        )
        payload: dict[str, Any] = {
            "prompt": prompt,
            "temperature": 0.3,
            "system": "Return JSON only. Do not include any extra text.",
        }
        try:
            response = adapter.critique(payload)
            raw_text, _, _ = normalize_ollama_payload(response)
            if not isinstance(raw_text, str):
                raise AdapterError("Critique response missing text.")
            return self._parse_critique(raw_text)
        except AdapterError as exc:
            self._diagnostics.log(
                project_root,
                code="CRITIQUE",
                message="Long-form critique failed; using default notes.",
                details={"error": str(exc)},
            )
            return {
                "summary": "Critique unavailable; tighten clarity, continuity, and specificity.",
                "weaknesses": ["clarity", "continuity", "specificity"],
                "rewrite_goals": ["Increase scene specificity", "Strengthen continuity cues"],
                "generic_phrase_targets": ["Replace generic stock phrasing with concrete scene detail"],
                "detail_targets": ["Add concrete environmental detail"],
                "dialogue_grounding_targets": ["Attach dialogue to action or setting"],
                "emotional_show_targets": ["Show emotion through behavior or sensation"],
                "replacement_targets": ["Replace generic atmosphere lines with concrete scene detail"],
                "grounding_targets": ["Anchor dialogue in object handling or physical movement"],
                "carryover_targets": ["Reuse prior-scene objects in meaningful action"],
            }

    def _build_critique_prompt(
        self,
        *,
        text: str,
        continuation,
        quality_snapshot: dict[str, Any] | None,
    ) -> str:
        summary = continuation.prior_summary or "No prior summary."
        rubric = json.dumps(quality_snapshot or {}, ensure_ascii=False)
        return (
            "You are an editor. Critique the following scene prose. "
            "Return a JSON object with keys: summary, weaknesses, continuity_issues, "
            "pacing_issues, meta_contamination, rewrite_goals, generic_phrase_targets, detail_targets, dialogue_grounding_targets, emotional_show_targets, replacement_targets, grounding_targets, carryover_targets.\n"
            "Focus on weak continuity carryover, generic stock phrasing, vague scene detail, "
            "and dialogue that is not grounded in physical action or setting.\n\n"
            f"PRIOR SUMMARY: {summary}\n"
            f"RUBRIC SNAPSHOT: {rubric}\n"
            "SCENE TEXT:\n"
            f"{text}\n"
        )

    def _parse_critique(self, raw_text: str) -> dict[str, Any]:
        normalized_text = raw_text.strip()
        if normalized_text.startswith("```"):
            lines = normalized_text.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            normalized_text = "\n".join(lines).strip()
        if normalized_text and not normalized_text.startswith("{"):
            start = normalized_text.find("{")
            end = normalized_text.rfind("}")
            if start != -1 and end != -1 and end > start:
                normalized_text = normalized_text[start : end + 1]
        try:
            payload = json.loads(normalized_text)
        except json.JSONDecodeError:
            return {
                "summary": raw_text.strip()[:200],
                "weaknesses": ["clarity"],
                "rewrite_goals": ["Clarify scene focus"],
                "generic_phrase_targets": [],
                "detail_targets": [],
                "dialogue_grounding_targets": [],
                "emotional_show_targets": [],
                "replacement_targets": [],
                "grounding_targets": [],
                "carryover_targets": [],
            }
        if not isinstance(payload, dict):
            return {
                "summary": raw_text.strip()[:200],
                "weaknesses": ["clarity"],
                "rewrite_goals": ["Clarify scene focus"],
                "generic_phrase_targets": [],
                "detail_targets": [],
                "dialogue_grounding_targets": [],
                "emotional_show_targets": [],
                "replacement_targets": [],
                "grounding_targets": [],
                "carryover_targets": [],
            }
        return {
            "summary": str(payload.get("summary") or "").strip(),
            "weaknesses": list(payload.get("weaknesses") or []),
            "continuity_issues": list(payload.get("continuity_issues") or []),
            "pacing_issues": list(payload.get("pacing_issues") or []),
            "meta_contamination": bool(payload.get("meta_contamination")),
            "rewrite_goals": list(payload.get("rewrite_goals") or []),
            "generic_phrase_targets": list(payload.get("generic_phrase_targets") or []),
            "detail_targets": list(payload.get("detail_targets") or []),
            "dialogue_grounding_targets": list(payload.get("dialogue_grounding_targets") or []),
            "emotional_show_targets": list(payload.get("emotional_show_targets") or []),
            "replacement_targets": list(payload.get("replacement_targets") or []),
            "grounding_targets": list(payload.get("grounding_targets") or []),
            "carryover_targets": list(payload.get("carryover_targets") or []),
        }

    def _build_rewrite_prompt(
        self,
        *,
        original_text: str,
        critique_snapshot: dict[str, Any] | None,
        continuation,
        quality_snapshot: dict[str, Any] | None = None,
    ) -> str:
        goals = critique_snapshot.get("rewrite_goals") if critique_snapshot else None
        weaknesses = critique_snapshot.get("weaknesses") if critique_snapshot else None
        generic_phrase_targets = critique_snapshot.get("generic_phrase_targets") if critique_snapshot else None
        detail_targets = critique_snapshot.get("detail_targets") if critique_snapshot else None
        dialogue_grounding_targets = critique_snapshot.get("dialogue_grounding_targets") if critique_snapshot else None
        emotional_show_targets = critique_snapshot.get("emotional_show_targets") if critique_snapshot else None
        replacement_targets = critique_snapshot.get("replacement_targets") if critique_snapshot else None
        grounding_targets = critique_snapshot.get("grounding_targets") if critique_snapshot else None
        carryover_targets = critique_snapshot.get("carryover_targets") if critique_snapshot else None
        continuation_chunk = bool(continuation.prior_summary or continuation.prior_excerpt)
        carryover_terms = list((quality_snapshot or {}).get("carryover_terms") or [])
        original_word_count = len(original_text.split())
        min_words, max_words = self._rewrite_length_bounds(max(1, original_word_count))
        continuation_rules = (
            "CONTINUATION RULES:\n"
            "1. Replace every phrase named in GENERIC PHRASE TARGETS with concrete scene detail; do not reuse the same metaphor or atmosphere wording.\n"
            "2. Make at least one item from CARRYOVER TARGETS affect a physical action, blocking decision, or object interaction in the scene.\n"
            "3. Reuse the detected carryover terms in concrete action or sensory follow-through; do not repeat them decoratively.\n"
            "4. Increase specificity through concrete noun/action detail and observable bodily response, not summary.\n"
            "5. Keep dialogue attached to movement, gesture, or handled objects.\n"
            "6. Preserve the original scene subject, place, and intended action; do not introduce off-outline events or characters.\n"
        )
        opening_rules = (
            "OPENING RULES:\n"
            "1. Replace named generic phrases with concrete setting detail.\n"
            "2. Ground important dialogue in gesture, movement, or surrounding objects.\n"
            "3. Show emotion through visible behavior or sensation.\n"
            "4. Preserve the original scene premise and outline subject; do not invent a different scene.\n"
        )
        return (
            "Rewrite the scene to address critique while preserving story intent.\n"
            f"CHAPTER: {continuation.chapter_memory.chapter_context or continuation.chapter_id}\n"
            f"SCENE OUTLINE TITLES: {' | '.join(continuation.chapter_memory.scene_titles) if continuation.chapter_memory.scene_titles else 'Unknown'}\n"
            f"SCENE BEAT REFS: {', '.join(continuation.chapter_memory.beat_refs) if continuation.chapter_memory.beat_refs else 'None'}\n"
            f"LOCKED FACTS: {'; '.join(continuation.chapter_memory.locked_facts) if continuation.chapter_memory.locked_facts else 'None'}\n"
            f"PRIOR SUMMARY: {continuation.prior_summary or 'No prior summary.'}\n"
            f"PRIOR EXCERPT: {continuation.prior_excerpt or 'None'}\n"
            f"WEAKNESSES: {', '.join(weaknesses) if weaknesses else 'None'}\n"
            f"REWRITE GOALS: {', '.join(goals) if goals else 'Improve clarity and specificity'}\n"
            f"GENERIC PHRASE TARGETS: {', '.join(generic_phrase_targets) if generic_phrase_targets else 'Replace generic stock phrasing.'}\n"
            f"DETAIL TARGETS: {', '.join(detail_targets) if detail_targets else 'Add concrete scene detail.'}\n"
            f"DIALOGUE GROUNDING TARGETS: {', '.join(dialogue_grounding_targets) if dialogue_grounding_targets else 'Ground dialogue in action or setting.'}\n"
            f"EMOTIONAL SHOW TARGETS: {', '.join(emotional_show_targets) if emotional_show_targets else 'Show emotion through behavior or sensation.'}\n"
            f"REPLACEMENT TARGETS: {', '.join(replacement_targets) if replacement_targets else 'Replace generic lines with concrete detail.'}\n"
            f"GROUNDING TARGETS: {', '.join(grounding_targets) if grounding_targets else 'Anchor dialogue in action or setting.'}\n"
            f"CARRYOVER TARGETS: {', '.join(carryover_targets) if carryover_targets else 'Use prior-scene objects in meaningful action.'}\n"
            f"DETECTED CARRYOVER TERMS: {', '.join(carryover_terms) if carryover_terms else 'None'}\n"
            "PRIMARY TARGETS: specificity, continuity carryover, scene momentum.\n"
            "REPLACE: generic stock phrases with concrete, scene-specific detail.\n"
            "GROUND: every important line of dialogue in physical action, gesture, object handling, or setting.\n"
            "SHOW: emotional state through observable sensation, movement, breath, or behavior instead of abstract labels.\n"
            "PRESERVE: continuity anchors from the prior summary and excerpt while increasing specificity.\n"
            "OUTLINE FIDELITY: stay inside the supplied outline, locked facts, and current scene premise.\n"
            "NO NEW STORY ELEMENTS: do not invent new roles, locations, twists, or causal events that are not grounded in the outline or existing scene text.\n"
            f"LENGTH BAND: stay between {min_words} and {max_words} words unless the original text is malformed.\n"
            "DO NOT: lightly paraphrase generic atmosphere filler; remove it or convert it into concrete detail.\n"
            "REMOVE: generic filler, vague summary language, meta/planning lines.\n"
            f"{continuation_rules if continuation_chunk else opening_rules}"
            "OUTPUT RULES: narrative prose only; no analysis, no headings, no notes, no labels.\n\n"
            "ORIGINAL SCENE:\n"
            f"{original_text}\n"
        )

    def _fallback_text(self, continuation) -> str:
        memory = continuation.chapter_memory
        summary = continuation.prior_summary or "No prior summary available."
        return (
            "Long-form draft placeholder.\n\n"
            f"Chapter: {memory.chapter_context or memory.chapter_id}\n"
            f"Prior summary: {summary}\n"
            "This placeholder text preserves continuity until provider output is available."
        )

    def _build_continuity_snapshot(self, text: str, *, fallback_reason: str | None) -> dict[str, Any]:
        sentence = text.replace("\n", " ").split(".")[0].strip()
        return {
            "summary": sentence,
            "word_count": len(text.split()),
            "fallback_reason": fallback_reason,
        }

    def _build_routing_snapshot(
        self,
        *,
        route: Any | None,
        policy_decision: RunPolicyDecision | None,
        fallback_reason: str | None,
    ) -> dict[str, Any] | None:
        if route is None:
            return None
        payload = format_route_metadata(route)
        if policy_decision:
            payload["run_policy"] = format_run_policy_metadata(policy_decision)
        if fallback_reason:
            payload["fallback_reason"] = fallback_reason
        return payload


__all__ = [
    "LongFormExecutionService",
    "LongFormExecutionResult",
    "plan_chunk_sequence",
]
