from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import pytest

from blackskies.services.memory_lab.constants import MEMORY_LAB_SCHEMA_VERSION
from blackskies.services.memory_lab.locking import acquire_project_lock
from blackskies.services.memory_lab.resolver import resolve_memory_packet
from blackskies.services.memory_lab.schemas import (
    MemoryArtifact,
    MemoryLedgerEntry,
    ResolvedMemoryPacket,
)


@dataclass(frozen=True)
class ReplayScenario:
    chapter_size: str
    contested_density: str
    scene_count: int
    contested_groups: int


SCENARIOS: tuple[ReplayScenario, ...] = (
    ReplayScenario("short", "low", 3, 1),
    ReplayScenario("short", "medium", 3, 2),
    ReplayScenario("short", "high", 3, 3),
    ReplayScenario("medium", "low", 8, 2),
    ReplayScenario("medium", "medium", 8, 4),
    ReplayScenario("medium", "high", 8, 7),
    ReplayScenario("long", "low", 20, 4),
    ReplayScenario("long", "medium", 20, 10),
    ReplayScenario("long", "high", 20, 18),
)


def _supported_deterministic_environment(tmp_path: Path) -> bool:
    with acquire_project_lock(tmp_path / "env_probe") as state:
        return state.lock_is_effective and state.lock_mode in {"fcntl", "fcntl_posix"}


def _artifact(
    *,
    artifact_id: str,
    scene_id: str,
    chapter_id: str,
    recency_order: int,
    interpretation_group_id: str | None,
    interpretation_label: str | None,
    source_ref: str | None,
) -> MemoryArtifact:
    return MemoryArtifact(
        artifact_id=artifact_id,
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id=scene_id,
        chapter_id=chapter_id,
        source_excerpt=None,
        content=f"summary::{scene_id}",
        weight=1.0,
        confidence=1.0,
        recency_order=recency_order,
        tags=[],
        derived_from="determinism-test",
        created_at="2026-04-13T00:00:00Z",
        interpretation_group_id=interpretation_group_id,
        interpretation_label=interpretation_label,
        source_kind="scene" if interpretation_group_id else None,
        source_ref=source_ref,
        artifact_scene_order=recency_order,
    )


def _entry(scene_id: str, chapter_id: str, artifacts: list[MemoryArtifact]) -> MemoryLedgerEntry:
    return MemoryLedgerEntry(
        scene_id=scene_id,
        chapter_id=chapter_id,
        schema_version=MEMORY_LAB_SCHEMA_VERSION,
        artifacts=artifacts,
        source_summary=None,
        source_unresolved=[],
        source_emotional_carryover=None,
        source_location_state=None,
    )


def _build_entries(scenario: ReplayScenario) -> list[MemoryLedgerEntry]:
    chapter_id = "ch_det"
    entries: list[MemoryLedgerEntry] = []
    contested_scene_indices = set(
        range(1, min(scenario.scene_count, scenario.contested_groups) + 1)
    )
    for idx in range(1, scenario.scene_count + 1):
        scene_id = f"sc_{idx:04d}"
        artifacts: list[MemoryArtifact] = [
            _artifact(
                artifact_id=f"{scene_id}:base",
                scene_id=scene_id,
                chapter_id=chapter_id,
                recency_order=idx,
                interpretation_group_id=None,
                interpretation_label=None,
                source_ref=None,
            )
        ]
        if idx in contested_scene_indices:
            group_id = f"grp_{idx:04d}"
            artifacts.append(
                _artifact(
                    artifact_id=f"{scene_id}:alt_a",
                    scene_id=scene_id,
                    chapter_id=chapter_id,
                    recency_order=idx,
                    interpretation_group_id=group_id,
                    interpretation_label=f"label-a-{idx}",
                    source_ref=scene_id,
                )
            )
            artifacts.append(
                _artifact(
                    artifact_id=f"{scene_id}:alt_b",
                    scene_id=scene_id,
                    chapter_id=chapter_id,
                    recency_order=max(0, idx - 1),
                    interpretation_group_id=group_id,
                    interpretation_label=f"label-b-{idx}",
                    source_ref=scene_id,
                )
            )
        entries.append(_entry(scene_id, chapter_id, artifacts))
    return entries


def _deterministic_signature(
    packet: ResolvedMemoryPacket, advisory_reason_code: str
) -> tuple[object, ...]:
    slot_rows = []
    for item in packet.selection_slot_diagnostics:
        slot_rows.append(
            (
                item.get("slot"),
                item.get("winner"),
                item.get("top_loser"),
                item.get("score_delta"),
                item.get("used_fallback"),
                item.get("tie_break_tuple"),
                item.get("tie_break_rationale"),
            )
        )
    return (
        tuple(packet.selected_artifact_ids),
        tuple(sorted(packet.alternate_interpretations_by_slot.items())),
        tuple(sorted(slot_rows)),
        advisory_reason_code,
    )


def _replay_signatures(scenario: ReplayScenario, runs: int) -> Iterable[tuple[object, ...]]:
    entries = _build_entries(scenario)
    for _ in range(runs):
        packet, _reasons = resolve_memory_packet(
            entries=entries,
            current_scene_id="sc_9999",
            current_chapter_id="ch_det",
            current_scene_order=9999,
            max_candidates=8,
            max_unresolved=3,
            alternate_interpretation_threshold=0.08,
            suppressed_fallback_enabled=True,
            low_confidence_fallback_threshold=0.35,
        )
        advisory_reason_code = (
            "advisory_available" if packet.selected_artifact_ids else "advisory_unavailable"
        )
        yield _deterministic_signature(packet, advisory_reason_code)


@pytest.mark.parametrize(
    "scenario", SCENARIOS, ids=lambda s: f"{s.chapter_size}-{s.contested_density}"
)
def test_contested_selection_determinism_supported_env(
    tmp_path: Path, scenario: ReplayScenario
) -> None:
    if not _supported_deterministic_environment(tmp_path):
        pytest.skip("best-effort environment: deterministic gate is report-only")
    signatures = list(_replay_signatures(scenario, runs=100))
    first = signatures[0]
    winner_drift = sum(1 for sig in signatures if sig[0] != first[0])
    alternate_drift = sum(1 for sig in signatures if sig[1] != first[1])
    diagnostics_drift = sum(1 for sig in signatures if sig[2:] != first[2:])
    assert winner_drift == 0
    assert alternate_drift == 0
    assert diagnostics_drift == 0


@pytest.mark.parametrize(
    "scenario", SCENARIOS, ids=lambda s: f"{s.chapter_size}-{s.contested_density}"
)
def test_contested_selection_determinism_best_effort_report_only(
    tmp_path: Path,
    scenario: ReplayScenario,
) -> None:
    if _supported_deterministic_environment(tmp_path):
        pytest.skip("supported deterministic environment: report-only test not applicable")
    signatures = list(_replay_signatures(scenario, runs=5))
    # Report-only lane: verify replay executes and returns deterministic fields structure.
    assert signatures
    assert all(len(sig) == 4 for sig in signatures)
