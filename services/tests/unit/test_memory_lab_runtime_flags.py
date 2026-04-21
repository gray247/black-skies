from __future__ import annotations

from pathlib import Path

import pytest

from blackskies.services.config import ServiceSettings
from blackskies.services.memory_lab.governance import (
    GateWaiverRecord,
    append_gate_waiver_record,
    has_gate_waiver,
    load_gate_waiver_records,
)


def test_memory_lab_runtime_profile_defaults_apply(tmp_path: Path) -> None:
    settings = ServiceSettings(project_base_dir=tmp_path)

    options = settings.memory_lab_runtime_options()

    assert options.profile_name == "stable_default"
    assert options.profile_version == "1.0.0"
    assert options.contested_event_retention_limit == 200
    assert options.diagnostics_level == "standard"


def test_memory_lab_runtime_profile_switches_operational_values(tmp_path: Path) -> None:
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        memory_lab_runtime_profile="stable_conservative_fallback",
    )

    options = settings.memory_lab_runtime_options()

    assert options.profile_name == "stable_conservative_fallback"
    assert options.alternate_interpretation_threshold == pytest.approx(0.05)
    assert options.decay_suppressed_fallback_enabled is False
    assert options.diagnostics_level == "minimal"


def test_explicit_threshold_override_wins_over_profile_default(tmp_path: Path) -> None:
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        memory_lab_runtime_profile="stable_conservative_fallback",
        memory_lab_alternate_interpretation_threshold=0.11,
    )

    options = settings.memory_lab_runtime_options()

    assert options.alternate_interpretation_threshold == pytest.approx(0.11)


def test_equal_to_default_value_is_treated_as_implicit_and_profile_still_applies(
    tmp_path: Path,
) -> None:
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        memory_lab_runtime_profile="stable_conservative_fallback",
        # Equal to config default (True) so current precedence treats it as implicit.
        memory_lab_decay_suppressed_fallback_enabled=True,
    )

    options = settings.memory_lab_runtime_options()

    assert options.profile_name == "stable_conservative_fallback"
    # Conservative profile value is False and wins because override equals field default.
    assert options.decay_suppressed_fallback_enabled is False


def test_explicit_non_default_value_overrides_selected_profile(tmp_path: Path) -> None:
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        memory_lab_runtime_profile="stable_default",
        # Non-default override should win over profile.
        memory_lab_decay_suppressed_fallback_enabled=False,
    )

    options = settings.memory_lab_runtime_options()

    assert options.profile_name == "stable_default"
    assert options.decay_suppressed_fallback_enabled is False


def test_invalid_runtime_profile_is_rejected(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="memory_lab_runtime_profile"):
        ServiceSettings(
            project_base_dir=tmp_path,
            memory_lab_runtime_profile="not_a_profile",
        )


def test_gate_waiver_record_round_trip(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    record = GateWaiverRecord(
        gate_id="6B->7A",
        approver="spec-owner",
        revisit_condition="rerun after lock hardening",
        rationale="best-effort env CI lane only",
        mitigation_plan="block promotion on supported tier until rerun",
    )

    append_gate_waiver_record(project_root, record)

    loaded = load_gate_waiver_records(project_root)
    assert len(loaded) == 1
    assert loaded[0].gate_id == "6B->7A"
    assert has_gate_waiver(project_root, "6B->7A") is True
