"""Schemas for Memory Lab artifacts and resolved packets."""

from __future__ import annotations

from dataclasses import dataclass, field

from .types import ArtifactType


@dataclass(frozen=True)
class MemoryArtifact:
    artifact_id: str
    schema_version: str
    artifact_type: ArtifactType
    scene_id: str
    chapter_id: str | None
    source_excerpt: str | None
    content: str
    weight: float
    confidence: float
    recency_order: int
    tags: list[str]
    derived_from: str
    created_at: str
    is_anchor: bool = False
    anchor_reason: str | None = None
    reinforcement_count: int = 0
    selection_count: int = 0
    last_selected_at: str | None = None
    interpretation_group_id: str | None = None
    interpretation_label: str | None = None
    parent_artifact_id: str | None = None
    status: str = "active"


@dataclass(frozen=True)
class MemoryLedgerEntry:
    scene_id: str
    chapter_id: str | None
    schema_version: str
    artifacts: list[MemoryArtifact]
    source_summary: str | None
    source_unresolved: list[str]
    source_emotional_carryover: str | None
    source_location_state: str | None


@dataclass(frozen=True)
class ResolvedMemoryPacket:
    selected_summary: str | None
    selected_unresolved_tensions: list[str]
    selected_emotional_carryover: str | None
    selected_location_state: str | None
    alternate_interpretation: str | None
    selected_artifact_ids: list[str]
    resolver_notes: list[str]
    selected_interpretations: list[str] = field(default_factory=list)
    anchor_artifact_ids: list[str] = field(default_factory=list)
    suppressed_artifact_ids: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class MemorySelectionReason:
    artifact_id: str
    artifact_type: str
    total_score: float
    relevance_score: float
    recency_score: float
    weight_score: float
    confidence_score: float
    reason: str


@dataclass(frozen=True)
class InterpretationGroup:
    group_id: str
    scene_id: str
    chapter_id: str | None
    entity_ref: str | None
    event_ref: str | None
    schema_version: str
    artifact_ids: list[str]
    created_at: str


@dataclass(frozen=True)
class ReinforcementEvent:
    event_id: str
    artifact_id: str
    event_type: str
    delta_weight: float
    created_at: str
    notes: str | None = None
