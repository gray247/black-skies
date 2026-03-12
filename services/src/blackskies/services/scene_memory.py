"""Continuity and memory helpers for scene drafts."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .models.outline import OutlineScene


@dataclass(frozen=True)
class SceneMemoryPacket:
    prior_excerpt: str | None
    prior_summary: str | None
    unresolved_tensions: list[str]
    emotional_carryover: str | None
    location_state: str | None
    locked_facts: list[str]
    chapter_context: str | None


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


def _memory_dir(project_root: Path) -> Path:
    return project_root / ".blackskies" / "continuity"


def load_carryover(project_root: Path | None, scene_id: str) -> dict[str, Any] | None:
    if project_root is None:
        return None
    path = _memory_dir(project_root) / f"{scene_id}.json"
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def persist_carryover(project_root: Path, scene_id: str, payload: dict[str, Any]) -> None:
    path = _memory_dir(project_root)
    path.mkdir(parents=True, exist_ok=True)
    target = path / f"{scene_id}.json"
    target.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def extract_carryover(text: str) -> dict[str, Any]:
    sentences = [seg.strip() for seg in text.replace("\n", " ").split(".") if seg.strip()]
    summary = sentences[0] if sentences else ""
    reveals = [s for s in sentences if any(token in s.lower() for token in ("revealed", "learned", "discovered", "realized"))]
    unresolved = [s for s in sentences if any(token in s.lower() for token in ("but", "still", "unresolved", "lingered"))]
    emotional = next((s for s in sentences if any(token in s.lower() for token in ("afraid", "relieved", "angry", "hope", "dread", "fear"))), None)
    location = next((s for s in sentences if any(token in s.lower() for token in ("room", "hall", "basement", "door", "street", "house"))), None)
    return {
        "schema_version": "SceneMemoryPacket v1",
        "summary": summary,
        "reveals": reveals[:3],
        "unresolved": unresolved[:3],
        "emotional_carryover": emotional,
        "location_state": location,
    }


def assemble_scene_memory_packet(
    *,
    project_root: Path | None,
    scene: OutlineScene,
    prior_scene_id: str | None,
    prior_excerpt: str | None,
    chapter_context: str | None,
    locked_facts: list[str] | None = None,
) -> SceneMemoryPacket:
    locked_facts = locked_facts or _read_locked_facts(project_root)
    prior_summary = None
    unresolved_tensions: list[str] = []
    emotional_carryover = None
    location_state = None

    if project_root is not None and prior_scene_id:
        prior_payload = load_carryover(project_root, prior_scene_id)
        if prior_payload:
            prior_summary = prior_payload.get("summary")
            unresolved_tensions = list(prior_payload.get("unresolved") or [])
            emotional_carryover = prior_payload.get("emotional_carryover")
            location_state = prior_payload.get("location_state")

    return SceneMemoryPacket(
        prior_excerpt=prior_excerpt,
        prior_summary=prior_summary,
        unresolved_tensions=unresolved_tensions,
        emotional_carryover=emotional_carryover,
        location_state=location_state,
        locked_facts=locked_facts,
        chapter_context=chapter_context,
    )


def detect_pov_mismatch(text: str, pov: str | None) -> bool:
    if not pov:
        return False
    lowered = text.lower()
    if " i " in lowered or lowered.startswith("i "):
        return pov.lower().split()[0] != "i"
    return False


def detect_locked_fact_contradiction(text: str, locked_facts: list[str]) -> bool:
    lowered = text.lower()
    for fact in locked_facts:
        fact_lower = fact.lower()
        if fact_lower and fact_lower in lowered and f"not {fact_lower}" in lowered:
            return True
    return False


def detect_reset_scaffold(text: str) -> bool:
    lowered = text.lower()
    markers = ["previously", "as before", "recap", "this scene will", "the scene"]
    return any(marker in lowered for marker in markers)


def detect_missing_carryover(text: str, prior_excerpt: str | None) -> bool:
    if not prior_excerpt:
        return False
    keywords = [token for token in prior_excerpt.split() if len(token) > 4]
    lowered = text.lower()
    return not any(keyword.lower() in lowered for keyword in keywords)


def evaluate_continuity(
    *,
    text: str,
    pov: str | None,
    memory: SceneMemoryPacket | None,
) -> dict[str, Any]:
    issues: list[str] = []
    locked_facts = memory.locked_facts if memory else []
    prior_excerpt = memory.prior_excerpt if memory else None

    if detect_pov_mismatch(text, pov):
        issues.append("pov_mismatch")
    if detect_locked_fact_contradiction(text, locked_facts):
        issues.append("locked_fact_contradiction")
    if detect_reset_scaffold(text):
        issues.append("reset_scaffold")
    if detect_missing_carryover(text, prior_excerpt):
        issues.append("missing_carryover_reference")

    return {"issues": issues, "has_issues": bool(issues)}


__all__ = [
    "SceneMemoryPacket",
    "assemble_scene_memory_packet",
    "extract_carryover",
    "persist_carryover",
    "evaluate_continuity",
    "detect_pov_mismatch",
    "detect_locked_fact_contradiction",
    "detect_reset_scaffold",
    "detect_missing_carryover",
]
