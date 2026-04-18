"""Operational runtime profile definitions for Memory Lab (Phase 6B)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class MemoryLabRuntimeProfile:
    profile_name: str
    version: str
    alternate_threshold: float
    max_candidates: int
    max_unresolved: int
    decay_enabled: bool
    reinforcement_enabled: bool
    suppressed_fallback_enabled: bool
    low_confidence_fallback_threshold: float
    diagnostics_level: str
    retention_limits_by_event_type: dict[str, int]


STABLE_DEFAULT_PROFILE = MemoryLabRuntimeProfile(
    profile_name="stable_default",
    version="1.0.0",
    alternate_threshold=0.08,
    max_candidates=8,
    max_unresolved=5,
    decay_enabled=True,
    reinforcement_enabled=True,
    suppressed_fallback_enabled=True,
    low_confidence_fallback_threshold=0.35,
    diagnostics_level="standard",
    retention_limits_by_event_type={
        "reinforcement": 200,
        "decay": 200,
        "contested": 200,
    },
)


STABLE_CONSERVATIVE_FALLBACK_PROFILE = MemoryLabRuntimeProfile(
    profile_name="stable_conservative_fallback",
    version="1.0.0",
    alternate_threshold=0.05,
    max_candidates=8,
    max_unresolved=5,
    decay_enabled=True,
    reinforcement_enabled=True,
    suppressed_fallback_enabled=False,
    low_confidence_fallback_threshold=0.35,
    diagnostics_level="minimal",
    retention_limits_by_event_type={
        "reinforcement": 200,
        "decay": 200,
        "contested": 200,
    },
)


_RUNTIME_PROFILES: dict[str, MemoryLabRuntimeProfile] = {
    STABLE_DEFAULT_PROFILE.profile_name: STABLE_DEFAULT_PROFILE,
    STABLE_CONSERVATIVE_FALLBACK_PROFILE.profile_name: STABLE_CONSERVATIVE_FALLBACK_PROFILE,
}


def list_runtime_profile_names() -> tuple[str, ...]:
    return tuple(sorted(_RUNTIME_PROFILES.keys()))


def load_runtime_profile(profile_name: str) -> MemoryLabRuntimeProfile:
    try:
        return _RUNTIME_PROFILES[profile_name]
    except KeyError as exc:
        names = ", ".join(list_runtime_profile_names())
        raise ValueError(f"Unknown Memory Lab runtime profile '{profile_name}'. Expected one of: {names}") from exc
