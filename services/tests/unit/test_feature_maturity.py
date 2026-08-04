"""Tests for feature maturity normalization."""

from __future__ import annotations

from pathlib import Path

from blackskies.services.config import ServiceSettings
from blackskies.services.feature_flags import (
    FeatureMaturity,
    analytics_maturity,
    plugins_maturity,
    voice_notes_maturity,
)


def test_memory_lab_legacy_boolean_normalizes_to_experimental(tmp_path: Path) -> None:
    settings = ServiceSettings(project_base_dir=tmp_path, memory_lab_enabled=True)

    assert settings.memory_lab_feature_maturity is FeatureMaturity.EXPERIMENTAL
    assert settings.memory_lab_enabled is True


def test_backup_verifier_explicit_maturity_overrides_boolean(tmp_path: Path) -> None:
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        backup_verifier_enabled=False,
        backup_verifier_maturity=FeatureMaturity.INTERNAL,
    )

    assert settings.backup_verifier_feature_maturity is FeatureMaturity.INTERNAL
    assert settings.backup_verifier_enabled is True


def test_memory_lab_explicit_maturity_overrides_boolean(tmp_path: Path) -> None:
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        memory_lab_enabled=False,
        memory_lab_maturity=FeatureMaturity.EXPERIMENTAL,
    )

    assert settings.memory_lab_feature_maturity is FeatureMaturity.EXPERIMENTAL
    assert settings.memory_lab_enabled is True


def test_non_feature_booleans_remain_plain_booleans(tmp_path: Path) -> None:
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        model_router_provider_calls_enabled=True,
        model_router_metadata_enabled=False,
    )

    assert isinstance(settings.model_router_provider_calls_enabled, bool)
    assert isinstance(settings.model_router_metadata_enabled, bool)
    assert not hasattr(settings, "model_router_provider_calls_feature_maturity")


def test_feature_flag_env_maturity_normalization(monkeypatch) -> None:
    monkeypatch.setenv("BLACKSKIES_ENABLE_PLUGINS", "1")
    monkeypatch.setenv("BLACKSKIES_ENABLE_VOICE_NOTES", "1")
    monkeypatch.setenv("BLACKSKIES_ENABLE_ANALYTICS", "1")

    assert plugins_maturity() is FeatureMaturity.PARTIAL
    assert voice_notes_maturity() is FeatureMaturity.INTERNAL
    assert analytics_maturity() is FeatureMaturity.INTERNAL


def test_analytics_is_off_without_explicit_opt_in(monkeypatch) -> None:
    monkeypatch.delenv("BLACKSKIES_ENABLE_ANALYTICS", raising=False)
    monkeypatch.delenv("BLACKSKIES_ANALYTICS_MATURITY", raising=False)

    assert analytics_maturity() is FeatureMaturity.OFF
