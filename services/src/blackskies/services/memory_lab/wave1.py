"""Phase 7B Wave 1 experimental helpers (A1/B1) with strict isolation."""

from __future__ import annotations

from dataclasses import replace
import json
import math
from pathlib import Path
from time import perf_counter
from typing import TypedDict, cast

from .experimental import ExperimentDescriptor, register_experiment
from .options import MemoryLabRuntimeOptions
from .schemas import MemoryArtifact, MemoryLedgerEntry, ResolvedMemoryPacket

EXPERIMENT_A1 = "A1"
EXPERIMENT_B1 = "B1"

_A1_ALIASES = {"a1", "a1_exploration_pressure", "exploration_pressure"}
_B1_ALIASES = {"b1", "b1_reinforcement_saturation_cap", "reinforcement_saturation_cap"}

A1_MAX_ALTERNATE_SURFACING_DELTA = 0.15
A1_MAX_PROMPT_GROWTH = 0.20
B1_MAX_EVENT_GROWTH = 0.10
B1_MAX_LATENCY_GROWTH = 0.10
COMBINED_MAX_PROMPT_GROWTH = 0.20
COMBINED_MAX_EVENT_GROWTH = 0.15
COMBINED_MAX_LATENCY_GROWTH = 0.15


class _SlotDiagnostic(TypedDict):
    slot: str
    winner: str
    top_loser: str
    score_delta: float
    used_fallback: bool
    tie_break_tuple: tuple[object, ...] | None
    tie_break_rationale: str | None


def ensure_wave1_descriptors_registered() -> None:
    register_experiment(
        ExperimentDescriptor(
            name=EXPERIMENT_A1,
            hypothesis="bounded exposure pressure increases near-threshold alternate surfacing without winner inversion",
            metrics=(
                "alternate_surfacing_delta",
                "prompt_token_growth",
                "winner_drift",
                "alternate_drift",
            ),
            guardrails=(
                "alternate_surfacing_delta<=0.15",
                "prompt_token_growth<=0.20",
                "winner_drift=0",
                "alternate_drift=0",
            ),
            regression_budget={"prompt_token_growth": A1_MAX_PROMPT_GROWTH},
            success_criteria=("exposure_only_no_winner_inversion",),
        )
    )
    register_experiment(
        ExperimentDescriptor(
            name=EXPERIMENT_B1,
            hypothesis="saturation curve caps reinforcement accumulation while preserving deterministic winner selection",
            metrics=(
                "event_growth",
                "latency_growth",
                "prompt_token_growth_from_saturation_logic",
                "winner_drift",
            ),
            guardrails=(
                "event_growth<=0.10",
                "latency_growth<=0.10",
                "prompt_token_growth_from_saturation_logic=0.0",
                "winner_drift=0",
            ),
            regression_budget={
                "event_growth": B1_MAX_EVENT_GROWTH,
                "latency_growth": B1_MAX_LATENCY_GROWTH,
            },
            success_criteria=("bounded_reinforcement_curve",),
        )
    )


def is_a1_enabled(options: MemoryLabRuntimeOptions) -> bool:
    if not options.experimental_enabled:
        return False
    active = _normalized_active(options.experimental_active_experiments)
    return bool(active & ({EXPERIMENT_A1.lower()} | _A1_ALIASES))


def is_b1_enabled(options: MemoryLabRuntimeOptions) -> bool:
    if not options.experimental_enabled:
        return False
    active = _normalized_active(options.experimental_active_experiments)
    return bool(active & ({EXPERIMENT_B1.lower()} | _B1_ALIASES))


def apply_a1_exploration_pressure(
    *,
    packet: ResolvedMemoryPacket,
    entries: list[MemoryLedgerEntry],
    alternate_interpretation_threshold: float,
) -> tuple[ResolvedMemoryPacket, dict[str, float], float]:
    started = perf_counter()
    slot_diags = list(packet.selection_slot_diagnostics)
    eligible_slots = [
        cast(_SlotDiagnostic, slot)
        for slot in slot_diags
        if isinstance(slot.get("winner"), str)
        and isinstance(slot.get("top_loser"), str)
        and isinstance(slot.get("score_delta"), (int, float))
    ]
    baseline_count = len(packet.alternate_interpretations_by_slot)
    baseline_rate = _ratio(baseline_count, len(eligible_slots))

    if not eligible_slots:
        return (
            packet,
            {
                "baseline_alternate_count": float(baseline_count),
                "experimental_alternate_count": float(baseline_count),
                "alternate_surfacing_delta": 0.0,
                "eligible_slots": 0.0,
                "added_slots": 0.0,
            },
            (perf_counter() - started) * 1000.0,
        )

    artifact_lookup = _artifact_lookup(entries)
    updated_alternates = dict(packet.alternate_interpretations_by_slot)
    added_slots = 0
    pressure_threshold = float(alternate_interpretation_threshold) + min(
        0.05, float(alternate_interpretation_threshold) * 0.50
    )
    max_additional = int(math.floor(len(eligible_slots) * A1_MAX_ALTERNATE_SURFACING_DELTA))

    candidates: list[tuple[str, float, str]] = []
    for row in eligible_slots:
        slot = str(row["slot"])
        if slot in updated_alternates:
            continue
        delta = float(row["score_delta"])
        if delta > pressure_threshold:
            continue
        loser_id = str(row["top_loser"])
        loser = artifact_lookup.get(loser_id)
        if loser is None:
            continue
        label = (loser.interpretation_label or loser.content).strip()
        if not label:
            continue
        candidates.append((slot, delta, label))

    for slot, _delta, label in sorted(candidates, key=lambda item: (item[1], item[0])):
        if added_slots >= max_additional:
            break
        updated_alternates[slot] = label
        added_slots += 1

    updated_alternate_interpretation = packet.alternate_interpretation
    if not updated_alternate_interpretation:
        summary_alternate = updated_alternates.get("summary")
        if isinstance(summary_alternate, str) and summary_alternate.strip():
            updated_alternate_interpretation = summary_alternate

    experimental_count = len(updated_alternates)
    experimental_rate = _ratio(experimental_count, len(eligible_slots))
    delta_rate = experimental_rate - baseline_rate
    updated_packet = replace(
        packet,
        alternate_interpretations_by_slot=updated_alternates,
        alternate_interpretation=updated_alternate_interpretation,
    )
    return (
        updated_packet,
        {
            "baseline_alternate_count": float(baseline_count),
            "experimental_alternate_count": float(experimental_count),
            "alternate_surfacing_delta": float(delta_rate),
            "eligible_slots": float(len(eligible_slots)),
            "added_slots": float(added_slots),
        },
        (perf_counter() - started) * 1000.0,
    )


