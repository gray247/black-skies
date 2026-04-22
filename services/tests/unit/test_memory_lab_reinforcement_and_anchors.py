from __future__ import annotations

from blackskies.services.memory_lab.anchors import is_anchor_candidate, promote_anchor_candidate
from blackskies.services.memory_lab.reinforcement import (
    author_confirm_delta,
    reinforce_artifact,
    selection_delta,
    survival_delta,
)
from blackskies.services.memory_lab.schemas import MemoryArtifact


def _artifact(
    *,
    artifact_type: str = "summary",
    weight: float = 1.0,
    reinforcement_count: int = 0,
    selection_count: int = 0,
) -> MemoryArtifact:
    return MemoryArtifact(
        artifact_id="art_001",
        schema_version="memory_artifact_v1",
        artifact_type=artifact_type,
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt="Excerpt",
        content="Content",
        weight=weight,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
        reinforcement_count=reinforcement_count,
        selection_count=selection_count,
    )


def test_reinforcement_increases_weight() -> None:
    original = _artifact(weight=0.50)
    updated, event = reinforce_artifact(
        original,
        delta=selection_delta(),
        event_type="selection",
        now_iso="2026-04-12T00:01:00Z",
    )

    assert updated.weight > original.weight
    assert updated.reinforcement_count == original.reinforcement_count + 1
    assert event.artifact_id == original.artifact_id


def test_weight_clamps_at_max() -> None:
    original = _artifact(weight=1.99)
    updated, _event = reinforce_artifact(
        original,
        delta=author_confirm_delta(),
        event_type="author_confirm",
        now_iso="2026-04-12T00:01:00Z",
    )

    assert updated.weight == 2.00


def test_anchor_promotion_works() -> None:
    candidate = _artifact(artifact_type="summary", reinforcement_count=3)
    assert is_anchor_candidate(candidate) is True

    promoted = promote_anchor_candidate(candidate, "stable reinforced carryover")
    assert promoted.is_anchor is True
    assert promoted.anchor_reason == "stable reinforced carryover"


def test_unsupported_artifact_types_do_not_become_anchors() -> None:
    unsupported = _artifact(
        artifact_type="reveal",
        reinforcement_count=10,
        selection_count=10,
    )
    assert is_anchor_candidate(unsupported) is False

    # sanity: supported type with threshold hit is candidate
    supported = _artifact(artifact_type="location_state", selection_count=3)
    assert is_anchor_candidate(supported) is True


def test_anchor_candidate_respects_custom_threshold() -> None:
    candidate = _artifact(artifact_type="summary", reinforcement_count=2, selection_count=1)
    assert is_anchor_candidate(candidate, min_threshold=3) is False
    assert is_anchor_candidate(candidate, min_threshold=2) is True


def test_delta_helpers_values() -> None:
    assert selection_delta() == 0.03
    assert survival_delta() == 0.05
    assert author_confirm_delta() == 0.10
