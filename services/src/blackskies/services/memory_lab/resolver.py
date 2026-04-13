"""Resolver for selecting memory artifacts into a packet."""

from __future__ import annotations

from dataclasses import replace
from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path

from .reinforcement import reinforce_artifact, selection_delta
from .schemas import MemoryArtifact, MemoryLedgerEntry, MemorySelectionReason, ResolvedMemoryPacket
from .scoring import compute_total_score
from .storage import append_reinforcement_event, write_ledger_entry


def resolve_memory_packet(
    *,
    entries: list[MemoryLedgerEntry],
    current_scene_id: str,
    current_chapter_id: str | None,
    max_unresolved: int = 3,
    alternate_interpretation_threshold: float = 0.08,
    reinforcement_enabled: bool = False,
    project_root: Path | None = None,
    now_iso: str | None = None,
) -> tuple[ResolvedMemoryPacket, list[MemorySelectionReason]]:
    artifacts = [
        artifact
        for entry in entries
        for artifact in entry.artifacts
        if artifact.scene_id != current_scene_id
    ]
    if not artifacts:
        packet = ResolvedMemoryPacket(
            selected_summary=None,
            selected_unresolved_tensions=[],
            selected_emotional_carryover=None,
            selected_location_state=None,
            alternate_interpretation=None,
            selected_artifact_ids=[],
            resolver_notes=["No eligible prior artifacts after filtering current scene."],
        )
        return packet, []

    max_recency_order = max((artifact.recency_order for artifact in artifacts), default=0)
    scored = [_score_artifact(a, current_chapter_id=current_chapter_id, max_recency_order=max_recency_order) for a in artifacts]

    selected: dict[str, MemoryArtifact] = {}
    selected_ids: list[str] = []
    selected_interpretations: list[str] = []
    anchor_artifact_ids: list[str] = []
    suppressed_artifact_ids: list[str] = []
    reasons: list[MemorySelectionReason] = []
    notes: list[str] = []
    chosen_group_ids: set[str] = set()
    alternate_interpretation: str | None = None

    def select_one(candidate: tuple[MemoryArtifact, MemorySelectionReason], *, slot: str) -> None:
        nonlocal alternate_interpretation

        artifact, reason = candidate
        selected[slot] = artifact
        selected_ids.append(artifact.artifact_id)
        reasons.append(reason)
        if artifact.interpretation_label is not None:
            selected_interpretations.append(artifact.interpretation_label)
        if artifact.is_anchor:
            anchor_artifact_ids.append(artifact.artifact_id)

        group_id = artifact.interpretation_group_id
        if group_id is None:
            return
        chosen_group_ids.add(group_id)

        same_group = [item for item in _ranked_scored(scored) if item[0].interpretation_group_id == group_id]
        for group_artifact, _group_reason in same_group:
            if group_artifact.artifact_id == artifact.artifact_id:
                continue
            if group_artifact.artifact_id not in suppressed_artifact_ids:
                suppressed_artifact_ids.append(group_artifact.artifact_id)
        if alternate_interpretation is not None:
            return
        if len(same_group) < 2:
            return
        second_artifact, second_reason = same_group[1]
        delta = reason.total_score - second_reason.total_score
        if delta <= float(alternate_interpretation_threshold):
            alternate_interpretation = second_artifact.interpretation_label or second_artifact.content

    def select_best_for_type(artifact_type: str, *, slot: str) -> None:
        ranked = _ranked_by_type(scored, artifact_type)
        for candidate in ranked:
            group_id = candidate[0].interpretation_group_id
            if group_id is not None and group_id in chosen_group_ids:
                if candidate[0].artifact_id not in suppressed_artifact_ids:
                    suppressed_artifact_ids.append(candidate[0].artifact_id)
                continue
            select_one(candidate, slot=slot)
            return

    select_best_for_type("summary", slot="summary")
    if "summary" in selected:
        notes.append(f"Selected summary from {selected['summary'].scene_id}.")

    unresolved_ranked = _ranked_by_type(scored, "unresolved_tension")
    unresolved_selected: list[tuple[MemoryArtifact, MemorySelectionReason]] = []
    for artifact, reason in unresolved_ranked:
        if len(unresolved_selected) >= max(0, max_unresolved):
            break
        group_id = artifact.interpretation_group_id
        if group_id is not None and group_id in chosen_group_ids:
            if artifact.artifact_id not in suppressed_artifact_ids:
                suppressed_artifact_ids.append(artifact.artifact_id)
            continue
        unresolved_selected.append((artifact, reason))
        selected_ids.append(artifact.artifact_id)
        reasons.append(reason)
        if artifact.interpretation_label is not None:
            selected_interpretations.append(artifact.interpretation_label)
        if artifact.is_anchor:
            anchor_artifact_ids.append(artifact.artifact_id)
        if group_id is not None:
            chosen_group_ids.add(group_id)
    if unresolved_selected:
        notes.append(f"Selected {len(unresolved_selected)} unresolved tension artifacts.")

    select_best_for_type("emotional_state", slot="emotional_state")
    if "emotional_state" in selected:
        notes.append(f"Selected emotional state from {selected['emotional_state'].scene_id}.")

    select_best_for_type("location_state", slot="location_state")
    if "location_state" in selected:
        notes.append(f"Selected location state from {selected['location_state'].scene_id}.")

    if reinforcement_enabled and project_root is not None and selected_ids:
        _reinforce_selected_artifacts(
            project_root=project_root,
            entries=entries,
            selected_artifact_ids=selected_ids,
            now_iso=now_iso or datetime.now(UTC).isoformat(),
        )

    packet = ResolvedMemoryPacket(
        selected_summary=selected["summary"].content if "summary" in selected else None,
        selected_unresolved_tensions=[artifact.content for artifact, _ in unresolved_selected],
        selected_emotional_carryover=selected["emotional_state"].content if "emotional_state" in selected else None,
        selected_location_state=selected["location_state"].content if "location_state" in selected else None,
        alternate_interpretation=alternate_interpretation,
        selected_artifact_ids=selected_ids,
        resolver_notes=notes,
        selected_interpretations=selected_interpretations,
        anchor_artifact_ids=anchor_artifact_ids,
        suppressed_artifact_ids=suppressed_artifact_ids,
    )
    return packet, reasons


