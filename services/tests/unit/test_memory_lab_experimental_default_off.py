from __future__ import annotations

from pathlib import Path

from blackskies.services.config import ServiceSettings


def test_experimental_namespace_defaults_off(tmp_path: Path) -> None:
    settings = ServiceSettings(project_base_dir=tmp_path)

    assert settings.memory_lab_experimental_enabled is False
    assert settings.memory_lab_experimental_active_experiments == ""
    assert settings.memory_lab_experimental_fail_closed is True
    assert settings.memory_lab_experimental_log_events is True

    runtime = settings.memory_lab_runtime_options()
    assert runtime.experimental_enabled is False
    assert runtime.experimental_active_experiments == ()
    assert runtime.experimental_fail_closed is True
    assert runtime.experimental_log_events is True