def b1_saturated_selection_delta(
    artifact: MemoryArtifact, *, baseline_delta: float
) -> tuple[float, str]:
    reinforced_count = max(int(artifact.reinforcement_count), int(artifact.selection_count))
    if reinforced_count < 3:
        return float(baseline_delta), "normal"
    if reinforced_count < 6:
        return float(baseline_delta) * 0.5, "diminishing"
    return float(baseline_delta) * 0.1, "near_flat"


def estimate_packet_prompt_tokens(packet: ResolvedMemoryPacket) -> int:
    pieces: list[str] = []
    if packet.selected_summary:
        pieces.append(packet.selected_summary)
    pieces.extend(packet.selected_unresolved_tensions)
    if packet.selected_emotional_carryover:
        pieces.append(packet.selected_emotional_carryover)
    if packet.selected_location_state:
        pieces.append(packet.selected_location_state)
    if packet.alternate_interpretation:
        pieces.append(packet.alternate_interpretation)
    text = " ".join(item for item in pieces if item)
    return len(text.split())


def evaluate_wave1_guardrails(
    metrics: dict[str, float], *, a1_enabled: bool, b1_enabled: bool
) -> tuple[bool, list[str]]:
    violations: list[str] = []
    if a1_enabled:
        if metrics.get("a1.alternate_surfacing_delta", 0.0) > A1_MAX_ALTERNATE_SURFACING_DELTA:
            violations.append("a1_alternate_surfacing_delta_exceeded")
        if metrics.get("a1.prompt_token_growth", 0.0) > A1_MAX_PROMPT_GROWTH:
            violations.append("a1_prompt_token_growth_exceeded")
        if metrics.get("determinism.winner_drift_count", 0.0) != 0.0:
            violations.append("a1_winner_drift_detected")
        if metrics.get("determinism.alternate_drift_count", 0.0) != 0.0:
            violations.append("a1_alternate_drift_detected")
    if b1_enabled:
        if metrics.get("b1.event_growth", 0.0) > B1_MAX_EVENT_GROWTH:
            violations.append("b1_event_growth_exceeded")
        if metrics.get("b1.latency_growth", 0.0) > B1_MAX_LATENCY_GROWTH:
            violations.append("b1_latency_growth_exceeded")
        if metrics.get("b1.prompt_growth_from_saturation_logic", 0.0) != 0.0:
            violations.append("b1_prompt_growth_non_zero")
        if metrics.get("determinism.winner_drift_count", 0.0) != 0.0:
            violations.append("b1_winner_drift_detected")
    if a1_enabled and b1_enabled:
        if metrics.get("combined.prompt_growth", 0.0) > COMBINED_MAX_PROMPT_GROWTH:
            violations.append("combined_prompt_growth_exceeded")
        if metrics.get("combined.event_growth", 0.0) > COMBINED_MAX_EVENT_GROWTH:
            violations.append("combined_event_growth_exceeded")
        if metrics.get("combined.latency_growth", 0.0) > COMBINED_MAX_LATENCY_GROWTH:
            violations.append("combined_latency_growth_exceeded")
        if metrics.get("determinism.winner_drift_count", 0.0) != 0.0:
            violations.append("combined_winner_drift_detected")
        if metrics.get("determinism.alternate_drift_count", 0.0) != 0.0:
            violations.append("combined_alternate_drift_detected")
    return (not violations), violations


def append_wave1_metrics_log(*, project_root: Path, payload: dict[str, object]) -> None:
    target = project_root / ".blackskies" / "memory_lab" / "experimental" / "wave1_metrics.log"
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, sort_keys=True))
        handle.write("\n")


def _normalized_active(active_experiments: tuple[str, ...]) -> set[str]:
    return {item.strip().lower() for item in active_experiments if item and item.strip()}


def _artifact_lookup(entries: list[MemoryLedgerEntry]) -> dict[str, MemoryArtifact]:
    return {artifact.artifact_id: artifact for entry in entries for artifact in entry.artifacts}


def _ratio(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0.0
    return float(numerator) / float(denominator)
