"""Model routing policy definitions."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ModelRoutingPolicy(str, Enum):
    """Policy modes for routing model calls."""

    LOCAL_ONLY = "local_only"
    LOCAL_THEN_API_FALLBACK = "local_then_api_fallback"
    API_ONLY = "api_only"


@dataclass(frozen=True)
class ModelRouterConfig:
    """Configuration for model routing decisions."""

    policy: ModelRoutingPolicy
    openai_api_key: str | None = None
    provider_calls_enabled: bool = False
    local_provider: str = "ollama"
    local_llm_available: bool = True
    local_llm_base_url: str = "http://127.0.0.1:11434"
    local_llm_model: str = "qwen3:4b"
    local_llm_health_check: bool = False
    local_llm_timeout_seconds: float = 12.0
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str = "https://api.openai.com/v1"
    openai_health_check: bool = False
    openai_timeout_seconds: float = 30.0
    log_decisions: bool = True
    routing_metadata_enabled: bool = False


__all__ = ["ModelRoutingPolicy", "ModelRouterConfig"]
