"""Diagnostics SLO evaluation helpers for Memory Lab (Phase 6B)."""

from __future__ import annotations

from dataclasses import dataclass

from .diagnostics import MemoryLabRuntimeDiagnostics


@dataclass(frozen=True)
class DiagnosticsSLOTargets:
    decision_explainability_coverage_min: float = 0.99
    availability_reason_code_coverage_min: float = 1.0
    failure_visibility_coverage_min: float = 1.0
    corruption_visibility_coverage_min: float = 1.0


@dataclass(frozen=True)
class DiagnosticsSLOReport:
    decision_explainability_coverage: float
    availability_reason_code_coverage: float
    failure_visibility_coverage: float
    corruption_visibility_coverage: float
    meets_targets: bool
    failing_targets: list[str]


_REQUIRED_SLOT_FIELDS = (
    "winner",
    "top_loser",
    "score_delta",
    "used_fallback",
    "tie_break_tuple",
    "tie_break_rationale",
)


def evaluate_diagnostics_slo(
    diagnostics_rows: list[MemoryLabRuntimeDiagnostics],
    *,
    targets: DiagnosticsSLOTargets | None = None,
) -> DiagnosticsSLOReport:
    effective_targets = targets or DiagnosticsSLOTargets()

    explainability_total = 0
    explainability_ok = 0
    unavailable_total = 0
    unavailable_with_reason = 0
    failure_total = 0
    failure_visible = 0
    corruption_total = 0
    corruption_visible = 0

    for row in diagnostics_rows:
        for slot in row.slot_selection_diagnostics:
            explainability_total += 1
            if _slot_has_explainability(slot):
                explainability_ok += 1

        if (
            not row.used_legacy_continuity_only
            and row.memory_lab_enabled
            and not row.advisory_available
        ):
            unavailable_total += 1
            if row.advisory_unavailable_reason_code:
                unavailable_with_reason += 1

        if row.failure_entries:
            failure_total += len(row.failure_entries)
            failure_visible += sum(1 for item in row.failure_entries if item.strip())

        if row.corruption_entries:
            corruption_total += len(row.corruption_entries)
            corruption_visible += sum(1 for item in row.corruption_entries if item.strip())

    decision_coverage = _ratio(explainability_ok, explainability_total)
    availability_coverage = _ratio(unavailable_with_reason, unavailable_total)
    failure_coverage = _ratio(failure_visible, failure_total)
    corruption_coverage = _ratio(corruption_visible, corruption_total)

    failing: list[str] = []
    if decision_coverage < effective_targets.decision_explainability_coverage_min:
        failing.append("decision_explainability_coverage")
    if availability_coverage < effective_targets.availability_reason_code_coverage_min:
        failing.append("availability_reason_code_coverage")
    if failure_coverage < effective_targets.failure_visibility_coverage_min:
        failing.append("failure_visibility_coverage")
    if corruption_coverage < effective_targets.corruption_visibility_coverage_min:
        failing.append("corruption_visibility_coverage")

    return DiagnosticsSLOReport(
        decision_explainability_coverage=decision_coverage,
        availability_reason_code_coverage=availability_coverage,
        failure_visibility_coverage=failure_coverage,
        corruption_visibility_coverage=corruption_coverage,
        meets_targets=not failing,
        failing_targets=failing,
    )


def _slot_has_explainability(slot: dict[str, object]) -> bool:
    if not all(field in slot for field in _REQUIRED_SLOT_FIELDS):
        return False
    rationale = slot.get("tie_break_rationale")
    if not isinstance(rationale, str) or not rationale.strip():
        return False
    winner = slot.get("winner")
    if winner is None:
        return False

    # If loser/delta is null, rationale must explain why this is expected.
    loser = slot.get("top_loser")
    delta = slot.get("score_delta")
    if loser is None or delta is None:
        return (
            "no loser" in rationale.lower()
            or "single candidate" in rationale.lower()
            or "no winner selected" in rationale.lower()
        )
    return True


def _ratio(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 1.0
    return float(numerator) / float(denominator)
