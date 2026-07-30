"""Prompt pipeline facade for provider-backed generation."""

from __future__ import annotations

from typing import Any

from .advisory_memory_resolver import (  # noqa: F401 - tested compatibility export
    resolve_advisory_memory_packet as _resolve_memory_lab_packet,
)
from .continuity_context_builder import SceneContext, assemble_scene_context
from .prompt_compiler import compile_draft_prompt
from .prompt_profile_resolver import (
    LOCAL_OLLAMA_FAST_DRAFT,
    LOCAL_OLLAMA_STRUCTURED_EVAL,
    REMOTE_OPENAI_HEAVY_DRAFT,
    ProviderProfile,
    select_profile,
)


def _meta_summary_detected(text: str) -> bool:
    lowered = text.lower()
    markers = [
        "scene title:",
        "pov:",
        "goal:",
        "conflict:",
        "turn:",
        "emotion:",
        "beats:",
        "notes:",
        "summary:",
    ]
    if any(marker in lowered for marker in markers):
        return True
    list_lines = [line for line in text.splitlines() if line.strip().startswith(("-", "*"))]
    if list_lines and len(list_lines) >= max(2, len(text.splitlines()) // 2):
        return True
    return False


def _dialogue_presence(text: str) -> bool:
    return '"' in text


def _sensory_presence(text: str) -> bool:
    tokens = {token.strip(".,;:!?").lower() for token in text.split()}
    sensory = {
        "cold",
        "warm",
        "heat",
        "damp",
        "scent",
        "smell",
        "sour",
        "sweet",
        "bitter",
        "metal",
        "metallic",
        "echo",
        "glow",
        "shadow",
        "dark",
        "light",
        "whisper",
        "thud",
        "hiss",
    }
    return bool(tokens.intersection(sensory))


def evaluate_draft_quality(text: str | None) -> dict[str, Any]:
    if not isinstance(text, str):
        return {"usable": False, "reason": "not_text"}
    stripped = text.strip()
    if not stripped:
        return {"usable": False, "reason": "empty"}
    words = [token for token in stripped.split() if token]
    word_count = len(words)
    meta = _meta_summary_detected(stripped)
    dialogue = _dialogue_presence(stripped)
    sensory = _sensory_presence(stripped)
    prose_density = word_count / max(len(stripped.splitlines()), 1)
    usable = word_count >= 40 and not meta
    return {
        "usable": usable,
        "word_count": word_count,
        "prose_density": prose_density,
        "meta_summary": meta,
        "dialogue": dialogue,
        "sensory": sensory,
    }


def is_usable_draft(text: str | None) -> bool:
    if not isinstance(text, str):
        return False
    stripped = text.strip()
    if not stripped:
        return False
    words = [token for token in stripped.split() if token]
    if len(words) < 40:
        return False
    if _meta_summary_detected(stripped):
        return False
    return True


__all__ = [
    "SceneContext",
    "ProviderProfile",
    "LOCAL_OLLAMA_FAST_DRAFT",
    "LOCAL_OLLAMA_STRUCTURED_EVAL",
    "REMOTE_OPENAI_HEAVY_DRAFT",
    "select_profile",
    "assemble_scene_context",
    "compile_draft_prompt",
    "is_usable_draft",
    "evaluate_draft_quality",
]
