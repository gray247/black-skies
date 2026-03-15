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
            ) = self._run_chunk_attempts(
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
                quality_snapshot=quality_snapshot,
                critique_snapshot=critique_snapshot,
                attempt_count=attempt_count,
                acceptance_reason=acceptance_reason,
                rewrite_used=rewrite_used,
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

    def _run_chunk_attempts(
        self,
        *,
        adapter: BaseAdapter | None,
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
        acceptance_reason: str | None = None
        rewrite_used = False

        try:
            current_payload = dict(payload)
            for attempt in range(1, self._MAX_ATTEMPTS + 1):
                attempt_kind = "draft" if attempt == 1 else "rewrite"
                if attempt > 1:
                    rewrite_used = True
                candidate = self._generate_candidate(
                    adapter=adapter,
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
                }
                if candidate.get("adapter_error"):
                    attempt_record["error"] = candidate["adapter_error"]
                    attempt_diagnostics.append(attempt_record)
                    persist_long_form_diagnostic(
                        project_root,
                        continuation.chunk_id,
                        {
                            "chunk_id": continuation.chunk_id,
                            "validation_decision": False,
                            "fallback_reason": "adapter_error",
                            "attempts": attempt_diagnostics,
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
                    )
                cleaned = candidate.get("text")
                report = evaluate_long_form_output(
                    cleaned, prior_excerpt=continuation.prior_excerpt
                )
                attempt_record["basic_validation"] = report
                attempt_record["raw_preview"] = candidate.get("raw_preview")
                attempt_record["normalized_preview"] = candidate.get("normalized_preview")
                attempt_record["raw_length"] = candidate.get("raw_length")
                attempt_record["normalized_length"] = candidate.get("normalized_length")
                attempt_record["raw_payload_keys"] = candidate.get("raw_payload_keys")
                attempt_record["raw_payload_preview"] = candidate.get("raw_payload_preview")
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
                    )

                quality_snapshot = score_long_form_quality(
                    cleaned, prior_excerpt=continuation.prior_excerpt
                )
                quality_pass = self._quality_passes(quality_snapshot)
                attempt_record["quality_snapshot"] = quality_snapshot
                attempt_record["quality_pass"] = quality_pass

                if quality_pass:
                    acceptance_reason = "quality_pass" if attempt == 1 else "rewrite_pass"
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
                    )

                if attempt < self._MAX_ATTEMPTS:
                    critique_snapshot = self._run_chunk_critique(
                        adapter=adapter,
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
                    )
                    current_payload["system"] = (
                        "Rewrite the scene. Output only narrative prose. "
                        "No analysis, no planning, no headings."
                    )
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
            )

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
            if call_mode == "rewrite":
                response = adapter.rewrite(payload)
            else:
                response = adapter.generate_draft(payload)
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
            }
        except AdapterError as exc:
            return {"adapter_error": str(exc)}

    def _quality_passes(self, quality_snapshot: dict[str, Any] | None) -> bool:
        if not quality_snapshot or not quality_snapshot.get("usable"):
            return False
        scores = quality_snapshot.get("scores") or {}
        total = quality_snapshot.get("total_score", 0)
        coherence = scores.get("coherence", 0)
        continuity = scores.get("continuity", 0)
        meta_free = scores.get("meta_free", 0)
        if meta_free <= 0:
            return False
        return (
            total >= self._QUALITY_MIN_TOTAL
            and coherence >= self._QUALITY_MIN_COHERENCE
            and continuity >= self._QUALITY_MIN_CONTINUITY
        )

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
            "pacing_issues, meta_contamination, rewrite_goals.\n\n"
            f"PRIOR SUMMARY: {summary}\n"
            f"RUBRIC SNAPSHOT: {rubric}\n"
            "SCENE TEXT:\n"
            f"{text}\n"
        )

    def _parse_critique(self, raw_text: str) -> dict[str, Any]:
        try:
            payload = json.loads(raw_text)
        except json.JSONDecodeError:
            return {
                "summary": raw_text.strip()[:200],
                "weaknesses": ["clarity"],
                "rewrite_goals": ["Clarify scene focus"],
            }
        if not isinstance(payload, dict):
            return {
                "summary": raw_text.strip()[:200],
                "weaknesses": ["clarity"],
                "rewrite_goals": ["Clarify scene focus"],
            }
        return {
            "summary": str(payload.get("summary") or "").strip(),
            "weaknesses": list(payload.get("weaknesses") or []),
            "continuity_issues": list(payload.get("continuity_issues") or []),
            "pacing_issues": list(payload.get("pacing_issues") or []),
            "meta_contamination": bool(payload.get("meta_contamination")),
            "rewrite_goals": list(payload.get("rewrite_goals") or []),
        }

    def _build_rewrite_prompt(
        self,
        *,
        original_text: str,
        critique_snapshot: dict[str, Any] | None,
        continuation,
    ) -> str:
        goals = critique_snapshot.get("rewrite_goals") if critique_snapshot else None
        weaknesses = critique_snapshot.get("weaknesses") if critique_snapshot else None
        return (
            "Rewrite the scene to address the critique while preserving story intent.\n"
            f"PRIOR SUMMARY: {continuation.prior_summary or 'No prior summary.'}\n"
            f"WEAKNESSES: {', '.join(weaknesses) if weaknesses else 'None'}\n"
            f"REWRITE GOALS: {', '.join(goals) if goals else 'Improve clarity and specificity'}\n"
            "OUTPUT RULES: Narrative prose only. No analysis, no headings, no meta.\n\n"
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
