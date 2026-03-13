"""Long-form preparation helpers for multi-scene drafting."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .scene_memory import load_carryover


@dataclass(frozen=True)
class ChapterMemoryPacket:
    chapter_id: str
    scene_ids: list[str]
    chapter_context: str | None
    locked_facts: list[str]
    accumulated_summaries: list[str]
    unresolved_tensions: list[str]
    emotional_carryover: str | None
    pacing_carryover: str | None


@dataclass(frozen=True)
class LongFormChunk:
    chunk_id: str
    chapter_id: str
    scene_ids: list[str]
    order: int
    continuation_of: str | None
    prompt_fingerprint: str
    provider: str | None
    model: str | None
    continuity_snapshot: dict[str, Any]
    budget_snapshot: dict[str, Any]
    routing_snapshot: dict[str, Any] | None = None


@dataclass(frozen=True)
class ContinuationPacket:
    chunk_id: str
    chapter_id: str
    order: int
    prior_excerpt: str | None
    prior_summary: str | None
    chapter_memory: ChapterMemoryPacket
    target_words: int | None
    constraints: list[str]
    continuity_snapshot: dict[str, Any]


def _read_locked_facts(project_root: Path | None) -> list[str]:
    if project_root is None:
        return []
    candidates = [
        project_root / "locked_facts.json",
        project_root / ".blackskies" / "locked_facts.json",
    ]
    for path in candidates:
        if not path.exists():
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(payload, list):
            return [str(item).strip() for item in payload if str(item).strip()]
        if isinstance(payload, dict):
            facts = payload.get("facts")
            if isinstance(facts, list):
                return [str(item).strip() for item in facts if str(item).strip()]
    return []


def _read_chapter_context(project_root: Path | None, chapter_id: str) -> str | None:
    if project_root is None:
        return None
    outline_path = project_root / "outline.json"
    if not outline_path.exists():
        return None
    try:
        payload = json.loads(outline_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(payload, dict):
        return None
    chapter_title = None
    chapters = payload.get("chapters")
    if isinstance(chapters, list):
        for entry in chapters:
            if not isinstance(entry, dict):
                continue
            if entry.get("id") == chapter_id:
                chapter_title = entry.get("title")
                break
    if chapter_title is None:
        return None
    act_titles = payload.get("acts")
    if isinstance(act_titles, list) and act_titles:
        return f"{act_titles[0]} - {chapter_title}"
    return str(chapter_title)


def assemble_chapter_memory(
    *,
    project_root: Path | None,
    chapter_id: str,
    scene_ids: list[str],
) -> ChapterMemoryPacket:
    accumulated_summaries: list[str] = []
    unresolved_tensions: list[str] = []
    emotional_carryover = None
    pacing_carryover = None

    if project_root is not None:
        for scene_id in scene_ids:
            payload = load_carryover(project_root, scene_id)
            if not payload:
                continue
            summary = payload.get("summary")
            if isinstance(summary, str) and summary.strip():
                accumulated_summaries.append(summary.strip())
            unresolved = payload.get("unresolved")
            if isinstance(unresolved, list):
                unresolved_tensions.extend(
                    [str(item).strip() for item in unresolved if str(item).strip()]
                )
            emotional = payload.get("emotional_carryover")
            if isinstance(emotional, str) and emotional.strip():
                emotional_carryover = emotional.strip()
            pacing = payload.get("pacing_carryover")
            if isinstance(pacing, str) and pacing.strip():
                pacing_carryover = pacing.strip()

    return ChapterMemoryPacket(
        chapter_id=chapter_id,
        scene_ids=list(scene_ids),
        chapter_context=_read_chapter_context(project_root, chapter_id),
        locked_facts=_read_locked_facts(project_root),
        accumulated_summaries=accumulated_summaries,
        unresolved_tensions=unresolved_tensions,
        emotional_carryover=emotional_carryover,
        pacing_carryover=pacing_carryover,
    )


def _extract_excerpt(text: str | None, *, max_lines: int = 5) -> str | None:
    if not text:
        return None
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return None
    excerpt = " ".join(lines[:max_lines]).strip()
    return excerpt or None


def assemble_continuation_packet(
    *,
    chunk_id: str,
    chapter_id: str,
    order: int,
    previous_chunk: LongFormChunk | None,
    previous_text: str | None,
    chapter_memory: ChapterMemoryPacket,
    target_words: int | None,
    constraints: list[str] | None = None,
) -> ContinuationPacket:
    prior_summary = None
    continuity_snapshot: dict[str, Any] = {}
    if previous_chunk:
        continuity_snapshot = dict(previous_chunk.continuity_snapshot)
        summary = continuity_snapshot.get("summary")
        if isinstance(summary, str) and summary.strip():
            prior_summary = summary.strip()
    if prior_summary is None and previous_text:
        sentences = [seg.strip() for seg in previous_text.replace("\n", " ").split(".") if seg.strip()]
        prior_summary = sentences[0] if sentences else None

    return ContinuationPacket(
        chunk_id=chunk_id,
        chapter_id=chapter_id,
        order=order,
        prior_excerpt=_extract_excerpt(previous_text),
        prior_summary=prior_summary,
        chapter_memory=chapter_memory,
        target_words=target_words,
        constraints=constraints or [],
        continuity_snapshot=continuity_snapshot,
    )


def fingerprint_long_form_prompt(payload: dict[str, Any]) -> str:
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    digest = hashlib.sha256(serialized).hexdigest()
    return f"sha256:{digest}"


def _meta_summary_detected(text: str) -> bool:
    lowered = text.lower()
    markers = ["summary:", "outline:", "beats:", "scene title:", "chapter:"]
    if any(marker in lowered for marker in markers):
        return True
    list_lines = [line for line in text.splitlines() if line.strip().startswith(("-", "*"))]
    if list_lines and len(list_lines) >= max(2, len(text.splitlines()) // 2):
        return True
    return False


def evaluate_long_form_output(
    text: str | None,
    *,
    prior_excerpt: str | None = None,
) -> dict[str, Any]:
    if not isinstance(text, str):
        return {"usable": False, "reason": "not_text"}
    stripped = text.strip()
    if not stripped:
        return {"usable": False, "reason": "empty"}
    words = [token for token in stripped.split() if token]
    word_count = len(words)
    meta = _meta_summary_detected(stripped)
    missing_carryover = False
    if prior_excerpt:
        tokens = [token for token in prior_excerpt.split() if len(token) > 4]
        lowered = stripped.lower()
        missing_carryover = not any(token.lower() in lowered for token in tokens)
    usable = word_count >= 60 and not meta
    return {
        "usable": usable,
        "word_count": word_count,
        "meta_summary": meta,
        "missing_carryover": missing_carryover,
    }


def normalize_long_form_output(text: str | None) -> str | None:
    if not isinstance(text, str):
        return None
    cleaned = text.strip()
    if not cleaned:
        return None
    lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
    if not lines:
        return None
    filtered: list[str] = []
    drop_prefixes = (
        "chapter:",
        "scene ids:",
        "prior summary:",
        "prior excerpt:",
        "locked facts:",
        "constraints:",
        "target word range:",
    )
    for line in lines:
        lowered = line.lower()
        if lowered.startswith(drop_prefixes):
            continue
        filtered.append(line)
    if not filtered:
        return cleaned
    return "\n".join(filtered).strip()


def is_usable_long_form_output(text: str | None, *, prior_excerpt: str | None = None) -> bool:
    report = evaluate_long_form_output(text, prior_excerpt=prior_excerpt)
    return bool(report.get("usable"))


def _chunk_dir(project_root: Path) -> Path:
    return project_root / ".blackskies" / "long_form" / "chunks"

def _chunk_text_dir(project_root: Path) -> Path:
    return project_root / ".blackskies" / "long_form" / "texts"


def persist_long_form_chunk(project_root: Path, chunk: LongFormChunk) -> Path:
    path = _chunk_dir(project_root)
    path.mkdir(parents=True, exist_ok=True)
    target = path / f"{chunk.chunk_id}.json"
    payload = {
        "chunk_id": chunk.chunk_id,
        "chapter_id": chunk.chapter_id,
        "scene_ids": list(chunk.scene_ids),
        "order": chunk.order,
        "continuation_of": chunk.continuation_of,
        "prompt_fingerprint": chunk.prompt_fingerprint,
        "provider": chunk.provider,
        "model": chunk.model,
        "continuity_snapshot": chunk.continuity_snapshot,
        "budget_snapshot": chunk.budget_snapshot,
        "routing_snapshot": chunk.routing_snapshot,
    }
    target.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return target

def persist_long_form_text(project_root: Path, chunk_id: str, text: str) -> Path:
    path = _chunk_text_dir(project_root)
    path.mkdir(parents=True, exist_ok=True)
    target = path / f"{chunk_id}.md"
    target.write_text(text, encoding="utf-8")
    return target


def load_long_form_chunk(project_root: Path, chunk_id: str) -> LongFormChunk | None:
    path = _chunk_dir(project_root) / f"{chunk_id}.json"
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(payload, dict):
        return None
    return LongFormChunk(
        chunk_id=str(payload.get("chunk_id")),
        chapter_id=str(payload.get("chapter_id")),
        scene_ids=[str(item) for item in payload.get("scene_ids") or []],
        order=int(payload.get("order") or 0),
        continuation_of=payload.get("continuation_of"),
        prompt_fingerprint=str(payload.get("prompt_fingerprint") or ""),
        provider=payload.get("provider"),
        model=payload.get("model"),
        continuity_snapshot=dict(payload.get("continuity_snapshot") or {}),
        budget_snapshot=dict(payload.get("budget_snapshot") or {}),
        routing_snapshot=payload.get("routing_snapshot"),
    )


def aggregate_long_form_budget(chunks: list[LongFormChunk]) -> dict[str, Any]:
    total_estimated = 0.0
    chunk_count = len(chunks)
    for chunk in chunks:
        estimate = chunk.budget_snapshot.get("estimated_usd")
        if isinstance(estimate, (int, float)) and estimate >= 0:
            total_estimated += float(estimate)
    return {
        "chunk_count": chunk_count,
        "estimated_usd": round(total_estimated, 2),
    }


__all__ = [
    "ChapterMemoryPacket",
    "LongFormChunk",
    "ContinuationPacket",
    "assemble_chapter_memory",
    "assemble_continuation_packet",
    "fingerprint_long_form_prompt",
    "evaluate_long_form_output",
    "normalize_long_form_output",
    "is_usable_long_form_output",
    "persist_long_form_chunk",
    "persist_long_form_text",
    "load_long_form_chunk",
    "aggregate_long_form_budget",
]
