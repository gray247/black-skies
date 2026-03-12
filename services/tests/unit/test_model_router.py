"""Tests for the model routing layer."""

from __future__ import annotations

import logging

import pytest

from blackskies.services.model_router import (
    ModelRouter,
    ModelTask,
    create_default_model_router,
)
from blackskies.services.model_routing import ModelRouterConfig, ModelRoutingPolicy


@pytest.mark.parametrize(
    ("policy", "expected_provider", "expected_reason"),
    [
        (ModelRoutingPolicy.LOCAL_ONLY, "local_llm", "policy.local_only"),
        (ModelRoutingPolicy.LOCAL_THEN_API_FALLBACK, "local_llm", "policy.local_then_api_fallback"),
        (ModelRoutingPolicy.API_ONLY, "openai", "policy.api_only"),
    ],
)
def test_policy_selection(policy, expected_provider, expected_reason):
    config = ModelRouterConfig(
        policy=policy,
        openai_api_key="test-key",
    )
    router = create_default_model_router(config)
    decision = router.route(ModelTask.DRAFT)

    assert decision.provider == expected_provider
    assert decision.reason == expected_reason


def test_local_then_api_fallback_when_local_unhealthy():
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_THEN_API_FALLBACK,
        openai_api_key="test-key",
        local_llm_available=False,
    )
    router = create_default_model_router(config)
    decision = router.route(ModelTask.CRITIQUE)

    assert decision.provider == "openai"
    assert decision.reason == "fallback.api"
    assert decision.fallback_used is True


def test_api_only_falls_back_to_local_when_api_missing():
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.API_ONLY,
        openai_api_key=None,
        local_llm_available=True,
    )
    router = create_default_model_router(config)
    decision = router.route(ModelTask.REWRITE)

    assert decision.provider == "local_llm"
    assert decision.reason == "fallback.local"
    assert decision.fallback_used is True


def test_unhealthy_providers_raise():
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_ONLY,
        openai_api_key=None,
        local_llm_available=False,
    )
    router = create_default_model_router(config)

    with pytest.raises(RuntimeError, match="No healthy model providers available"):
        router.route(ModelTask.DRAFT)


@pytest.mark.parametrize("task", [ModelTask.DRAFT, ModelTask.CRITIQUE, ModelTask.REWRITE])
def test_provider_model_mapping_for_local(task):
    config = ModelRouterConfig(policy=ModelRoutingPolicy.LOCAL_ONLY)
    router = create_default_model_router(config)
    decision = router.route(task)

    assert decision.model.provider == "ollama"
    assert decision.model.name == config.local_llm_model


def test_trace_hook_and_log_output(monkeypatch):
    config = ModelRouterConfig(policy=ModelRoutingPolicy.LOCAL_ONLY)
    router = create_default_model_router(config)
    decisions: list[str] = []
    logged: list[str] = []

    def _log(*args, **_kwargs):
        logged.append(args[0] if args else "")

    def _trace(decision):
        decisions.append(decision.reason)

    router.trace_hook = _trace
    monkeypatch.setattr("blackskies.services.model_router.LOGGER.info", _log)

    decision = router.route(ModelTask.DRAFT)

    assert decisions == [decision.reason]
    assert any("model_router decision" in message for message in logged)


def test_local_health_check_blocks_unhealthy(monkeypatch):
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_ONLY,
        local_llm_health_check=True,
        local_llm_available=True,
    )
    router = create_default_model_router(config)
    monkeypatch.setattr(
        "blackskies.services.model_adapters.OllamaAdapter.health_check",
        lambda self: False,
    )
    with pytest.raises(RuntimeError):
        router.route(ModelTask.DRAFT)


def test_local_health_check_falls_back_to_api(monkeypatch):
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_THEN_API_FALLBACK,
        local_llm_health_check=True,
        local_llm_available=True,
        openai_api_key="test-key",
    )
    router = create_default_model_router(config)
    monkeypatch.setattr(
        "blackskies.services.model_adapters.OllamaAdapter.health_check",
        lambda self: False,
    )

    decision = router.route(ModelTask.DRAFT)

    assert decision.provider == "openai"
    assert decision.reason == "fallback.api"
    assert decision.fallback_used is True


def test_local_health_check_allows_healthy(monkeypatch):
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_ONLY,
        local_llm_health_check=True,
        local_llm_available=True,
    )
    router = create_default_model_router(config)
    monkeypatch.setattr(
        "blackskies.services.model_adapters.OllamaAdapter.health_check",
        lambda self: True,
    )
    decision = router.route(ModelTask.DRAFT)
    assert decision.provider == "local_llm"


def test_openai_health_check_allows_available(monkeypatch):
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.API_ONLY,
        openai_api_key="test-key",
        openai_health_check=True,
    )
    router = create_default_model_router(config)
    monkeypatch.setattr(
        "blackskies.services.model_adapters.OpenAIAdapter.health_check",
        lambda self: True,
    )
    decision = router.route(ModelTask.CRITIQUE)
    assert decision.provider == "openai"


def test_openai_model_from_config():
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.API_ONLY,
        openai_api_key="test-key",
        openai_model="gpt-test-mini",
    )
    router = create_default_model_router(config)
    decision = router.route(ModelTask.DRAFT)
    assert decision.model.name == "gpt-test-mini"


def test_router_deterministic_when_api_missing_and_local_unhealthy():
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_THEN_API_FALLBACK,
        openai_api_key=None,
        local_llm_available=False,
    )
    router = create_default_model_router(config)

    with pytest.raises(RuntimeError):
        router.route(ModelTask.DRAFT)


def test_adapter_for_task_disabled_by_default():
    config = ModelRouterConfig(policy=ModelRoutingPolicy.LOCAL_ONLY)
    router = create_default_model_router(config)

    assert router.adapter_for_task(ModelTask.DRAFT) is None


def test_adapter_for_task_returns_local_adapter_when_enabled():
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_ONLY,
        provider_calls_enabled=True,
    )
    router = create_default_model_router(config)

    adapter = router.adapter_for_task(ModelTask.DRAFT)

    assert adapter is not None
    assert adapter.provider_name == "ollama"


def test_adapter_for_task_falls_back_to_openai():
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_THEN_API_FALLBACK,
        provider_calls_enabled=True,
        openai_api_key="test-key",
        local_llm_available=False,
    )
    router = create_default_model_router(config)

    adapter = router.adapter_for_task(ModelTask.DRAFT)

    assert adapter is not None
    assert adapter.provider_name == "openai"
