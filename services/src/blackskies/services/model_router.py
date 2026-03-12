"""Routing layer for model provider selection."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable, Protocol

from .model_routing import ModelRouterConfig, ModelRoutingPolicy
from .model_adapters import AdapterConfig, BaseAdapter, OllamaAdapter, OpenAIAdapter

LOGGER = logging.getLogger(__name__)


class ModelTask(str, Enum):
    """Enumeration of model-backed tasks."""

    OUTLINE = "outline"
    DRAFT = "draft"
    CRITIQUE = "critique"
    REWRITE = "rewrite"


@dataclass(frozen=True)
class ModelSpec:
    """Resolved model metadata."""

    name: str
    provider: str


@dataclass(frozen=True)
class ModelRouteDecision:
    """Result of a routing decision."""

    task: ModelTask
    policy: ModelRoutingPolicy
    provider: str
    model: ModelSpec
    reason: str
    fallback_used: bool = False


def format_route_metadata(decision: ModelRouteDecision) -> dict[str, object]:
    """Return a JSON-ready routing metadata payload."""

    return {
        "policy": decision.policy.value,
        "provider": decision.provider,
        "model": decision.model.name,
        "reason": decision.reason,
        "fallback_used": decision.fallback_used,
    }


class ModelProvider(Protocol):
    """Protocol for model providers."""

    name: str

    def is_available(self, config: ModelRouterConfig) -> bool:
        ...

    def select_model(self, task: ModelTask, config: ModelRouterConfig) -> ModelSpec:
        ...

    def supports(self, task: ModelTask) -> bool:
        ...

    def adapter(self) -> BaseAdapter | None:
        ...


class LocalLLMProvider:
    """Placeholder provider for local inference."""

    name = "local_llm"

    def __init__(self, adapter: BaseAdapter) -> None:
        self._adapter = adapter

    def is_available(self, config: ModelRouterConfig) -> bool:
        if not config.local_llm_available:
            return False
        if config.local_llm_health_check:
            return self._adapter.health_check()
        return True

    def select_model(self, task: ModelTask, config: ModelRouterConfig) -> ModelSpec:  # noqa: ARG002
        if task is ModelTask.OUTLINE:
            return ModelSpec(name="outline-builder-v1", provider=self._adapter.provider_name)
        return ModelSpec(name=config.local_llm_model, provider=self._adapter.provider_name)

    def supports(self, task: ModelTask) -> bool:
        return task in {ModelTask.DRAFT, ModelTask.CRITIQUE, ModelTask.REWRITE}

    def adapter(self) -> BaseAdapter | None:
        return self._adapter


class OpenAIProvider:
    """Placeholder provider for OpenAI-backed inference."""

    name = "openai"

    def __init__(self, adapter: OpenAIAdapter) -> None:
        self._adapter = adapter

    def is_available(self, config: ModelRouterConfig) -> bool:
        if not config.openai_api_key:
            return False
        if config.openai_health_check:
            return self._adapter.health_check()
        return True

    def select_model(self, task: ModelTask, config: ModelRouterConfig) -> ModelSpec:  # noqa: ARG002
        if task is ModelTask.OUTLINE:
            return ModelSpec(name="openai.outline", provider="openai")
        return ModelSpec(name=config.openai_model, provider="openai")

    def supports(self, task: ModelTask) -> bool:
        return task in {ModelTask.DRAFT, ModelTask.CRITIQUE, ModelTask.REWRITE}

    def adapter(self) -> BaseAdapter | None:
        return self._adapter


@dataclass
class ModelRouter:
    """Resolve model provider selection decisions."""

    config: ModelRouterConfig
    providers: dict[str, ModelProvider] = field(default_factory=dict)
    trace_hook: Callable[[ModelRouteDecision], None] | None = None

    def register_provider(self, provider: ModelProvider) -> None:
        self.providers[provider.name] = provider

    def route(self, task: ModelTask) -> ModelRouteDecision:
        policy = self.config.policy
        local = self.providers.get("local_llm")
        api = self.providers.get("openai")
        fallback_used = False
        local_available = bool(
            local and local.supports(task) and local.is_available(self.config)
        )
        api_available = bool(
            api and api.supports(task) and api.is_available(self.config)
        )

        if policy is ModelRoutingPolicy.API_ONLY:
            if api_available:
                decision = self._build_decision(task, api, "policy.api_only")
                self._trace(decision)
                return decision
            fallback_used = True

        if policy is ModelRoutingPolicy.LOCAL_ONLY:
            if local_available:
                decision = self._build_decision(task, local, "policy.local_only")
                self._trace(decision)
                return decision
            fallback_used = True

        if policy is ModelRoutingPolicy.LOCAL_THEN_API_FALLBACK:
            if local_available:
                decision = self._build_decision(task, local, "policy.local_then_api_fallback")
                self._trace(decision)
                return decision
            fallback_used = True

        if api_available:
            decision = self._build_decision(task, api, "fallback.api")
            decision = ModelRouteDecision(
                **{**decision.__dict__, "fallback_used": fallback_used},
            )
            self._trace(decision)
            return decision

        if local_available:
            decision = self._build_decision(task, local, "fallback.local")
            decision = ModelRouteDecision(
                **{**decision.__dict__, "fallback_used": fallback_used},
            )
            self._trace(decision)
            return decision

        LOGGER.warning(
            "model_router no healthy providers task=%s policy=%s local_available=%s api_available=%s",
            task.value,
            policy.value,
            local_available,
            api_available,
        )
        raise RuntimeError("No healthy model providers available.")

    def _build_decision(
        self,
        task: ModelTask,
        provider: ModelProvider,
        reason: str,
    ) -> ModelRouteDecision:
        model = provider.select_model(task, self.config)
        return ModelRouteDecision(
            task=task,
            policy=self.config.policy,
            provider=provider.name,
            model=model,
            reason=reason,
        )

    def _trace(self, decision: ModelRouteDecision) -> None:
        if self.trace_hook:
            self.trace_hook(decision)
        if self.config.log_decisions:
            LOGGER.info(
                "model_router decision task=%s policy=%s provider=%s model=%s reason=%s fallback=%s",
                decision.task.value,
                decision.policy.value,
                decision.provider,
                decision.model.name,
                decision.reason,
                decision.fallback_used,
            )

    def adapter_for_task(self, task: ModelTask) -> BaseAdapter | None:
        if not self.config.provider_calls_enabled:
            return None
        decision = self.route(task)
        provider = self.providers.get(decision.provider)
        if provider is None:
            return None
        if not provider.supports(task):
            return None
        return provider.adapter()


def create_default_model_router(config: ModelRouterConfig) -> ModelRouter:
    """Create a model router with default providers registered."""

    router = ModelRouter(config=config)
    if config.local_provider.lower() == "ollama":
        local_adapter = OllamaAdapter(
            AdapterConfig(
                base_url=config.local_llm_base_url,
                model=config.local_llm_model,
                timeout_seconds=config.local_llm_timeout_seconds,
            )
        )
        router.register_provider(LocalLLMProvider(adapter=local_adapter))
    else:
        LOGGER.warning(
            "model_router unsupported local_provider=%s; local provider disabled",
            config.local_provider,
        )

    openai_adapter = OpenAIAdapter(
        AdapterConfig(
            base_url=config.openai_base_url,
            model=config.openai_model,
            timeout_seconds=config.openai_timeout_seconds,
        ),
        api_key=config.openai_api_key,
    )
    router.register_provider(OpenAIProvider(adapter=openai_adapter))
    return router


__all__ = [
    "ModelTask",
    "ModelSpec",
    "ModelRouteDecision",
    "format_route_metadata",
    "ModelProvider",
    "ModelRouter",
    "LocalLLMProvider",
    "OpenAIProvider",
    "create_default_model_router",
]
