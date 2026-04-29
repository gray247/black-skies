"""Pure resolver for selecting memory artifacts into a packet."""

from __future__ import annotations

import re

from .schemas import MemoryArtifact, MemoryLedgerEntry, MemorySelectionReason, ResolvedMemoryPacket
from .scoring import compute_total_score


def resolve_memory_packet(
    *,
    entries: list[MemoryLedgerEntry],
    current_scene_id: str,
    current_chapter_id: str | None,
    current_scene_order: int | None = None,  # kept for compatibility with existing call-sites
    max_candidates: int = 8,
    max_unresolved: int = 3,
    alternate_interpretation_threshold: float = 0.08,
    reinforcement_enabled: bool = False,  # kept for compatibility
    decay_enabled: bool = False,  # kept for compatibility
    decay_base_rate: float = 0.03,  # kept for compatibility
    decay_min_weight: float = 0.05,  # kept for compatibility
    decay_fading_threshold: float = 0.40,  # kept for compatibility
    decay_suppressed_threshold: float = 0.20,  # kept for compatibility
    decay_archived_threshold: float = 0.10,  # kept for compatibility
    decay_log_anchor_protection: bool = False,  # kept for compatibility
    decay_allow_revival: bool = True,  # kept for compatibility
    suppressed_fallback_enabled: bool = True,
    low_confidence_fallback_threshold: float = 0.35,
    project_root=None,  # kept for compatibility
    now_iso: str | None = None,  # kept for compatibility
) -> tuple[ResolvedMemoryPacket, list[MemorySelectionReason]]:
    _ = (
        current_scene_order,
        reinforcement_enabled,
        decay_enabled,
        decay_base_rate,
        decay_min_weight,
        decay_fading_threshold,
        decay_suppressed_threshold,
        decay_archived_threshold,
        decay_log_anchor_protection,
        decay_allow_revival,
        project_root,
        now_iso,
    )
    artifacts = [
        artifact
        for entry in entries
        for artifact in entry.artifacts
        if artifact.scene_id != current_scene_id
        if artifact.status != "archived"
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
    scored = [
        _score_artifact(
            a, current_chapter_id=current_chapter_id, max_recency_order=max_recency_order
        )
        for a in artifacts
    ]
    if max_candidates > 0:
        scored = _ranked_scored(scored)[: max(1, int(max_candidates))]
    if not scored:
        packet = ResolvedMemoryPacket(
            selected_summary=None,
            selected_unresolved_tensions=[],
            selected_emotional_carryover=None,
            selected_location_state=None,
            alternate_interpretation=None,
            selected_artifact_ids=[],
            resolver_notes=["No eligible candidates after applying candidate limit."],
        )
        return packet, []

    selected: dict[str, MemoryArtifact] = {}
    selected_ids: list[str] = []
    selected_interpretations: list[str] = []
    alternate_interpretations_by_slot: dict[str, str] = {}
    anchor_artifact_ids: list[str] = []
    suppressed_artifact_ids: list[str] = []
    reasons: list[MemorySelectionReason] = []
    notes: list[str] = []
    slot_diagnostics: list[dict[str, object]] = []
    chosen_group_ids: set[str] = set()
    alternate_interpretation: str | None = None
    invalid_group_artifacts: set[str] = set()

    for artifact, _reason in scored:
        if (
            artifact.interpretation_group_id
            and _build_contested_key(artifact, current_chapter_id=current_chapter_id) is None
        ):
            if artifact.artifact_id not in invalid_group_artifacts:
                invalid_group_artifacts.add(artifact.artifact_id)
                notes.append(f"invalid_contested_group_metadata artifact_id={artifact.artifact_id}")

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

        contested_key = _build_contested_key(
            artifact,
            current_chapter_id=current_chapter_id,
        )
        if (
            artifact.interpretation_group_id
            and contested_key is None
            and artifact.artifact_id not in invalid_group_artifacts
        ):
            invalid_group_artifacts.add(artifact.artifact_id)
            notes.append(f"invalid_contested_group_metadata artifact_id={artifact.artifact_id}")
        if contested_key is None:
            return
        chosen_group_ids.add(contested_key)

        same_group = [
            item
            for item in _ranked_scored(scored)
            if _build_contested_key(item[0], current_chapter_id=current_chapter_id) == contested_key
        ]
        for group_artifact, _group_reason in same_group:
            if group_artifact.artifact_id == artifact.artifact_id:
                continue
            if group_artifact.artifact_id not in suppressed_artifact_ids:
                suppressed_artifact_ids.append(group_artifact.artifact_id)
        if len(same_group) < 2:
            return
        second_artifact, second_reason = same_group[1]
        delta = reason.total_score - second_reason.total_score
        if delta <= float(alternate_interpretation_threshold):
            alternate_label = second_artifact.interpretation_label or second_artifact.content
            alternate_interpretations_by_slot[slot] = alternate_label
            if slot == "summary" and alternate_interpretation is None:
                alternate_interpretation = alternate_label

    def select_best_for_type(artifact_type: str, *, slot: str) -> None:
        normal_ranked = _ranked_by_type(scored, artifact_type, statuses={"active", "fading"})
        suppressed_ranked = _ranked_by_type(scored, artifact_type, statuses={"suppressed"})
        candidate_pool = list(normal_ranked)
        fallback_lane_open = False
        if suppressed_fallback_enabled and suppressed_ranked:
            top_normal = normal_ranked[0] if normal_ranked else None
            if top_normal is None or top_normal[1].total_score < float(
                low_confidence_fallback_threshold
            ):
                candidate_pool.append(suppressed_ranked[0])
                fallback_lane_open = True

        ranked_pool = _ranked_scored(candidate_pool)
        for candidate in ranked_pool:
            contested_key = _build_contested_key(
                candidate[0],
                current_chapter_id=current_chapter_id,
            )
            if (
                candidate[0].interpretation_group_id
                and contested_key is None
                and candidate[0].artifact_id not in invalid_group_artifacts
            ):
                invalid_group_artifacts.add(candidate[0].artifact_id)
                notes.append(
                    f"invalid_contested_group_metadata artifact_id={candidate[0].artifact_id}"
                )
            if contested_key is not None and contested_key in chosen_group_ids:
                if candidate[0].artifact_id not in suppressed_artifact_ids:
                    suppressed_artifact_ids.append(candidate[0].artifact_id)
                continue
            select_one(candidate, slot=slot)
            winner_artifact, winner_reason = candidate
            top_loser = next(
                (
                    item
                    for item in ranked_pool
                    if item[0].artifact_id != winner_artifact.artifact_id
                ),
                None,
            )
            slot_diagnostics.append(
                {
                    "slot": slot,
                    "winner": winner_artifact.artifact_id,
                    "top_loser": top_loser[0].artifact_id if top_loser else None,
                    "score_delta": (
                        float(winner_reason.total_score - top_loser[1].total_score)
                        if top_loser
                        else None
                    ),
                    "used_fallback": bool(
                        fallback_lane_open and winner_artifact.status == "suppressed"
                    ),
                    "tie_break_tuple": _ranking_tuple(candidate),
                    "tie_break_rationale": _tie_break_rationale(candidate, top_loser),
                }
            )
            return
        if ranked_pool:
            slot_diagnostics.append(
                {
                    "slot": slot,
                    "winner": None,
                    "top_loser": ranked_pool[0][0].artifact_id,
                    "score_delta": None,
                    "used_fallback": bool(fallback_lane_open),
                    "tie_break_tuple": None,
                    "tie_break_rationale": "no winner selected",
                }
            )

    select_best_for_type("summary", slot="summary")
    if "summary" in selected:
        notes.append(f"Selected summary from {selected['summary'].scene_id}.")

    unresolved_normal_ranked = _ranked_by_type(
        scored, "unresolved_tension", statuses={"active", "fading"}
    )
    unresolved_suppressed_ranked = _ranked_by_type(
        scored, "unresolved_tension", statuses={"suppressed"}
    )
    unresolved_selected: list[tuple[MemoryArtifact, MemorySelectionReason]] = []
    unresolved_pool = list(unresolved_normal_ranked)
    if suppressed_fallback_enabled and unresolved_suppressed_ranked:
        top_normal = unresolved_normal_ranked[0] if unresolved_normal_ranked else None
        if top_normal is None or top_normal[1].total_score < float(
            low_confidence_fallback_threshold
        ):
            unresolved_pool.append(unresolved_suppressed_ranked[0])
    unresolved_ranked_pool = _ranked_scored(unresolved_pool)

    for artifact, reason in unresolved_ranked_pool:
        if len(unresolved_selected) >= max(0, max_unresolved):
            break
        contested_key = _build_contested_key(artifact, current_chapter_id=current_chapter_id)
        if (
            artifact.interpretation_group_id
            and contested_key is None
            and artifact.artifact_id not in invalid_group_artifacts
        ):
            invalid_group_artifacts.add(artifact.artifact_id)
            notes.append(f"invalid_contested_group_metadata artifact_id={artifact.artifact_id}")
        if contested_key is not None and contested_key in chosen_group_ids:
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
        if contested_key is not None:
            chosen_group_ids.add(contested_key)
    if unresolved_selected:
        notes.append(f"Selected {len(unresolved_selected)} unresolved tension artifacts.")
    selected_unresolved_ids = {artifact.artifact_id for artifact, _ in unresolved_selected}
    for index, winner in enumerate(unresolved_selected):
        top_loser_for_winner = next(
            (
                item
                for item in unresolved_ranked_pool
                if item[0].artifact_id != winner[0].artifact_id
                and item[0].artifact_id not in selected_unresolved_ids
            ),
            None,
        )
        slot_diagnostics.append(
            {
                "slot": f"unresolved_tension:{index}",
                "winner": winner[0].artifact_id,
                "top_loser": top_loser_for_winner[0].artifact_id if top_loser_for_winner else None,
                "score_delta": (
                    float(winner[1].total_score - top_loser_for_winner[1].total_score)
                    if top_loser_for_winner is not None
                    else None
                ),
                "used_fallback": bool(
                    suppressed_fallback_enabled and winner[0].status == "suppressed"
                ),
                "tie_break_tuple": _ranking_tuple(winner),
                "tie_break_rationale": _tie_break_rationale(winner, top_loser_for_winner),
            }
        )
    if unresolved_ranked_pool:
        selected_winner: tuple[MemoryArtifact, MemorySelectionReason] | None = (
            unresolved_selected[0] if unresolved_selected else None
        )
        top_loser = next(
            (
                item
                for item in unresolved_ranked_pool
                if selected_winner is None or item[0].artifact_id != selected_winner[0].artifact_id
            ),
            None,
        )
        slot_diagnostics.append(
            {
                "slot": "unresolved_tension",
                "winner": selected_winner[0].artifact_id if selected_winner else None,
                "top_loser": top_loser[0].artifact_id if top_loser else None,
                "score_delta": (
                    float(selected_winner[1].total_score - top_loser[1].total_score)
                    if selected_winner is not None and top_loser is not None
                    else None
                ),
                "used_fallback": bool(
                    suppressed_fallback_enabled
                    and selected_winner is not None
                    and selected_winner[0].status == "suppressed"
                ),
                "tie_break_tuple": (
                    _ranking_tuple(selected_winner) if selected_winner is not None else None
                ),
                "tie_break_rationale": _tie_break_rationale(selected_winner, top_loser),
            }
        )

    select_best_for_type("emotional_state", slot="emotional_state")
    if "emotional_state" in selected:
        notes.append(f"Selected emotional state from {selected['emotional_state'].scene_id}.")

    select_best_for_type("location_state", slot="location_state")
    if "location_state" in selected:
        notes.append(f"Selected location state from {selected['location_state'].scene_id}.")

    packet = ResolvedMemoryPacket(
        selected_summary=selected["summary"].content if "summary" in selected else None,
        selected_unresolved_tensions=[artifact.content for artifact, _ in unresolved_selected],
        selected_emotional_carryover=(
            selected["emotional_state"].content if "emotional_state" in selected else None
        ),
        selected_location_state=(
            selected["location_state"].content if "location_state" in selected else None
        ),
        alternate_interpretation=alternate_interpretation,
        selected_artifact_ids=selected_ids,
        resolver_notes=notes,
        selected_interpretations=selected_interpretations,
        alternate_interpretations_by_slot=alternate_interpretations_by_slot,
        anchor_artifact_ids=anchor_artifact_ids,
        suppressed_artifact_ids=suppressed_artifact_ids,
        selection_slot_diagnostics=slot_diagnostics,
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


def _ranked_by_type(
    scored: list[tuple[MemoryArtifact, MemorySelectionReason]],
    artifact_type: str,
    statuses: set[str] | None = None,
) -> list[tuple[MemoryArtifact, MemorySelectionReason]]:
    filtered = [
        item
        for item in scored
        if item[0].artifact_type == artifact_type
        and (statuses is None or item[0].status in statuses)
    ]
    return _ranked_scored(filtered)


def _ranked_scored(
    scored: list[tuple[MemoryArtifact, MemorySelectionReason]],
) -> list[tuple[MemoryArtifact, MemorySelectionReason]]:
    return sorted(
        scored,
        key=lambda item: (
            -item[1].total_score,
            -float(1 if item[0].is_anchor else 0),
            -float(_effective_recency_priority(item[0])),
            -float(item[0].reinforcement_count),
            item[0].artifact_id,
        ),
    )


def _ranking_tuple(
    candidate: tuple[MemoryArtifact, MemorySelectionReason] | None,
) -> tuple[float, float, float, float, str] | None:
    if candidate is None:
        return None
    artifact, reason = candidate
    return (
        -reason.total_score,
        -float(1 if artifact.is_anchor else 0),
        -float(_effective_recency_priority(artifact)),
        -float(artifact.reinforcement_count),
        artifact.artifact_id,
    )


def _tie_break_rationale(
    winner: tuple[MemoryArtifact, MemorySelectionReason] | None,
    loser: tuple[MemoryArtifact, MemorySelectionReason] | None,
) -> str:
    base = "sorted by (-final_total, -anchor_status, -recency, -reinforcement_count, artifact_id)"
    if winner is None or loser is None:
        return base
    winner_reason = winner[1]
    loser_reason = loser[1]
    same_primary = winner_reason.total_score == loser_reason.total_score
    if same_primary:
        return f"{base}; artifact_id tie-break applied"
    return base


def _normalize_key_part(value: str | None) -> str:
    if value is None:
        return ""
    lowered = value.strip().lower()
    collapsed = re.sub(r"\s+", " ", lowered)
    return collapsed


def _build_contested_key(
    artifact: MemoryArtifact,
    *,
    current_chapter_id: str | None,
) -> str | None:
    if artifact.chapter_id is None or current_chapter_id is None:
        return None
    if artifact.chapter_id != current_chapter_id:
        return None
    if not artifact.interpretation_group_id or not artifact.source_kind or not artifact.source_ref:
        return None
    chapter_id = _normalize_key_part(artifact.chapter_id)
    slot_type = _normalize_key_part(artifact.artifact_type)
    source_kind = _normalize_key_part(artifact.source_kind)
    source_ref = _normalize_key_part(artifact.source_ref)
    group_id = _normalize_key_part(artifact.interpretation_group_id)
    if not chapter_id or not slot_type or not source_kind or not source_ref or not group_id:
        return None
    return f"{chapter_id}|{slot_type}|{source_kind}|{source_ref}|{group_id}"


def _effective_recency_priority(artifact: MemoryArtifact) -> int:
    if artifact.last_touch_scene_order is not None:
        return int(artifact.last_touch_scene_order)
    if int(artifact.recency_order) > 0:
        return int(artifact.recency_order)
    if artifact.artifact_scene_order is not None:
        return int(artifact.artifact_scene_order)
    return -1
