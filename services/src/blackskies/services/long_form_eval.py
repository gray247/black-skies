"""Long-form evaluation helpers."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class LongFormEvalSummary:
    project_id: str
    chapter_id: str | None
    run_id: str
    chunk_ids: list[str]
    chunk_count: int
    accepted_count: int
    rewrite_count: int
    retry_used_count: int
    retried_success_count: int
    rescue_mode_used_count: int
    rescue_model_used_count: int
    rescue_guardrail_fail_count: int
    rescue_under_improved_count: int
    rescue_fidelity_risk_count: int
    patch_rescue_used_count: int
    patch_rescue_success_count: int
    repair_only_pass_used_count: int
    repair_only_pass_rescued_count: int
    rescue_editorial_failure_classes: dict[str, int]
    fallback_count: int
    borderline_failure_count: int
    avg_quality_score: float | None
    avg_attempts: float | None
    continuity_warnings: int
    total_estimated_usd: float
    providers: list[str]
    models: list[str]
    stopped_reason: str | None

    def to_dict(self) -> dict[str, Any]:
        return {
            "project_id": self.project_id,
            "chapter_id": self.chapter_id,
            "run_id": self.run_id,
            "chunk_ids": list(self.chunk_ids),
            "chunk_count": self.chunk_count,
            "accepted_count": self.accepted_count,
            "rewrite_count": self.rewrite_count,
            "retry_used_count": self.retry_used_count,
            "retried_success_count": self.retried_success_count,
            "rescue_mode_used_count": self.rescue_mode_used_count,
            "rescue_model_used_count": self.rescue_model_used_count,
            "rescue_guardrail_fail_count": self.rescue_guardrail_fail_count,
            "rescue_under_improved_count": self.rescue_under_improved_count,
            "rescue_fidelity_risk_count": self.rescue_fidelity_risk_count,
            "patch_rescue_used_count": self.patch_rescue_used_count,
            "patch_rescue_success_count": self.patch_rescue_success_count,
            "repair_only_pass_used_count": self.repair_only_pass_used_count,
            "repair_only_pass_rescued_count": self.repair_only_pass_rescued_count,
            "rescue_editorial_failure_classes": dict(self.rescue_editorial_failure_classes),
            "fallback_count": self.fallback_count,
            "borderline_failure_count": self.borderline_failure_count,
            "avg_quality_score": self.avg_quality_score,
            "avg_attempts": self.avg_attempts,
            "continuity_warnings": self.continuity_warnings,
            "total_estimated_usd": self.total_estimated_usd,
            "providers": list(self.providers),
            "models": list(self.models),
            "stopped_reason": self.stopped_reason,
        }


def _timestamp_run_id() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def load_chunk_payloads(project_root: Path) -> list[dict[str, Any]]:
    chunk_dir = project_root / ".blackskies" / "long_form" / "chunks"
    if not chunk_dir.exists():
        return []
    payloads: list[dict[str, Any]] = []
    for path in sorted(chunk_dir.glob("lf_*.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(payload, dict):
            payloads.append(payload)
    return payloads


def summarize_long_form_run(
    *,
    project_id: str,
    chapter_id: str | None,
    chunks: list[dict[str, Any]],
    stopped_reason: str | None = None,
    run_id: str | None = None,
) -> LongFormEvalSummary:
    run_id = run_id or _timestamp_run_id()
    chunk_ids = [str(chunk.get("chunk_id") or "") for chunk in chunks if chunk.get("chunk_id")]
    accepted = 0
    rewrites = 0
    retry_used_count = 0
    retried_success_count = 0
    rescue_mode_used_count = 0
    rescue_model_used_count = 0
    rescue_guardrail_fail_count = 0
    rescue_under_improved_count = 0
    rescue_fidelity_risk_count = 0
    patch_rescue_used_count = 0
    patch_rescue_success_count = 0
    repair_only_pass_used_count = 0
    repair_only_pass_rescued_count = 0
    rescue_editorial_failure_classes: dict[str, int] = {}
    fallbacks = 0
    borderline_failure_count = 0
    quality_scores: list[float] = []
    attempts: list[int] = []
    continuity_warnings = 0
    total_estimated = 0.0
    providers: set[str] = set()
    models: set[str] = set()

    for chunk in chunks:
        acceptance = chunk.get("acceptance_reason")
        if acceptance in ("quality_pass", "rewrite_pass", "retry_pass"):
            accepted += 1
        if chunk.get("rewrite_used"):
            rewrites += 1
        retry_snapshot = chunk.get("retry_snapshot") or {}
        if retry_snapshot.get("used"):
            retry_used_count += 1
        if retry_snapshot.get("rescue_mode_used"):
            rescue_mode_used_count += 1
        if retry_snapshot.get("rescue_model_used"):
            rescue_model_used_count += 1
        if retry_snapshot.get("rescue_guardrail_fail"):
            rescue_guardrail_fail_count += 1
        if retry_snapshot.get("rescue_under_improved"):
            rescue_under_improved_count += 1
        if retry_snapshot.get("rescue_fidelity_risk"):
            rescue_fidelity_risk_count += 1
        if retry_snapshot.get("patch_rescue_used"):
            patch_rescue_used_count += 1
        if retry_snapshot.get("patch_rescue_success"):
            patch_rescue_success_count += 1
        if retry_snapshot.get("repair_only_pass_used"):
            repair_only_pass_used_count += 1
        if retry_snapshot.get("repair_only_pass_rescued"):
            repair_only_pass_rescued_count += 1
        rescue_failure_class = retry_snapshot.get("rescue_failure_class")
        if isinstance(rescue_failure_class, str) and rescue_failure_class:
            rescue_editorial_failure_classes[rescue_failure_class] = (
                rescue_editorial_failure_classes.get(rescue_failure_class, 0) + 1
            )
        if retry_snapshot.get("succeeded"):
            retried_success_count += 1
        failure_classification = retry_snapshot.get("failure_classification") or {}
        if failure_classification.get("classification") == "borderline":
            borderline_failure_count += 1
        continuity_snapshot = chunk.get("continuity_snapshot") or {}
        if continuity_snapshot.get("fallback_reason"):
            fallbacks += 1
        quality_snapshot = chunk.get("quality_snapshot") or {}
        if isinstance(quality_snapshot, dict):
            score = quality_snapshot.get("total_score")
            if isinstance(score, (int, float)):
                quality_scores.append(float(score))
            if quality_snapshot.get("missing_carryover"):
                continuity_warnings += 1
            scores = quality_snapshot.get("scores") or {}
            if isinstance(scores, dict) and scores.get("continuity", 0) <= 2:
                continuity_warnings += 1
        attempt_count = chunk.get("attempt_count")
        if isinstance(attempt_count, int) and attempt_count > 0:
            attempts.append(attempt_count)
        budget = chunk.get("budget_snapshot") or {}
        estimate = budget.get("estimated_usd")
        if isinstance(estimate, (int, float)):
            total_estimated += float(estimate)
        provider = chunk.get("provider")
        model = chunk.get("model")
        if isinstance(provider, str) and provider:
            providers.add(provider)
        if isinstance(model, str) and model:
            models.add(model)

    avg_quality = round(sum(quality_scores) / len(quality_scores), 2) if quality_scores else None
    avg_attempts = round(sum(attempts) / len(attempts), 2) if attempts else None

    return LongFormEvalSummary(
        project_id=project_id,
        chapter_id=chapter_id,
        run_id=run_id,
        chunk_ids=chunk_ids,
        chunk_count=len(chunks),
        accepted_count=accepted,
        rewrite_count=rewrites,
        retry_used_count=retry_used_count,
        retried_success_count=retried_success_count,
        rescue_mode_used_count=rescue_mode_used_count,
        rescue_model_used_count=rescue_model_used_count,
        rescue_guardrail_fail_count=rescue_guardrail_fail_count,
        rescue_under_improved_count=rescue_under_improved_count,
        rescue_fidelity_risk_count=rescue_fidelity_risk_count,
        patch_rescue_used_count=patch_rescue_used_count,
        patch_rescue_success_count=patch_rescue_success_count,
        repair_only_pass_used_count=repair_only_pass_used_count,
        repair_only_pass_rescued_count=repair_only_pass_rescued_count,
        rescue_editorial_failure_classes=rescue_editorial_failure_classes,
        fallback_count=fallbacks,
        borderline_failure_count=borderline_failure_count,
        avg_quality_score=avg_quality,
        avg_attempts=avg_attempts,
        continuity_warnings=continuity_warnings,
        total_estimated_usd=round(total_estimated, 2),
        providers=sorted(providers),
        models=sorted(models),
        stopped_reason=stopped_reason,
    )


def summarize_long_form_variance(
    summaries: list[dict[str, Any] | LongFormEvalSummary],
) -> dict[str, Any]:
    normalized: list[dict[str, Any]] = []
    for summary in summaries:
        if isinstance(summary, LongFormEvalSummary):
            normalized.append(summary.to_dict())
        elif isinstance(summary, dict):
            normalized.append(summary)

    run_count = len(normalized)
    if run_count == 0:
        return {
            "run_count": 0,
            "pass_count": 0,
            "fail_count": 0,
            "pass_rate": None,
            "consistency": "no_runs",
            "stopped_reasons": {},
            "borderline_failure_rate": None,
            "retry_usage_rate": None,
            "retry_rescue_rate": None,
            "rescue_mode_usage_rate": None,
            "rescue_model_usage_rate": None,
            "rescue_guardrail_fail_rate": None,
            "rescue_under_improved_rate": None,
            "rescue_fidelity_risk_rate": None,
            "patch_rescue_usage_rate": None,
            "patch_rescue_success_rate": None,
            "repair_only_pass_usage_rate": None,
            "repair_only_pass_rescue_rate": None,
            "rescue_editorial_failure_classes": {},
            "succeeded_only_after_retry_count": 0,
            "quality_score_range": None,
        }

    pass_count = 0
    borderline_failures = 0
    retry_used = 0
    retry_rescues = 0
    rescue_mode_used = 0
    rescue_model_used = 0
    rescue_guardrail_fails = 0
    rescue_under_improved = 0
    rescue_fidelity_risk = 0
    patch_rescue_used = 0
    patch_rescue_success = 0
    repair_only_pass_used = 0
    repair_only_pass_rescued = 0
    rescue_editorial_failure_classes: dict[str, int] = {}
    stopped_reasons: dict[str, int] = {}
    quality_scores: list[float] = []
    for summary in normalized:
        stopped_reason = summary.get("stopped_reason")
        if stopped_reason is None:
            pass_count += 1
        else:
            key = str(stopped_reason)
            stopped_reasons[key] = stopped_reasons.get(key, 0) + 1
        borderline_failures += int(summary.get("borderline_failure_count") or 0)
        retry_used += int(summary.get("retry_used_count") or 0)
        retry_rescues += int(summary.get("retried_success_count") or 0)
        rescue_mode_used += int(summary.get("rescue_mode_used_count") or 0)
        rescue_model_used += int(summary.get("rescue_model_used_count") or 0)
        rescue_guardrail_fails += int(summary.get("rescue_guardrail_fail_count") or 0)
        rescue_under_improved += int(summary.get("rescue_under_improved_count") or 0)
        rescue_fidelity_risk += int(summary.get("rescue_fidelity_risk_count") or 0)
        patch_rescue_used += int(summary.get("patch_rescue_used_count") or 0)
        patch_rescue_success += int(summary.get("patch_rescue_success_count") or 0)
        repair_only_pass_used += int(summary.get("repair_only_pass_used_count") or 0)
        repair_only_pass_rescued += int(summary.get("repair_only_pass_rescued_count") or 0)
        for key, value in (summary.get("rescue_editorial_failure_classes") or {}).items():
            rescue_editorial_failure_classes[str(key)] = rescue_editorial_failure_classes.get(str(key), 0) + int(value or 0)
        score = summary.get("avg_quality_score")
        if isinstance(score, (int, float)):
            quality_scores.append(float(score))

    fail_count = run_count - pass_count
    return {
        "run_count": run_count,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "pass_rate": round(pass_count / run_count, 2),
        "consistency": "stable" if pass_count in (0, run_count) else "unstable",
        "stopped_reasons": stopped_reasons,
        "borderline_failure_rate": round(borderline_failures / run_count, 2),
        "retry_usage_rate": round(retry_used / run_count, 2),
        "retry_rescue_rate": round(retry_rescues / run_count, 2),
        "rescue_mode_usage_rate": round(rescue_mode_used / run_count, 2),
        "rescue_model_usage_rate": round(rescue_model_used / run_count, 2),
        "rescue_guardrail_fail_rate": round(rescue_guardrail_fails / run_count, 2),
        "rescue_under_improved_rate": round(rescue_under_improved / run_count, 2),
        "rescue_fidelity_risk_rate": round(rescue_fidelity_risk / run_count, 2),
        "patch_rescue_usage_rate": round(patch_rescue_used / run_count, 2),
        "patch_rescue_success_rate": round(patch_rescue_success / run_count, 2),
        "repair_only_pass_usage_rate": round(repair_only_pass_used / run_count, 2),
        "repair_only_pass_rescue_rate": round(repair_only_pass_rescued / run_count, 2),
        "rescue_editorial_failure_classes": rescue_editorial_failure_classes,
        "succeeded_only_after_retry_count": retry_rescues,
        "quality_score_range": (
            round(max(quality_scores) - min(quality_scores), 2) if quality_scores else None
        ),
    }


def write_eval_summary(
    *,
    output_path: Path,
    summary: LongFormEvalSummary,
    extra: dict[str, Any] | None = None,
) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload: dict[str, Any] = {
        "summary": summary.to_dict(),
    }
    if extra:
        payload["details"] = extra
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return output_path
