"""Prompt profile selection for provider-backed generation."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ProviderProfile:
    name: str
    draft_style: list[str]


LOCAL_OLLAMA_FAST_DRAFT = ProviderProfile(
    name="local_ollama_fast_draft",
    draft_style=[
        "Write immersive scene prose, not a summary or outline.",
        "Anchor every paragraph in concrete sensory detail and physical action.",
        "Stay inside the POV character's immediate perceptions and inner reactions.",
        "Let dialogue appear naturally when characters are present.",
        "Avoid headings, bullet points, or meta commentary.",
        "Write in continuous paragraphs with natural scene flow.",
    ],
)

LOCAL_OLLAMA_STRUCTURED_EVAL = ProviderProfile(
    name="local_ollama_structured_eval",
    draft_style=[
        "Write a clean scene draft with clear beats and readable pacing.",
        "Keep prose grounded in action and sensory detail, avoid summarizing.",
        "Use short dialogue exchanges sparingly to break up narration.",
        "Avoid headings, bullet points, or meta commentary.",
        "Write in continuous paragraphs with natural scene flow.",
    ],
)

REMOTE_OPENAI_HEAVY_DRAFT = ProviderProfile(
    name="remote_openai_heavy_draft",
    draft_style=[
        "Write immersive, high-fidelity scene prose (not a summary).",
        "Emphasize vivid sensory grounding, subtext, and internal POV.",
        "Balance action beats with reflective interiority and dialogue.",
        "Avoid headings, bullet points, or meta commentary.",
        "Write in continuous paragraphs with natural scene flow.",
    ],
)

DEFAULT_PROFILE = LOCAL_OLLAMA_FAST_DRAFT

_PROFILE_REGISTRY: dict[str, ProviderProfile] = {
    LOCAL_OLLAMA_FAST_DRAFT.name: LOCAL_OLLAMA_FAST_DRAFT,
    LOCAL_OLLAMA_STRUCTURED_EVAL.name: LOCAL_OLLAMA_STRUCTURED_EVAL,
    REMOTE_OPENAI_HEAVY_DRAFT.name: REMOTE_OPENAI_HEAVY_DRAFT,
    # Backward-compatible provider aliases. Callers should prefer routed
    # prompt-profile keys where available.
    "ollama": LOCAL_OLLAMA_FAST_DRAFT,
    "openai": REMOTE_OPENAI_HEAVY_DRAFT,
}


def select_profile(profile_key: str | None) -> ProviderProfile:
    if profile_key is None:
        return DEFAULT_PROFILE
    return _PROFILE_REGISTRY.get(profile_key, DEFAULT_PROFILE)


__all__ = [
    "ProviderProfile",
    "LOCAL_OLLAMA_FAST_DRAFT",
    "LOCAL_OLLAMA_STRUCTURED_EVAL",
    "REMOTE_OPENAI_HEAVY_DRAFT",
    "DEFAULT_PROFILE",
    "select_profile",
]
