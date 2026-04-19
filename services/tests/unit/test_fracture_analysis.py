"""Tests for advisory fracture analysis heuristics."""

from __future__ import annotations

from blackskies.services.fracture_analysis import FractureInputs, analyze_fractures


def _has_fracture(report, fracture_type: str) -> bool:  # type: ignore[no-untyped-def]
    return any(entry.fracture_type.value == fracture_type for entry in report.fractures)


def test_low_memory_grounding_positive_and_negative() -> None:
    positive = analyze_fractures(
        FractureInputs(
            source="test",
            text="The corridor was silent.",
            prior_context_present=False,
            locked_facts=[],
            unresolved_tensions=[],
            continuity_issues=[],
            context_notes=[],
        )
    )
    negative = analyze_fractures(
        FractureInputs(
            source="test",
            text="Mara kept the rusted key from the prior scene in her palm.",
            prior_context_present=True,
            locked_facts=["Mara carries the rusted key"],
            unresolved_tensions=["The hidden door remains locked."],
            continuity_issues=[],
            context_notes=[],
        )
    )

    assert _has_fracture(positive, "low_memory_grounding")
    assert not _has_fracture(negative, "low_memory_grounding")


def test_canon_collision_risk_positive_and_negative() -> None:
    positive = analyze_fractures(
        FractureInputs(
            source="test",
            text="Mara does not carry the rusted key anymore.",
            locked_facts=["Mara carry the rusted key"],
            continuity_issues=["locked_fact_contradiction"],
        )
    )
    negative = analyze_fractures(
        FractureInputs(
            source="test",
            text="Mara keeps the rusted key in her coat pocket.",
            locked_facts=["Mara keeps the rusted key in her coat pocket"],
            continuity_issues=[],
        )
    )

    assert _has_fracture(positive, "canon_collision_risk")
    assert not _has_fracture(negative, "canon_collision_risk")


def test_style_drift_risk_positive_and_negative() -> None:
    positive = analyze_fractures(
        FractureInputs(
            source="test",
            text=(
                "Scene title: Basement Return\n"
                "POV: Mara\n"
                "Goal: Find the signal source.\n"
                "Conflict: Power flickers."
            ),
        )
    )
    negative = analyze_fractures(
        FractureInputs(
            source="test",
            text=(
                'Mara whispered, "Keep moving," as the stale air turned metallic and cold. '
                "A cracked bulb hissed above the stairwell while her boots rang on iron steps."
            ),
        )
    )

    assert _has_fracture(positive, "style_drift_risk")
    assert not _has_fracture(negative, "style_drift_risk")


def test_unresolved_thread_pressure_positive_and_negative() -> None:
    positive = analyze_fractures(
        FractureInputs(
            source="test",
            text="The alarms kept sounding in distant rooms.",
            unresolved_tensions=[
                "Who opened the vault?",
                "Where is the missing map?",
                "Why did the signal repeat?",
                "Who sabotaged the generator?",
            ],
            conflict=None,
            turn=None,
        )
    )
    negative = analyze_fractures(
        FractureInputs(
            source="test",
            text="She traced the signal to the relay and shut it down.",
            unresolved_tensions=["The relay source remains unknown."],
            conflict="Signal feedback loop",
            turn="Mara isolates the relay and stops the pulse",
        )
    )

    assert _has_fracture(positive, "unresolved_thread_pressure")
    assert not _has_fracture(negative, "unresolved_thread_pressure")


def test_fracture_reports_are_always_advisory_and_non_blocking() -> None:
    report = analyze_fractures(
        FractureInputs(
            source="test",
            text="The corridor was silent.",
            prior_context_present=False,
        )
    )

    assert report.diagnostics_only is True
    assert report.advisory is True
    assert report.non_blocking is True


def test_fracture_evidence_shape_uses_shared_convention() -> None:
    report = analyze_fractures(
        FractureInputs(
            source="test",
            text=(
                "Scene title: Basement Return\n"
                "POV: Mara\n"
                "Goal: Find the signal source.\n"
                "Conflict: Power flickers."
            ),
        )
    )
    style_entry = next(
        entry for entry in report.fractures if entry.fracture_type.value == "style_drift_risk"
    )
    evidence = style_entry.evidence
    assert evidence.summary
    assert isinstance(evidence.source_hints, list)
    assert isinstance(evidence.source_origins, list)
