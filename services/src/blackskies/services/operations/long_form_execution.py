"""Controlled long-form execution loop for multi-chunk drafting."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable
from uuid import uuid4

from ..budgeting import classify_budget
from ..diagnostics import DiagnosticLogger
from ..model_adapters import AdapterError, BaseAdapter, normalize_ollama_payload
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

            text, fallback_reason, provider_failed = self._run_chunk_generation(
                adapter=adapter,
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
        if continuation.target_words:
            min_target = max(100, int(continuation.target_words * 0.9))
            max_target = int(continuation.target_words * 1.1)
            lines.append(f"TARGET WORD RANGE: {min_target}-{max_target}")
        if memory.locked_facts:
            lines.append(f"LOCKED FACTS: {'; '.join(memory.locked_facts)}")
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
        if not continuation.prior_summary and not continuation.prior_excerpt:
            lines.append("CHUNK OBJECTIVE: Open the chapter with immersive scene prose.")
        if continuation.constraints:
            lines.append(f"NEGATIVE CONSTRAINTS: {' | '.join(continuation.constraints)}")
        lines.extend(
            [
                "POV RULES: Stay in a consistent POV; do not head-hop.",
                "PROSE RULES: Show action, sensation, and dialogue where natural.",
                "FINAL: Begin the scene now with concrete action.",
                "NO PREFACE: Do not include planning, analysis, or acknowledgements.",
            ]
        )
        return "\n".join(lines)

    def _run_chunk_generation(
        self,
        *,
        adapter: BaseAdapter | None,
        prompt: str,
        continuation,
        project_root: Path,
    ) -> tuple[str, str | None, bool]:
        if not self._model_router or not self._model_router.config.provider_calls_enabled:
            return self._fallback_text(continuation), "provider_calls_disabled", False
        if adapter is None:
            return self._fallback_text(continuation), "provider_unavailable", False

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
        try:
            def _attempt(
                request_payload: dict[str, Any],
            ) -> tuple[str | None, bool, dict[str, Any], str | None, str | None, bool]:
                response = adapter.generate_draft(request_payload)
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
                return (
                    cleaned,
                    bool(raw_text),
                    response,
                    raw_text,
                    extracted_field,
                    reasoning_trim_applied,
                    thinking_fallback,
                )

            (
                cleaned,
                had_raw,
                response,
                raw_text,
                extracted_field,
                reasoning_trim_applied,
                thinking_fallback,
            ) = _attempt(payload)
            if cleaned and is_usable_long_form_output(
                cleaned, prior_excerpt=continuation.prior_excerpt
            ):
                return cleaned.strip(), None, False
            if not cleaned and had_raw:
                retry_payload = dict(payload)
                retry_payload["prompt"] = (
                    f"{prompt}\nFINAL OVERRIDE: Start with scene action immediately. "
                    "Do not include planning or analysis."
                )
                retry_payload["system"] = (
                    "Output only narrative prose. Start with concrete action. "
                    "No analysis, no planning, no acknowledgements."
                )
                (
                    cleaned,
                    _,
                    response,
                    raw_text,
                    extracted_field,
                    reasoning_trim_applied,
                    thinking_fallback,
                ) = _attempt(retry_payload)
                if cleaned and is_usable_long_form_output(
                    cleaned, prior_excerpt=continuation.prior_excerpt
                ):
                    return cleaned.strip(), None, False
            report = evaluate_long_form_output(cleaned, prior_excerpt=continuation.prior_excerpt)
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
            diagnostic_payload = {
                "chunk_id": continuation.chunk_id,
                "reason": report,
                "validation_decision": bool(report.get("usable")),
                "fallback_reason": "invalid_output",
                "extracted_field": extracted_field,
                "thinking_fallback": thinking_fallback,
                "reasoning_trim_applied": reasoning_trim_applied,
                "raw_length": len(raw_text) if isinstance(raw_text, str) else 0,
                "normalized_length": len(cleaned) if isinstance(cleaned, str) else 0,
                "raw_preview": (raw_text[:200] if isinstance(raw_text, str) else None),
                "normalized_preview": (cleaned[:200] if isinstance(cleaned, str) else None),
                "word_count": report.get("word_count"),
                "paragraph_count": report.get("paragraph_count"),
            }
            persist_long_form_diagnostic(project_root, continuation.chunk_id, diagnostic_payload)
            self._diagnostics.log(
                project_root,
                code="VALIDATION",
                message="Long-form output rejected.",
                details={
                    "reason": report,
                    "raw_length": len(raw_text) if isinstance(raw_text, str) else 0,
                    "normalized_length": len(cleaned) if isinstance(cleaned, str) else 0,
                    "extracted_field": extracted_field,
                    "raw_excerpt": (raw_text[:400] if isinstance(raw_text, str) else None),
                    "cleaned_excerpt": (cleaned[:400] if isinstance(cleaned, str) else None),
                    "raw_preview": (raw_text[:200] if isinstance(raw_text, str) else None),
                    "normalized_preview": (cleaned[:200] if isinstance(cleaned, str) else None),
                    "reasoning_trim_applied": reasoning_trim_applied,
                    "thinking_fallback": thinking_fallback,
                    "word_count": report.get("word_count"),
                    "paragraph_count": report.get("paragraph_count"),
                    "raw_payload_keys": raw_payload_keys,
                    "raw_payload_preview": raw_payload_preview,
                },
            )
            return self._fallback_text(continuation), "invalid_output", True
        except AdapterError as exc:
            self._diagnostics.log(
                Path(self._settings.project_base_dir),
                code="ADAPTER",
                message="Long-form adapter failed; falling back.",
                details={"error": str(exc)},
            )
            return self._fallback_text(continuation), "adapter_error", True
        except Exception as exc:  # pragma: no cover - defensive
            self._diagnostics.log(
                Path(self._settings.project_base_dir),
                code="ADAPTER",
                message="Long-form adapter unexpected error; falling back.",
                details={"error": str(exc)},
            )
            return self._fallback_text(continuation), "adapter_exception", True

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
