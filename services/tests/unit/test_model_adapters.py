"""Tests for provider adapters."""

from __future__ import annotations

import json

import pytest

from blackskies.services.model_adapters import (
    AdapterConfig,
    AdapterError,
    OllamaAdapter,
    OpenAIAdapter,
    normalize_ollama_payload,
)


class _StubResponse:
    def __init__(self, payload: dict, *, status: int = 200) -> None:
        self._payload = payload
        self.status = status

    def read(self) -> bytes:
        return json.dumps(self._payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


def test_ollama_generate_draft_returns_text(monkeypatch):
    adapter = OllamaAdapter(AdapterConfig(base_url="http://localhost:11434", model="qwen3:4b"))

    def _fake_urlopen(request, timeout=0):  # noqa: ARG001
        return _StubResponse({"response": "draft text"})

    monkeypatch.setattr("blackskies.services.model_adapters.url_request.urlopen", _fake_urlopen)

    result = adapter.generate_draft({"prompt": "Write a scene."})

    assert result["text"] == "draft text"


def test_ollama_health_check_ok(monkeypatch):
    adapter = OllamaAdapter(AdapterConfig(base_url="http://localhost:11434", model="qwen3:4b"))

    def _fake_urlopen(request, timeout=0):  # noqa: ARG001
        return _StubResponse({"models": []}, status=200)

    monkeypatch.setattr("blackskies.services.model_adapters.url_request.urlopen", _fake_urlopen)

    assert adapter.health_check() is True


def test_openai_generate_draft_returns_text(monkeypatch):
    adapter = OpenAIAdapter(
        AdapterConfig(base_url="https://api.openai.com/v1", model="gpt-4o-mini"),
        api_key="test-key",
    )

    def _fake_urlopen(request, timeout=0):  # noqa: ARG001
        return _StubResponse({"choices": [{"message": {"content": "response text"}}]})

    monkeypatch.setattr("blackskies.services.model_adapters.url_request.urlopen", _fake_urlopen)

    result = adapter.generate_draft({"prompt": "Write a scene."})

    assert result["text"] == "response text"


def test_openai_missing_key_raises():
    adapter = OpenAIAdapter(
        AdapterConfig(base_url="https://api.openai.com/v1", model="gpt-4o-mini"),
        api_key=None,
    )

    with pytest.raises(AdapterError, match="OpenAI API key is missing"):
        adapter.generate_draft({"prompt": "Write a scene."})


@pytest.mark.parametrize(
    ("payload", "expected", "field"),
    [
        ({"response": "draft"}, "draft", "response"),
        ({"message": {"content": "draft"}}, "draft", "message.content"),
        ({"output_text": "draft"}, "draft", "output_text"),
        ({"thinking": "draft"}, "draft", "thinking"),
        ({"text": "draft"}, "draft", "text"),
    ],
)
def test_normalize_ollama_payload_extracts_fields(payload, expected, field):
    text, thinking_fallback, extracted_field = normalize_ollama_payload(payload)
    assert text == expected
    assert extracted_field == field
    if field == "thinking":
        assert thinking_fallback is True
    else:
        assert thinking_fallback is False


def test_normalize_ollama_payload_missing_fields_returns_none():
    text, thinking_fallback, extracted_field = normalize_ollama_payload({"meta": 123})
    assert text is None
    assert thinking_fallback is False
    assert extracted_field is None
