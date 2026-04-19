"""Canon Court v1 advisory contradiction review helpers.

Canon Court v1 is log-first and advisory-first:
- detect conservative contradiction signals
- gather compact evidence
- emit candidate rulings
- persist candidate rulings in storage separate from canonical lore/state

This module must never mutate canon or memory state automatically.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Sequence

from .models.advisory import AdvisoryEvidence, AdvisorySeverity
from .models.canon_court import CanonCourtCandidateRuling, CanonCourtContradictionType
from .persistence import write_json_atomic


def _utc_timestamp() -> str:
    return datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")


def _build_contradiction_id(scene_id: str, text: str) -> str:
    digest = hashlib.sha256(f"{scene_id}:{text}".encode("utf-8")).hexdigest()[:10]
    return f"cc_{scene_id}_{digest}"


def _extract_conflicted_locked_facts(text: str, locked_facts: Sequence[str]) -> list[str]:
    lowered = text.lower()
    conflicted: list[str] = []
    for fact in locked_facts:
        candidate = str(fact).strip()
        if not candidate:
            continue
        fact_lower = candidate.lower()
        if fact_lower in lowered and f"not {fact_lower}" in lowered:
            conflicted.append(candidate)
    return conflicted


def detect_candidate_ruling(
    *,
    project_id: str,
    scene_id: str,
    text: str,
    continuity_issues: Sequence[str],
    locked_facts: Sequence[str],
) -> CanonCourtCandidateRuling | None:
    """Detect a conservative contradiction and build an advisory candidate ruling."""

    issues = {item.strip().lower() for item in continuity_issues if str(item).strip()}
    if CanonCourtContradictionType.LOCKED_FACT_CONTRADICTION.value not in issues:
        return None

    conflicted_facts = _extract_conflicted_locked_facts(text, locked_facts)
    if not conflicted_facts:
        # Keep detection conservative: require directly evidenced conflict text.
        return None

    contradiction_id = _build_contradiction_id(scene_id, text)
    candidate_ruling = (
        "Flag as contradiction pending human review; do not auto-update canonical facts."
    )
    rationale = (
        "Locked facts are canonical continuity anchors and contradiction resolution "
        "requires review context not available to automated v1 adjudication."
    )
    evidence_hints = [f"conflicted_locked_fact: {fact}" for fact in conflicted_facts]

    return CanonCourtCandidateRuling(
        contradiction_id=contradiction_id,
        contradiction_type=CanonCourtContradictionType.LOCKED_FACT_CONTRADICTION,
        severity=AdvisorySeverity.HIGH,
        evidence=AdvisoryEvidence(
            summary="Scene text appears to negate one or more locked facts while also referencing them.",
            source_hints=evidence_hints,
            source_origins=["scene_memory", "draft_generation", "canon_court"],
            note="Evidence is sufficient for advisory contradiction logging, not auto-resolution.",
        ),
        candidate_ruling=candidate_ruling,
        rationale=rationale,
        project_id=project_id,
        scene_id=scene_id,
        created_at=_utc_timestamp(),
        metadata={
            "continuity_issue_count": len(issues),
            "locked_facts_considered": len([item for item in locked_facts if str(item).strip()]),
            "conflicted_locked_fact_count": len(conflicted_facts),
        },
    )


def persist_candidate_ruling(
    project_root: Path,
    ruling: CanonCourtCandidateRuling,
) -> Path:
    """Persist candidate ruling in separate advisory storage.

    Storage is intentionally decoupled from canonical lore/state paths.
    """

    rulings_dir = project_root / ".blackskies" / "canon_court" / "candidate_rulings"
    filename = f"{ruling.created_at.replace(':', '').replace('-', '')}_{ruling.contradiction_id}.json"
    path = rulings_dir / filename
    write_json_atomic(path, ruling.model_dump(mode="json"))
    return path


__all__ = ["detect_candidate_ruling", "persist_candidate_ruling"]
