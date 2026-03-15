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
    fallback_count: int
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
            "fallback_count": self.fallback_count,
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
    fallbacks = 0
    quality_scores: list[float] = []
    attempts: list[int] = []
    continuity_warnings = 0
    total_estimated = 0.0
    providers: set[str] = set()
    models: set[str] = set()

    for chunk in chunks:
        acceptance = chunk.get("acceptance_reason")
        if acceptance in ("quality_pass", "rewrite_pass"):
            accepted += 1
        if chunk.get("rewrite_used"):
            rewrites += 1
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
        fallback_count=fallbacks,
        avg_quality_score=avg_quality,
        avg_attempts=avg_attempts,
        continuity_warnings=continuity_warnings,
        total_estimated_usd=round(total_estimated, 2),
        providers=sorted(providers),
        models=sorted(models),
        stopped_reason=stopped_reason,
    )


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
