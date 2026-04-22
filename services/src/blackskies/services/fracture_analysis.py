"""Heuristic advisory fracture analysis.

This module is intentionally conservative and diagnostics-only.
It must not block or reroute runtime behavior.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Sequence

from .models.advisory import AdvisoryEvidence
from .models.fracture import (
    FractureDiagnostic,
    FractureReport,
    FractureSeverity,
    FractureType,
)
from .prompt_pipeline import evaluate_draft_quality
from .scene_memory import detect_locked_fact_contradiction


@dataclass(slots=True)
class FractureInputs:
    """Runtime signals used by advisory fracture heuristics."""

    source: str
    text: str
    prior_context_present: bool | None = None
    locked_facts: Sequence[str] = field(default_factory=tuple)
    unresolved_tensions: Sequence[str] = field(default_factory=tuple)
    continuity_issues: Sequence[str] = field(default_factory=tuple)
    context_notes: Sequence[str] = field(default_factory=tuple)
    goal: str | None = None
    conflict: str | None = None
    turn: str | None = None
    critique_priorities: Sequence[str] = field(default_factory=tuple)


def analyze_fractures(inputs: FractureInputs) -> FractureReport:
    """Return a diagnostics-only, non-blocking fracture report."""

    fractures: list[FractureDiagnostic] = []

    low_memory = _detect_low_memory_grounding(inputs)
    if low_memory is not None:
        fractures.append(low_memory)

    canon_collision = _detect_canon_collision(inputs)
    if canon_collision is not None:
        fractures.append(canon_collision)

    style_drift = _detect_style_drift(inputs)
    if style_drift is not None:
        fractures.append(style_drift)

    unresolved_pressure = _detect_unresolved_thread_pressure(inputs)
    if unresolved_pressure is not None:
        fractures.append(unresolved_pressure)

    return FractureReport(source=inputs.source, fractures=fractures)


def _detect_low_memory_grounding(inputs: FractureInputs) -> FractureDiagnostic | None:
    issues = {issue.strip().lower() for issue in inputs.continuity_issues if issue}
    notes = [note.lower() for note in inputs.context_notes if isinstance(note, str)]

    if "missing_carryover_reference" in issues:
        return FractureDiagnostic(
            fracture_type=FractureType.LOW_MEMORY_GROUNDING,
            severity=FractureSeverity.MEDIUM,
            rationale="Current text does not reflect available prior-scene carryover.",
            evidence=AdvisoryEvidence(
                summary="Missing carryover continuity signal detected.",
                source_hints=["continuity issue: missing_carryover_reference"],
                source_origins=["continuity_context_builder", "scene_memory"],
            ),
        )

    if any("advisory memory skipped" in note for note in notes):
        return FractureDiagnostic(
            fracture_type=FractureType.LOW_MEMORY_GROUNDING,
            severity=FractureSeverity.LOW,
            rationale="Advisory memory context was skipped, reducing grounding signals.",
            evidence=AdvisoryEvidence(
                summary="Advisory memory context note indicates memory was skipped.",
                source_hints=["context note: advisory memory skipped"],
                source_origins=["continuity_context_builder"],
            ),
        )

    if (
        inputs.prior_context_present is False
        and not inputs.locked_facts
        and len(inputs.unresolved_tensions) == 0
    ):
        return FractureDiagnostic(
            fracture_type=FractureType.LOW_MEMORY_GROUNDING,
            severity=FractureSeverity.LOW,
            rationale="No prior context, locked facts, or unresolved tensions were available.",
            evidence=AdvisoryEvidence(
                summary="Memory packet lacked grounding artifacts for this scene.",
                source_hints=["prior_context=false", "locked_facts=0", "unresolved_tensions=0"],
                source_origins=["scene_memory"],
            ),
        )

    return None


def _detect_canon_collision(inputs: FractureInputs) -> FractureDiagnostic | None:
    issues = {issue.strip().lower() for issue in inputs.continuity_issues if issue}

    if "locked_fact_contradiction" in issues:
        return FractureDiagnostic(
            fracture_type=FractureType.CANON_COLLISION_RISK,
            severity=FractureSeverity.HIGH,
            rationale="Text conflicts with a locked fact continuity signal.",
            evidence=AdvisoryEvidence(
                summary="Locked fact contradiction continuity issue was reported.",
                source_hints=["continuity issue: locked_fact_contradiction"],
                source_origins=["scene_memory", "continuity_evaluation"],
            ),
        )

    if inputs.locked_facts and detect_locked_fact_contradiction(
        inputs.text, list(inputs.locked_facts)
    ):
        return FractureDiagnostic(
            fracture_type=FractureType.CANON_COLLISION_RISK,
            severity=FractureSeverity.HIGH,
            rationale="Text appears to negate an active locked fact.",
            evidence=AdvisoryEvidence(
                summary="Text pattern indicates active locked fact negation.",
                source_hints=["detected not<locked_fact> contradiction pattern"],
                source_origins=["scene_memory"],
            ),
        )

    return None


def _detect_style_drift(inputs: FractureInputs) -> FractureDiagnostic | None:
    quality = evaluate_draft_quality(inputs.text)

    if quality.get("meta_summary") is True:
        return FractureDiagnostic(
            fracture_type=FractureType.STYLE_DRIFT_RISK,
            severity=FractureSeverity.HIGH,
            rationale="Draft text resembles structured meta summary instead of scene prose.",
            evidence=AdvisoryEvidence(
                summary="Draft quality check classified text as meta summary.",
                source_hints=["draft quality: meta_summary=true"],
                source_origins=["prompt_pipeline.evaluate_draft_quality"],
            ),
        )

    if (
        quality.get("word_count", 0) >= 40
        and not quality.get("dialogue")
        and not quality.get("sensory")
    ):
        return FractureDiagnostic(
            fracture_type=FractureType.STYLE_DRIFT_RISK,
            severity=FractureSeverity.MEDIUM,
            rationale="Draft text shows weak voice texture signals (no dialogue/sensory anchors).",
            evidence=AdvisoryEvidence(
                summary="Draft quality check found weak dialogue/sensory anchors.",
                source_hints=["draft quality: dialogue=false, sensory=false"],
                source_origins=["prompt_pipeline.evaluate_draft_quality"],
            ),
        )

    return None


def _detect_unresolved_thread_pressure(inputs: FractureInputs) -> FractureDiagnostic | None:
    unresolved_count = len([item for item in inputs.unresolved_tensions if str(item).strip()])
    has_resolution_signals = bool((inputs.conflict or "").strip()) and bool(
        (inputs.turn or "").strip()
    )
    if unresolved_count >= 5 and not has_resolution_signals:
        return FractureDiagnostic(
            fracture_type=FractureType.UNRESOLVED_THREAD_PRESSURE,
            severity=FractureSeverity.HIGH,
            rationale="High unresolved tension count with missing conflict/turn resolution anchors.",
            evidence=AdvisoryEvidence(
                summary="Unresolved thread load exceeded high-pressure threshold.",
                source_hints=[f"unresolved_tensions={unresolved_count}"],
                source_origins=["scene_memory", "draft_generation_context"],
            ),
        )
    if unresolved_count >= 3 and not has_resolution_signals:
        return FractureDiagnostic(
            fracture_type=FractureType.UNRESOLVED_THREAD_PRESSURE,
            severity=FractureSeverity.MEDIUM,
            rationale="Multiple unresolved tensions are present without clear resolution anchors.",
            evidence=AdvisoryEvidence(
                summary="Unresolved thread load exceeded medium-pressure threshold.",
                source_hints=[f"unresolved_tensions={unresolved_count}"],
                source_origins=["scene_memory", "draft_generation_context"],
            ),
        )

    joined_priorities = " ".join(inputs.critique_priorities).lower()
    pressure_terms = ("unresolved", "dangling", "open question", "thread left open")
    if any(term in joined_priorities for term in pressure_terms):
        return FractureDiagnostic(
            fracture_type=FractureType.UNRESOLVED_THREAD_PRESSURE,
            severity=FractureSeverity.LOW,
            rationale="Critique priorities indicate unresolved thread load.",
            evidence=AdvisoryEvidence(
                summary="Critique priorities mention unresolved or dangling threads.",
                source_hints=["critique priorities mention unresolved/dangling threads"],
                source_origins=["critique_service"],
            ),
        )

    return None


__all__ = ["FractureInputs", "analyze_fractures"]
