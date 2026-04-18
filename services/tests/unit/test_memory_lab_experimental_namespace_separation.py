from __future__ import annotations

from pathlib import Path

from blackskies.services.config import ServiceSettings


def test_experimental_namespace_does_not_override_stable_runtime_profile_values(tmp_path: Path) -> None:
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        memory_lab_runtime_profile="stable_conservative_fallback",
        memory_lab_experimental_enabled=True,
        memory_lab_experimental_active_experiments="exp_a,exp_b",
        memory_lab_experimental_fail_closed=False,
        memory_lab_experimental_log_events=False,
    )

    runtime = settings.memory_lab_runtime_options()

    # Stable profile semantics stay intact.
    assert runtime.profile_name == "stable_conservative_fallback"
    assert runtime.alternate_interpretation_threshold == 0.05
    assert runtime.decay_suppressed_fallback_enabled is False

    # Experimental namespace is separate and explicit.
    assert runtime.experimental_enabled is True
    assert runtime.experimental_active_experiments == ("exp_a", "exp_b")
    assert runtime.experimental_fail_closed is False
    assert runtime.experimental_log_events is False
