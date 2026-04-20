from __future__ import annotations

from blackskies.services import e2e_mode


def test_synthetic_mode_requires_explicit_flag(monkeypatch) -> None:
    monkeypatch.setenv("BLACKSKIES_E2E_MODE", "1")
    monkeypatch.delenv("BLACKSKIES_E2E_SYNTHETIC_MODE", raising=False)
    assert e2e_mode.is_e2e_mode() is True
    assert e2e_mode.allow_e2e_synthetic_mode() is False


def test_synthetic_mode_enabled_when_both_flags_set(monkeypatch) -> None:
    monkeypatch.setenv("BLACKSKIES_E2E_MODE", "1")
    monkeypatch.setenv("BLACKSKIES_E2E_SYNTHETIC_MODE", "1")
    assert e2e_mode.allow_e2e_synthetic_mode() is True


def test_synthetic_mode_disabled_when_not_e2e(monkeypatch) -> None:
    monkeypatch.delenv("BLACKSKIES_E2E_MODE", raising=False)
    monkeypatch.setenv("BLACKSKIES_E2E_SYNTHETIC_MODE", "1")
    assert e2e_mode.is_e2e_mode() is False
    assert e2e_mode.allow_e2e_synthetic_mode() is False
