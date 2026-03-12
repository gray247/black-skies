from __future__ import annotations

import pytest

from blackskies.services.model_router import ModelTask, create_default_model_router
from blackskies.services.model_routing import ModelRouterConfig, ModelRoutingPolicy


def test_soft_limit_prefers_local_when_available() -> None:
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_THEN_API_FALLBACK,
        openai_api_key="test-key",
        local_llm_available=True,
    )
    router = create_default_model_router(config)
    policy = router.evaluate_run_policy(ModelTask.DRAFT, budget_status="soft-limit")
    decision = router.route_with_policy(ModelTask.DRAFT, policy)

    assert decision.provider == "local_llm"
    assert decision.reason == "budget.soft_limit"
    assert decision.fallback_used is False


def test_soft_limit_falls_back_to_api_when_local_unavailable() -> None:
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_THEN_API_FALLBACK,
        openai_api_key="test-key",
        local_llm_available=False,
    )
    router = create_default_model_router(config)
    policy = router.evaluate_run_policy(ModelTask.DRAFT, budget_status="soft-limit")
    decision = router.route_with_policy(ModelTask.DRAFT, policy)

    assert decision.provider == "openai"
    assert decision.fallback_used is True


def test_hard_limit_blocks_api_but_allows_local() -> None:
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.API_ONLY,
        openai_api_key="test-key",
        local_llm_available=True,
    )
    router = create_default_model_router(config)
    policy = router.evaluate_run_policy(ModelTask.DRAFT, budget_status="blocked")
    decision = router.route_with_policy(ModelTask.DRAFT, policy)

    assert decision.provider == "local_llm"
    assert decision.reason == "budget.hard_limit"


def test_hard_limit_raises_when_no_local_available() -> None:
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.API_ONLY,
        openai_api_key="test-key",
        local_llm_available=False,
    )
    router = create_default_model_router(config)
    policy = router.evaluate_run_policy(ModelTask.DRAFT, budget_status="blocked")

    with pytest.raises(RuntimeError, match="No healthy model providers available"):
        router.route_with_policy(ModelTask.DRAFT, policy)


def test_local_only_denies_api_under_policy() -> None:
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_ONLY,
        openai_api_key="test-key",
        local_llm_available=False,
    )
    router = create_default_model_router(config)
    policy = router.evaluate_run_policy(ModelTask.DRAFT, budget_status="ok")

    with pytest.raises(RuntimeError, match="No healthy model providers available"):
        router.route_with_policy(ModelTask.DRAFT, policy)


def test_no_healthy_providers_raise() -> None:
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_THEN_API_FALLBACK,
        openai_api_key=None,
        local_llm_available=False,
    )
    router = create_default_model_router(config)
    policy = router.evaluate_run_policy(ModelTask.DRAFT, budget_status="ok")

    with pytest.raises(RuntimeError, match="No healthy model providers available"):
        router.route_with_policy(ModelTask.DRAFT, policy)
