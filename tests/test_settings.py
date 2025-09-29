from __future__ import annotations

from black_skies.settings import Settings, get_settings


def test_settings_defaults(monkeypatch):
    monkeypatch.delenv("BLACK_SKIES_OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("BLACK_SKIES_BLACK_SKIES_MODE", raising=False)
    get_settings.cache_clear()
    settings = Settings()
    assert settings.openai_api_key is None
    assert settings.black_skies_mode == "offline"
    assert settings.request_timeout_seconds == 30.0


def test_settings_env_override(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("BLACK_SKIES_OPENAI_API_KEY", "sk-test")
    monkeypatch.setenv("BLACK_SKIES_BLACK_SKIES_MODE", "live")

    settings = Settings()
    assert settings.openai_api_key == "sk-test"
    assert settings.black_skies_mode == "live"


def test_get_settings_cached(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("BLACK_SKIES_OPENAI_API_KEY", "sk-cache")
    first = get_settings()
    second = get_settings()
    assert first.openai_api_key == "sk-cache"
    assert first is second
