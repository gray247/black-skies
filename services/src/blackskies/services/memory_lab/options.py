"""Runtime options for Memory Lab orchestration and resolver behavior."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class MemoryLabRuntimeOptions:
    enabled: bool
    max_candidates: int
    max_unresolved: int
    alternate_interpretation_threshold: float
    weight_max: float
    reinforcement_enabled: bool
    anchor_enabled: bool
    anchor_auto_threshold: int
    decay_enabled: bool
    decay_base_rate: float
    decay_min_weight: float
    decay_fading_threshold: float
    decay_suppressed_threshold: float
    decay_archived_threshold: float
    decay_log_anchor_protection: bool
    decay_allow_revival: bool
    decay_suppressed_fallback_enabled: bool
    decay_low_confidence_fallback_threshold: float
    reinforcement_event_retention_limit: int
    decay_event_retention_limit: int
    debug_logging: bool
    contested_event_retention_limit: int = 200
    diagnostics_level: str = "standard"
    profile_name: str = "stable_default"
    profile_version: str = "1.0.0"
    experimental_enabled: bool = False
    experimental_active_experiments: tuple[str, ...] = ()
    experimental_fail_closed: bool = True
    experimental_log_events: bool = True
