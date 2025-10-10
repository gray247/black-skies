from __future__ import annotations

import builtins
import importlib
import sys
from pathlib import Path

import pytest

from blackskies.services.settings import Settings, get_settings


def test_settings_defaults(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.delenv("BLACK_SKIES_OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("BLACK_SKIES_BLACK_SKIES_MODE", raising=False)
    monkeypatch.delenv("BLACK_SKIES_MODE", raising=False)
    monkeypatch.chdir(tmp_path)
    get_settings.cache_clear()
    settings = Settings()
    assert settings.openai_api_key is None
    assert settings.black_skies_mode == "offline"
    assert settings.request_timeout_seconds == 30.0


def test_settings_env_override(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    monkeypatch.setenv("BLACK_SKIES_MODE", "LIVE")
    monkeypatch.delenv("BLACK_SKIES_BLACK_SKIES_MODE", raising=False)
    monkeypatch.chdir(tmp_path)

    settings = Settings()
    assert settings.openai_api_key == "sk-test"
    assert settings.black_skies_mode == "live"


def test_settings_legacy_env_override(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
    tmp_path: Path,
) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("BLACK_SKIES_BLACK_SKIES_MODE", "mock")
    monkeypatch.delenv("BLACK_SKIES_MODE", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("BLACK_SKIES_OPENAI_API_KEY", raising=False)
    monkeypatch.chdir(tmp_path)

    with caplog.at_level("WARNING"):
        settings = Settings()

    assert settings.black_skies_mode == "mock"
    assert "BLACK_SKIES_BLACK_SKIES_MODE" in caplog.text


def test_get_settings_cached(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("BLACK_SKIES_OPENAI_API_KEY", "sk-cache")
    monkeypatch.chdir(tmp_path)
    first = get_settings()
    second = get_settings()
    assert first.openai_api_key == "sk-cache"
    assert first is second


def test_settings_module_handles_missing_pydantic_settings(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Ensure the settings module gracefully handles missing optional dependencies."""

    original_import = builtins.__import__

    def _raise_for_pydantic_settings(
        name: str,
        globals: dict[str, object] | None = None,
        locals: dict[str, object] | None = None,
        fromlist: tuple[str, ...] = (),
        level: int = 0,
    ):
        if name == "pydantic_settings":
            raise ModuleNotFoundError("No module named 'pydantic_settings'")
        return original_import(name, globals, locals, fromlist, level)

    monkeypatch.setattr(builtins, "__import__", _raise_for_pydantic_settings)
    sys.modules.pop("blackskies.services.settings", None)

    module = importlib.import_module("blackskies.services.settings")

    assert module.BaseSettings.__module__ == "blackskies.services.settings"

    settings_cls = module.Settings
    get_settings_fn = module.get_settings
    get_settings_fn.cache_clear()
    monkeypatch.chdir(tmp_path)

    instance = settings_cls()
    assert instance.openai_api_key is None
    assert instance.black_skies_mode == "offline"

    restored_settings = get_settings_fn()
    assert restored_settings is get_settings_fn()

    # Restore real import behaviour for subsequent tests.
    monkeypatch.setattr(builtins, "__import__", original_import)
    sys.modules.pop("blackskies.services.settings", None)
    importlib.import_module("blackskies.services.settings")
