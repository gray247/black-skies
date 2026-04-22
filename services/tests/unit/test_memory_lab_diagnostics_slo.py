from __future__ import annotations

from blackskies.services.memory_lab.diagnostics import MemoryLabRuntimeDiagnostics
from blackskies.services.memory_lab.slo import evaluate_diagnostics_slo


def _base_diag() -> MemoryLabRuntimeDiagnostics:
    return MemoryLabRuntimeDiagnostics(
        memory_lab_enabled=True,
        used_legacy_continuity_only=False,
        current_scene_order=7,
        lock_acquired=True,
        decay_events_written=0,
        reinforcement_events_written=0,
        revival_events_written=0,
        anchor_promotions=0,
        environment_tier="supported_deterministic",
        advisory_available=True,
        advisory_unavailable_reason_code=None,
        slot_selection_diagnostics=[
            {
                "slot": "summary",
                "winner": "art_1",
                "top_loser": "art_2",
                "score_delta": 0.04,
                "used_fallback": False,
                "tie_break_tuple": (1.0, 0.0, 1.0, 0.0, "art_1"),
                "tie_break_rationale": "sorted by comparator",
            }
        ],
        failure_entries=["write_entry_failed scene_id=sc_0001 error=io"],
        corruption_entries=["event_file_corruption contested_events:sc_0001.json:unreadable_json"],
        notes=[],
    )


def test_diagnostics_slo_meets_targets_with_complete_rows() -> None:
    report = evaluate_diagnostics_slo([_base_diag()])

    assert report.meets_targets is True
    assert report.failing_targets == []
    assert report.decision_explainability_coverage == 1.0
    assert report.failure_visibility_coverage == 1.0
    assert report.corruption_visibility_coverage == 1.0


def test_diagnostics_slo_fails_on_missing_required_fields_and_reason_codes() -> None:
    unavailable = MemoryLabRuntimeDiagnostics(
        memory_lab_enabled=True,
        used_legacy_continuity_only=False,
        current_scene_order=7,
        lock_acquired=True,
        decay_events_written=0,
        reinforcement_events_written=0,
        revival_events_written=0,
        anchor_promotions=0,
        environment_tier="supported_deterministic",
        advisory_available=False,
        advisory_unavailable_reason_code=None,
        slot_selection_diagnostics=[
            {
                "slot": "summary",
                "winner": "art_1",
                "top_loser": None,
                "score_delta": None,
                "used_fallback": False,
                "tie_break_tuple": (1.0, 0.0, 1.0, 0.0, "art_1"),
                "tie_break_rationale": "",  # invalid: missing explicit reason
            }
        ],
        failure_entries=[""],
        corruption_entries=[""],
        notes=[],
    )

    report = evaluate_diagnostics_slo([unavailable])

    assert report.meets_targets is False
    assert "decision_explainability_coverage" in report.failing_targets
    assert "availability_reason_code_coverage" in report.failing_targets
    assert "failure_visibility_coverage" in report.failing_targets
    assert "corruption_visibility_coverage" in report.failing_targets
