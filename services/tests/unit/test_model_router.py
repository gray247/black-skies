"""Tests for the model routing layer."""

from __future__ import annotations


import pytest

from blackskies.services.model_router import (
    ModelTask,
    create_default_model_router,
)
from blackskies.services.model_routing import ModelRouterConfig, ModelRoutingPolicy
from blackskies.services.run_policy import RunPolicyDecision


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
    assert decision.prompt_profile in {
        "local_ollama_fast_draft",
        "remote_openai_heavy_draft",
    }


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
    assert decision.prompt_profile == "remote_openai_heavy_draft"


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


def test_local_route_exposes_prompt_profile():
    config = ModelRouterConfig(policy=ModelRoutingPolicy.LOCAL_ONLY)
    router = create_default_model_router(config)

    decision = router.route(ModelTask.DRAFT)

    assert decision.prompt_profile == "local_ollama_fast_draft"


@pytest.mark.parametrize("task", list(ModelTask))
@pytest.mark.parametrize("local_available", [True, False])
def test_local_only_never_probes_or_falls_back_to_remote(task, local_available, monkeypatch):
    router = create_default_model_router(ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_ONLY,
        openai_api_key="synthetic-key",
        local_llm_available=local_available,
    ))

    def forbidden_remote_probe(*_args):
        pytest.fail("LOCAL_ONLY must not inspect a remote provider")

    monkeypatch.setattr(router.providers["openai"], "supports", forbidden_remote_probe)
    monkeypatch.setattr(router.providers["openai"], "is_available", forbidden_remote_probe)
    can_route_locally = local_available and router.providers["local_llm"].supports(task)
    if can_route_locally:
        assert router.route(task).provider == "local_llm"
    else:
        with pytest.raises(RuntimeError, match="No healthy model providers available"):
            router.route(task)
    decision = router.evaluate_run_policy(task, budget_status="ok")
    assert decision.allow_api is False
    if can_route_locally:
        assert router.route_with_policy(task, decision).provider == "local_llm"
    else:
        with pytest.raises(RuntimeError, match="No healthy model providers available"):
            router.route_with_policy(task, decision)


def test_local_only_rejects_a_run_policy_envelope_that_permits_remote(monkeypatch):
    router = create_default_model_router(ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_ONLY,
        openai_api_key="synthetic-key",
        local_llm_available=False,
    ))
    monkeypatch.setattr(router.providers["openai"], "is_available",
                        lambda *_args: pytest.fail("Remote provider must remain unprobed"))
    decision = RunPolicyDecision(task="draft", policy=ModelRoutingPolicy.API_ONLY,
        budget_status="ok", allow_local=False, allow_api=True, prefer_local=False,
        reason="synthetic stale policy", warnings=[])

    with pytest.raises(RuntimeError, match="No healthy model providers available"):
        router.route_with_policy(ModelTask.DRAFT, decision)