def _score_artifact(
    artifact: MemoryArtifact,
    *,
    current_chapter_id: str | None,
    max_recency_order: int,
) -> tuple[MemoryArtifact, MemorySelectionReason]:
    total, relevance, recency, weight, confidence, anchor, reinforcement = compute_total_score(
        artifact,
        current_chapter_id=current_chapter_id,
        max_recency_order=max_recency_order,
    )
    reason_text = (
        f"selected using weighted score; chapter relevance={relevance:.2f}, "
        f"recency={recency:.2f}, weight={weight:.2f}, confidence={confidence:.2f}, "
        f"anchor={anchor:.2f}, reinforcement={reinforcement:.2f}"
    )
    return artifact, MemorySelectionReason(
        artifact_id=artifact.artifact_id,
        artifact_type=artifact.artifact_type,
        total_score=total,
        relevance_score=relevance,
        recency_score=recency,
        weight_score=weight,
        confidence_score=confidence,
        reason=reason_text,
    )


def _best_by_type(
    scored: list[tuple[MemoryArtifact, MemorySelectionReason]],
    artifact_type: str,
) -> tuple[MemoryArtifact, MemorySelectionReason] | None:
    ranked = _ranked_by_type(scored, artifact_type)
    if not ranked:
        return None
    return ranked[0]


def _ranked_by_type(
    scored: list[tuple[MemoryArtifact, MemorySelectionReason]],
    artifact_type: str,
) -> list[tuple[MemoryArtifact, MemorySelectionReason]]:
    filtered = [item for item in scored if item[0].artifact_type == artifact_type]
    return _ranked_scored(filtered)


def _ranked_scored(
    scored: list[tuple[MemoryArtifact, MemorySelectionReason]],
) -> list[tuple[MemoryArtifact, MemorySelectionReason]]:
    return sorted(
        scored,
        key=lambda item: (
            -item[1].total_score,
            -item[1].relevance_score,
            -item[1].recency_score,
            item[0].artifact_id,
        ),
    )


def _reinforce_selected_artifacts(
    *,
    project_root: Path,
    entries: list[MemoryLedgerEntry],
    selected_artifact_ids: list[str],
    now_iso: str,
) -> None:
    artifact_locations: dict[str, tuple[int, int]] = {}
    for entry_index, entry in enumerate(entries):
        for artifact_index, artifact in enumerate(entry.artifacts):
            artifact_locations[artifact.artifact_id] = (entry_index, artifact_index)

    updated_artifacts_by_entry: dict[int, list[MemoryArtifact]] = {}
    touched_entries: set[int] = set()
    for artifact_id in selected_artifact_ids:
        location = artifact_locations.get(artifact_id)
        if location is None:
            continue
        entry_index, artifact_index = location
        artifacts_list = updated_artifacts_by_entry.setdefault(
            entry_index,
            list(entries[entry_index].artifacts),
        )
        selected_updated = replace(
            artifacts_list[artifact_index],
            selection_count=artifacts_list[artifact_index].selection_count + 1,
            last_selected_at=now_iso,
        )
        reinforced_artifact, event = reinforce_artifact(
            selected_updated,
            delta=selection_delta(),
            event_type="selection",
            now_iso=now_iso,
        )
        artifacts_list[artifact_index] = reinforced_artifact
        touched_entries.add(entry_index)

        deterministic_event_id = _build_deterministic_event_id(
            artifact_id=artifact_id,
            created_at=now_iso,
            event_type="selection",
        )
        append_reinforcement_event(
            project_root,
            replace(event, event_id=deterministic_event_id),
        )

    for entry_index in sorted(touched_entries):
        write_ledger_entry(
            project_root,
            replace(entries[entry_index], artifacts=updated_artifacts_by_entry[entry_index]),
        )


def _build_deterministic_event_id(*, artifact_id: str, created_at: str, event_type: str) -> str:
    digest = sha256(f"{artifact_id}:{event_type}:{created_at}".encode("utf-8")).hexdigest()[:12]
    return f"re_{digest}"
