from __future__ import annotations

from blackskies.services.memory_lab.decay import (
    apply_decay_to_artifact,
    compute_inactivity_units,
    resolve_effective_last_touch_scene_order,
)
from blackskies.services.memory_lab.schemas import MemoryArtifact


def _artifact(
    *,
    artifact_id: str = "art_001",
    weight: float = 1.0,
    status: str = "active",
    is_anchor: bool = False,
    recency_order: int = 3,
    last_touch_scene_order: int | None = None,
    last_decay_scene_order: int | None = None,
    suppressed_at: str | None = None,
    archived_at: str | None = None,
    revival_grace_until_scene_order: int | None = None,
) -> MemoryArtifact:
    return MemoryArtifact(
        artifact_id=artifact_id,
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt="Excerpt",
        content="Content",
        weight=weight,
        confidence=1.0,
        recency_order=recency_order,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
        is_anchor=is_anchor,
        status=status,
        last_touch_scene_order=last_touch_scene_order,
        last_decay_scene_order=last_decay_scene_order,
        suppressed_at=suppressed_at,
        archived_at=archived_at,
        revival_grace_until_scene_order=revival_grace_until_scene_order,
    )


def test_compute_inactivity_units_is_deterministic() -> None:
    assert compute_inactivity_units(10, 7) == 3
    assert compute_inactivity_units(7, 7) == 0
    assert compute_inactivity_units(5, 7) == 0


def test_legacy_fallback_order_for_last_touch_scene_order() -> None:
    assert (
        resolve_effective_last_touch_scene_order(
            _artifact(last_touch_scene_order=11, recency_order=3),
            artifact_scene_order=9,
        )
        == 11
    )
    assert (
        resolve_effective_last_touch_scene_order(
            _artifact(last_touch_scene_order=None, recency_order=4),
            artifact_scene_order=9,
        )
        == 4
    )
    assert (
        resolve_effective_last_touch_scene_order(
            _artifact(last_touch_scene_order=None, recency_order=0),
            artifact_scene_order=9,
        )
        == 9
    )
    assert (
        resolve_effective_last_touch_scene_order(
            _artifact(last_touch_scene_order=None, recency_order=0),
            artifact_scene_order=None,
        )
        == 0
    )


def test_idempotent_same_scene_decay_noops_on_second_pass() -> None:
    artifact = _artifact(weight=1.0, last_touch_scene_order=5)
    decayed_once, events_once = apply_decay_to_artifact(
        artifact,
        current_scene_order=10,
        now_iso="2026-04-13T10:00:00Z",
        artifact_scene_order=None,
        base_decay_rate=0.03,
        min_weight=0.05,
        fading_threshold=0.40,
        suppressed_threshold=0.20,
        archived_threshold=0.10,
    )
    decayed_twice, events_twice = apply_decay_to_artifact(
        decayed_once,
        current_scene_order=10,
        now_iso="2026-04-13T10:00:01Z",
        artifact_scene_order=None,
        base_decay_rate=0.03,
        min_weight=0.05,
        fading_threshold=0.40,
        suppressed_threshold=0.20,
        archived_threshold=0.10,
    )

    assert events_once
    assert decayed_twice == decayed_once
    assert events_twice == []


def test_zero_inactivity_produces_zero_weight_decay() -> None:
    artifact = _artifact(weight=0.77, last_touch_scene_order=10)
    updated, _events = apply_decay_to_artifact(
        artifact,
        current_scene_order=10,
        now_iso="2026-04-13T10:00:00Z",
        artifact_scene_order=None,
        base_decay_rate=0.03,
        min_weight=0.05,
        fading_threshold=0.40,
        suppressed_threshold=0.20,
        archived_threshold=0.10,
    )

    assert updated.weight == artifact.weight


def test_one_step_status_transitions_are_enforced_in_decay() -> None:
    now = "2026-04-13T10:00:00Z"
    active = _artifact(weight=0.11, status="active", last_touch_scene_order=1)
    active_next, _ = apply_decay_to_artifact(
        active,
        current_scene_order=20,
        now_iso=now,
        artifact_scene_order=None,
        base_decay_rate=0.03,
        min_weight=0.05,
        fading_threshold=0.40,
        suppressed_threshold=0.20,
        archived_threshold=0.10,
    )
    assert active_next.status == "fading"

    fading = _artifact(weight=0.11, status="fading", last_touch_scene_order=1)
    fading_next, _ = apply_decay_to_artifact(
        fading,
        current_scene_order=20,
        now_iso=now,
        artifact_scene_order=None,
        base_decay_rate=0.03,
        min_weight=0.05,
        fading_threshold=0.40,
        suppressed_threshold=0.20,
        archived_threshold=0.10,
    )
    assert fading_next.status == "suppressed"
    assert fading_next.suppressed_at == now

    suppressed = _artifact(weight=0.11, status="suppressed", last_touch_scene_order=1)
    suppressed_next, _ = apply_decay_to_artifact(
        suppressed,
        current_scene_order=20,
        now_iso=now,
        artifact_scene_order=None,
        base_decay_rate=0.03,
        min_weight=0.05,
        fading_threshold=0.40,
        suppressed_threshold=0.20,
        archived_threshold=0.10,
    )
    assert suppressed_next.status == "archived"
    assert suppressed_next.archived_at == now


def test_anchor_protection_event_is_optional_and_once_per_scene() -> None:
    anchor = _artifact(is_anchor=True, last_touch_scene_order=5)
    unchanged, no_events = apply_decay_to_artifact(
        anchor,
        current_scene_order=11,
        now_iso="2026-04-13T10:00:00Z",
        artifact_scene_order=None,
        base_decay_rate=0.03,
        min_weight=0.05,
        fading_threshold=0.40,
        suppressed_threshold=0.20,
        archived_threshold=0.10,
        log_anchor_protection=False,
    )
    assert unchanged == anchor
    assert no_events == []

    protected, events = apply_decay_to_artifact(
        anchor,
        current_scene_order=11,
        now_iso="2026-04-13T10:00:00Z",
        artifact_scene_order=None,
        base_decay_rate=0.03,
        min_weight=0.05,
        fading_threshold=0.40,
        suppressed_threshold=0.20,
        archived_threshold=0.10,
        log_anchor_protection=True,
    )
    assert len(events) == 1
    assert events[0].event_type == "anchor_protected"
    assert protected.last_decay_scene_order == 11

    protected_again, events_again = apply_decay_to_artifact(
        protected,
        current_scene_order=11,
        now_iso="2026-04-13T10:00:01Z",
        artifact_scene_order=None,
        base_decay_rate=0.03,
        min_weight=0.05,
        fading_threshold=0.40,
        suppressed_threshold=0.20,
        archived_threshold=0.10,
        log_anchor_protection=True,
    )
    assert protected_again == protected
    assert events_again == []


def test_one_scene_revival_grace_prevents_immediate_resuppress() -> None:
    artifact = _artifact(
        weight=0.18,
        status="fading",
        last_touch_scene_order=1,
        revival_grace_until_scene_order=5,
    )
    updated, _events = apply_decay_to_artifact(
        artifact,
        current_scene_order=5,
        now_iso="2026-04-13T10:00:00Z",
        artifact_scene_order=None,
        base_decay_rate=0.03,
        min_weight=0.05,
        fading_threshold=0.40,
        suppressed_threshold=0.20,
        archived_threshold=0.10,
    )
    assert updated.status == "fading"
