"""Deterministic decay helpers for Memory Lab artifacts."""

from __future__ import annotations

from dataclasses import replace
from hashlib import sha256

from .constants import MEMORY_DECAY_EVENT_SCHEMA_VERSION
from .lifecycle import derive_next_decay_status
from .schemas import DecayEvent, MemoryArtifact


def resolve_effective_last_touch_scene_order(
    artifact: MemoryArtifact,
    *,
    artifact_scene_order: int | None = None,
) -> int:
    if artifact.last_touch_scene_order is not None:
        return int(artifact.last_touch_scene_order)
    if int(artifact.recency_order) > 0:
        return int(artifact.recency_order)
    if artifact_scene_order is not None:
        return int(artifact_scene_order)
    return 0


def compute_inactivity_units(current_scene_order: int, last_touch_scene_order: int) -> int:
    return max(0, int(current_scene_order) - int(last_touch_scene_order))


def apply_decay_to_artifact(
    artifact: MemoryArtifact,
    *,
    current_scene_order: int,
    now_iso: str,
    artifact_scene_order: int | None,
    base_decay_rate: float,
    min_weight: float,
    fading_threshold: float,
    suppressed_threshold: float,
    archived_threshold: float,
    log_anchor_protection: bool = False,
) -> tuple[MemoryArtifact, list[DecayEvent]]:
    if artifact.last_decay_scene_order == current_scene_order:
        return artifact, []
    if artifact.status == "archived":
        return artifact, []

    if artifact.is_anchor:
        if not log_anchor_protection:
            return artifact, []
        protected = replace(
            artifact,
            last_decay_scene_order=current_scene_order,
            last_decay_at=now_iso,
        )
        event = _build_decay_event(
            artifact_id=artifact.artifact_id,
            event_type="anchor_protected",
            old_weight=artifact.weight,
            new_weight=artifact.weight,
            old_status=artifact.status,
            new_status=artifact.status,
            scene_order=current_scene_order,
            created_at=now_iso,
            notes="anchor protection applied",
        )
        return protected, [event]

    last_touch = resolve_effective_last_touch_scene_order(
        artifact,
        artifact_scene_order=artifact_scene_order,
    )
    inactivity_units = compute_inactivity_units(current_scene_order, last_touch)
    decay_delta = float(base_decay_rate) * inactivity_units
    decayed_weight = max(float(min_weight), float(artifact.weight) - decay_delta)

    next_status = derive_next_decay_status(
        artifact.status,
        weight=decayed_weight,
        fading_threshold=fading_threshold,
        suppressed_threshold=suppressed_threshold,
        archived_threshold=archived_threshold,
    )
    if (
        next_status == "suppressed"
        and artifact.revival_grace_until_scene_order is not None
        and current_scene_order <= int(artifact.revival_grace_until_scene_order)
    ):
        next_status = artifact.status

    updated = replace(
        artifact,
        weight=decayed_weight,
        status=next_status,
        last_decay_scene_order=current_scene_order,
        last_decay_at=now_iso,
        decay_count=artifact.decay_count + 1,
        suppressed_at=(
            now_iso
            if artifact.suppressed_at is None
            and artifact.status != "suppressed"
            and next_status == "suppressed"
            else artifact.suppressed_at
        ),
        archived_at=(
            now_iso
            if artifact.archived_at is None
            and artifact.status != "archived"
            and next_status == "archived"
            else artifact.archived_at
        ),
        revival_grace_until_scene_order=(
            artifact.revival_grace_until_scene_order
            if artifact.revival_grace_until_scene_order is None
            or current_scene_order <= int(artifact.revival_grace_until_scene_order)
            else None
        ),
    )

    events: list[DecayEvent] = []
    if decayed_weight != artifact.weight or next_status != artifact.status:
        events.append(
            _build_decay_event(
                artifact_id=artifact.artifact_id,
                event_type="decayed",
                old_weight=artifact.weight,
                new_weight=decayed_weight,
                old_status=artifact.status,
                new_status=next_status,
                scene_order=current_scene_order,
                created_at=now_iso,
                notes=f"unused for {inactivity_units} scene(s)",
            )
        )
    if artifact.status != "suppressed" and next_status == "suppressed":
        events.append(
            _build_decay_event(
                artifact_id=artifact.artifact_id,
                event_type="suppressed",
                old_weight=artifact.weight,
                new_weight=decayed_weight,
                old_status=artifact.status,
                new_status=next_status,
                scene_order=current_scene_order,
                created_at=now_iso,
                notes="crossed suppressed threshold",
            )
        )
    if artifact.status != "archived" and next_status == "archived":
        events.append(
            _build_decay_event(
                artifact_id=artifact.artifact_id,
                event_type="archived",
                old_weight=artifact.weight,
                new_weight=decayed_weight,
                old_status=artifact.status,
                new_status=next_status,
                scene_order=current_scene_order,
                created_at=now_iso,
                notes="crossed archived threshold",
            )
        )
    return updated, events


def _build_decay_event(
    *,
    artifact_id: str,
    event_type: str,
    old_weight: float,
    new_weight: float,
    old_status: str,
    new_status: str,
    scene_order: int,
    created_at: str,
    notes: str | None,
) -> DecayEvent:
    digest = sha256(
        f"{artifact_id}:{event_type}:{scene_order}:{created_at}:{old_status}:{new_status}".encode(
            "utf-8"
        )
    ).hexdigest()[:12]
    return DecayEvent(
        event_id=f"de_{digest}",
        schema_version=MEMORY_DECAY_EVENT_SCHEMA_VERSION,
        artifact_id=artifact_id,
        event_type=event_type,
        old_weight=float(old_weight),
        new_weight=float(new_weight),
        old_status=old_status,
        new_status=new_status,
        scene_order=int(scene_order),
        created_at=created_at,
        notes=notes,
    )
