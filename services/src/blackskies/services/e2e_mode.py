from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence

E2E_FLAG = "BLACKSKIES_E2E_MODE"
IS_E2E_MODE = os.environ.get(E2E_FLAG) == "1"

SNAPSHOT_ID = "pw-e2e-lock"
SNAPSHOT_PATH = f"history/snapshots/{SNAPSHOT_ID}"
SNAPSHOT_LABEL = "wizard-e2e-lock"

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds") + "Z"

def _scene_metadata(scene_id: str, index: int) -> dict[str, Any]:
    return {
        "id": scene_id,
        "title": f"Scene {scene_id}",
        "order": index + 1,
        "chapter_id": "ch_e2e",
        "beat_refs": [],
    }

def _build_budget() -> dict[str, Any]:
    return {
        "estimated_usd": 0.02,
        "status": "ok",
        "message": "Test harness budget.",
        "soft_limit_usd": 5.0,
        "hard_limit_usd": 10.0,
        "spent_usd": 0.02,
        "total_after_usd": 0.02,
    }

def _load_scene_text(project_root: Path, unit_id: str) -> str:
    draft_file = project_root / "drafts" / f"{unit_id}.md"
    if draft_file.exists():
        try:
            return draft_file.read_text(encoding="utf-8")
        except OSError:
            pass
    return f"Generated test narrative for {unit_id}."


def e2e_phase4_critique_response(unit_id: str) -> dict[str, Any]:
    return {
        "summary": "Scene champions the pacing goals with a decisive turn.",
        "issues": [
            {
                "line": 1,
                "type": "pacing",
                "message": "Focus this paragraph for clarity.",
            }
        ],
        "suggestions": [
            "Lean into tension beats to keep momentum high.",
        ],
    }


def e2e_phase4_rewrite_response(unit_id: str, instructions: str | None) -> dict[str, Any]:
    hint = (instructions or "Highlight stakes and steady the pacing.").strip()
    if not hint:
        hint = "Highlight stakes and steady the pacing."
    revised_text = f"[REWRITE MOCK] {hint}\n\nScene {unit_id} returns to the promised beat."
    return {"revisedText": revised_text}


def e2e_analytics_budget(project_id: str) -> dict[str, Any]:
    budget = _build_budget()
    remaining = max(budget["hard_limit_usd"] - budget["spent_usd"], 0.0)
    return {
        "project_id": project_id,
        "budget": {
            "soft_limit_usd": budget["soft_limit_usd"],
            "hard_limit_usd": budget["hard_limit_usd"],
            "spent_usd": budget["spent_usd"],
            "remaining_usd": remaining,
        },
        "hint": "stable",
        "message": "Budget healthy.",
    }

def is_e2e_mode() -> bool:
    return IS_E2E_MODE

def e2e_preflight_response(
    project_id: str,
    unit_scope: str,
    unit_ids: Sequence[str],
) -> dict[str, Any]:
    return {
        "projectId": project_id,
        "unitScope": unit_scope,
        "unitIds": list(unit_ids),
        "model": {"name": "draft-synthesizer-e2e", "provider": "black-skies-local"},
        "scenes": [_scene_metadata(scene_id, index) for index, scene_id in enumerate(unit_ids)],
        "budget": _build_budget(),
    }

def e2e_generate_response(
    project_root: Path,
    project_id: str,
    unit_scope: str,
    unit_ids: Sequence[str],
) -> dict[str, Any]:
    units = []
    for index, unit_id in enumerate(unit_ids):
        units.append(
            {
                "id": unit_id,
                "text": _load_scene_text(project_root, unit_id),
                "meta": {
                    "id": unit_id,
                    "slug": unit_id,
                    "title": f"Scene {unit_id}",
                    "order": index + 1,
                    "chapter_id": "ch_e2e",
                    "purpose": "escalation",
                    "emotion_tag": "tension",
                    "pov": "Mara",
                    "conflict": "rising tension",
                    "word_target": 900,
                },
            }
        )
    return {
        "project_id": project_id,
        "unit_scope": unit_scope,
        "unit_ids": list(unit_ids),
        "draft_id": f"e2e-draft-{unit_ids[0] if unit_ids else 'root'}",
        "schema_version": "DraftUnitSchema v1",
        "units": units,
        "budget": _build_budget(),
    }

def e2e_critique_response(project_root: Path, project_id: str, unit_id: str) -> dict[str, Any]:
    return {
        "unit_id": unit_id,
        "schema_version": "CritiqueOutputSchema v1",
        "summary": f"Critique summary for {unit_id}.",
        "line_comments": [
            {
                "line": 1,
                "note": "E2E critique highlight: keep focus sharp.",
                "excerpt": _load_scene_text(project_root, unit_id).splitlines()[0],
            }
        ],
        "priorities": ["Maintain tension", "Clarify stakes"],
        "rubric": ["Logic", "Pacing"],
        "rubric_id": "baseline",
        "model": {"name": "critique-e2e", "provider": "offline"},
        "heuristics": {
            "pov_consistency": 1.0,
            "goal_clarity": 0.8,
            "conflict_clarity": 0.9,
            "pacing_fit": 0.85,
        },
        "budget": _build_budget(),
        "line_count": 1,
    }

def e2e_snapshot_manifest(project_id: str) -> dict[str, Any]:
    return {
        "snapshot_id": SNAPSHOT_ID,
        "label": SNAPSHOT_LABEL,
        "created_at": _now_iso(),
        "path": SNAPSHOT_PATH,
        "includes": ["outline.json", "drafts"],
        "files_included": [
            {"path": "outline.json", "checksum": "e2e-outline"},
            {"path": "drafts/sc_0001.md", "checksum": "e2e-draft"},
        ],
    }

def e2e_snapshot_list(project_id: str) -> list[dict[str, Any]]:
    return [e2e_snapshot_manifest(project_id)]

def e2e_backup_verification(project_id: str) -> dict[str, Any]:
    return {
        "project_id": project_id,
        "status": "ok",
        "snapshots": [
            {"snapshot_id": SNAPSHOT_ID, "status": "ok"},
        ],
    }

def e2e_recovery_status(project_id: str) -> dict[str, Any]:
    return {
        "project_id": project_id,
        "status": "idle",
        "needs_recovery": False,
        "last_snapshot": e2e_snapshot_manifest(project_id),
    }

def e2e_recovery_restore(project_id: str) -> dict[str, Any]:
    manifest = e2e_snapshot_manifest(project_id)
    return {
        "project_id": project_id,
        "status": "idle",
        "needs_recovery": False,
        "last_snapshot": manifest,
    }
