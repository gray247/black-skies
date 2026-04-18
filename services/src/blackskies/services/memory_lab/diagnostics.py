"""Typed diagnostics models for Memory Lab runtime behavior."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class ResolverDecisionDiagnostic:
    artifact_id: str
    selected: bool
    status_multiplier_used: float
    suppressed_fallback_used: bool
    tie_break_tuple: tuple[float, float, float, float, str]
    tie_break_rationale: str


@dataclass(frozen=True)
class DecayDiagnostic:
    artifact_id: str
    decay_skipped: bool
    decay_skip_reason: str | None
    old_status: str
    new_status: str
    old_weight: float
    new_weight: float


@dataclass(frozen=True)
class AnchorPromotionDiagnostic:
    artifact_id: str
    threshold_used: int
    selection_count: int
    reinforcement_count: int
    reason: str


@dataclass(frozen=True)
class MemoryLabRuntimeDiagnostics:
    memory_lab_enabled: bool
    used_legacy_continuity_only: bool
    current_scene_order: int
    lock_acquired: bool
    decay_events_written: int
    reinforcement_events_written: int
    revival_events_written: int
    anchor_promotions: int
    environment_tier: str = "best_effort"
    advisory_available: bool = False
    advisory_unavailable_reason_code: str | None = None
    experimental_framework_enabled: bool = False
    experimental_ran: bool = False
    experimental_blocked_experiments: list[str] = field(default_factory=list)
    experimental_outcomes: list[dict[str, str]] = field(default_factory=list)
    experimental_metrics: dict[str, object] = field(default_factory=dict)
    experimental_guardrail_passed: bool | None = None
    experimental_guardrail_violations: list[str] = field(default_factory=list)
    resolver_decisions: list[ResolverDecisionDiagnostic] = field(default_factory=list)
    slot_selection_diagnostics: list[dict[str, object]] = field(default_factory=list)
    decay_diagnostics: list[DecayDiagnostic] = field(default_factory=list)
    anchor_promotion_diagnostics: list[AnchorPromotionDiagnostic] = field(default_factory=list)
    failure_entries: list[str] = field(default_factory=list)
    corruption_entries: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
