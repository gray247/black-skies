"""Phase 6A threshold tuning and trust-policy evaluation helpers."""

from __future__ import annotations

import json
import os
import platform
import statistics
import sys
from dataclasses import asdict, dataclass, replace
from pathlib import Path
from time import perf_counter

from blackskies.services.models.draft import DraftUnitOverrides
from blackskies.services.models.outline import OutlineScene
from blackskies.services.continuity_context_builder import assemble_scene_context
from blackskies.services.prompt_compiler import compile_draft_prompt, estimate_prompt_tokens
from blackskies.services.prompt_profile_resolver import select_profile

from .constants import MEMORY_LAB_SCHEMA_VERSION
from .environment import detect_environment_tier
from .resolver import resolve_memory_packet
from .schemas import MemoryArtifact, MemoryLedgerEntry, ResolvedMemoryPacket

TRUST_BAND_STABLE = "stable"
TRUST_BAND_CONTESTED_USEFUL = "contested_useful"
TRUST_BAND_UNSTABLE = "unstable"


@dataclass(frozen=True)
class ReplayScenario:
    chapter_size: str
    contested_density: str
    scene_count: int
    contested_groups: int

    @property
    def scenario_id(self) -> str:
        return f"{self.chapter_size}:{self.contested_density}"


REPLAY_CORPUS_SCENARIOS: tuple[ReplayScenario, ...] = (
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


@dataclass(frozen=True)
class ThresholdSweepConfig:
    threshold_values: tuple[float, ...]
    baseline_threshold: float = 0.08
    runs_supported: int = 100
    runs_best_effort: int = 5
    latency_budget_p95_ms: float = 25.0
    slot_selection_budget_p95_ms: float = 5.0
    prompt_growth_budget_p95: float = 0.20


@dataclass(frozen=True)
class ScenarioSweepMetrics:
    scenario_id: str
    chapter_size: str
    contested_density: str
    runs: int
    winner_drift_count: int
    alternate_drift_count: int
    deterministic_diagnostics_drift_count: int
    p50_resolution_ms: float
    p95_resolution_ms: float
    p99_resolution_ms: float
    p95_slot_selection_ms: float
    p95_prompt_growth: float
    diagnostics_completeness_rate: float
    trust_band_counts: dict[str, int]


@dataclass(frozen=True)
class ThresholdSweepResult:
    threshold: float
    scenario_metrics: list[ScenarioSweepMetrics]
    winner_drift_total: int
    alternate_drift_total: int
    deterministic_diagnostics_drift_total: int
    avg_diagnostics_completeness_rate: float
    aggregate_trust_band_counts: dict[str, int]
    p95_resolution_ms_worst: float
    p95_slot_selection_ms_worst: float
    p95_prompt_growth_worst: float
    blocker: bool
    blocker_reasons: list[str]


@dataclass(frozen=True)
class StopConditionEvaluation:
    stop_met: bool
    recommended_threshold: float | None
    conservative_fallback_threshold: float | None
    reasons: list[str]


@dataclass(frozen=True)
class Phase6ATuningReport:
    environment_tier: str
    environment_metadata: dict[str, object]
    lock_mode: str
    lock_is_effective: bool
    runs_per_scenario: int
    baseline_threshold: float
    threshold_values: list[float]
    results: list[ThresholdSweepResult]
    selected_recommended_threshold: float | None
    selected_conservative_fallback_threshold: float | None
    stop_condition: StopConditionEvaluation


def classify_trust_band(score_delta: float | None) -> str:
    if score_delta is None:
        return TRUST_BAND_STABLE
    if score_delta > 0.12:
        return TRUST_BAND_STABLE
    if score_delta > 0.03:
        return TRUST_BAND_CONTESTED_USEFUL
    return TRUST_BAND_UNSTABLE


def supported_deterministic_environment(project_root: Path) -> tuple[bool, str, bool]:
    tier = detect_environment_tier(project_root)
    return tier.is_supported_deterministic, tier.lock_mode, tier.lock_is_effective


def run_phase6a_threshold_sweep(
    *,
    project_root: Path,
    config: ThresholdSweepConfig,
    scenarios: tuple[ReplayScenario, ...] = REPLAY_CORPUS_SCENARIOS,
) -> Phase6ATuningReport:
    supported, lock_mode, lock_is_effective = supported_deterministic_environment(project_root)
    runs = config.runs_supported if supported else config.runs_best_effort
    scenario_results_by_threshold: dict[float, list[ScenarioSweepMetrics]] = {}

    for threshold in config.threshold_values:
        scenario_metrics: list[ScenarioSweepMetrics] = []
        for scenario in scenarios:
            metrics = _run_threshold_for_scenario(
                scenario=scenario,
                threshold=threshold,
                runs=runs,
            )
            scenario_metrics.append(metrics)
        scenario_results_by_threshold[float(threshold)] = scenario_metrics

    baseline_metrics = scenario_results_by_threshold.get(float(config.baseline_threshold))
    results: list[ThresholdSweepResult] = []
    for threshold in config.threshold_values:
        scenario_metrics = scenario_results_by_threshold.get(float(threshold), [])
        result = _aggregate_threshold_result(
            threshold=threshold,
            scenario_metrics=scenario_metrics,
            config=config,
            enforce_determinism=supported,
            baseline_metrics=baseline_metrics,
            baseline_threshold=config.baseline_threshold,
        )
        results.append(result)

    recommended = _select_recommended_threshold(results)
    conservative = _select_conservative_threshold(results)
    stop = evaluate_stop_condition(
        results=results,
        recommended_threshold=recommended,
        conservative_fallback_threshold=conservative,
        enforce_determinism=supported,
        baseline_threshold=config.baseline_threshold,
    )

    return Phase6ATuningReport(
        environment_tier="supported_deterministic" if supported else "best_effort",
        environment_metadata=_environment_metadata(
            lock_mode=lock_mode, lock_is_effective=lock_is_effective
        ),
        lock_mode=lock_mode,
        lock_is_effective=lock_is_effective,
        runs_per_scenario=runs,
        baseline_threshold=config.baseline_threshold,
        threshold_values=[float(value) for value in config.threshold_values],
        results=results,
        selected_recommended_threshold=recommended,
        selected_conservative_fallback_threshold=conservative,
        stop_condition=stop,
    )


def evaluate_stop_condition(
    *,
    results: list[ThresholdSweepResult],
    recommended_threshold: float | None,
    conservative_fallback_threshold: float | None,
    enforce_determinism: bool,
    baseline_threshold: float = 0.08,
) -> StopConditionEvaluation:
    reasons: list[str] = []
    if not results:
        reasons.append("threshold_results_missing")
    if recommended_threshold is None:
        reasons.append("missing_recommended_profile")
    if conservative_fallback_threshold is None:
        reasons.append("missing_conservative_fallback_profile")
    if not any(float(item.threshold) == float(baseline_threshold) for item in results):
        reasons.append("baseline_threshold_missing")
    if enforce_determinism:
        reg = _result_by_threshold(results, recommended_threshold)
        con = _result_by_threshold(results, conservative_fallback_threshold)
        if reg is None or reg.blocker:
            reasons.append("recommended_profile_has_blocker")
        if con is None or con.blocker:
            reasons.append("fallback_profile_has_blocker")
    if not _trust_band_documented(results):
        reasons.append("trust_band_outputs_missing")
    return StopConditionEvaluation(
        stop_met=not reasons,
        recommended_threshold=recommended_threshold,
        conservative_fallback_threshold=conservative_fallback_threshold,
        reasons=reasons,
    )


def write_phase6a_artifacts(
    *,
    output_dir: Path,
    report: Phase6ATuningReport,
) -> tuple[Path, Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    results_json = output_dir / "phase6a_threshold_sweep_results.json"
    decision_markdown = output_dir / "phase6a_tuning_decision_log.md"
    profile_candidate_json = output_dir / "phase6a_profile_candidate.json"

    results_json.write_text(json.dumps(asdict(report), indent=2), encoding="utf-8")
    decision_markdown.write_text(_build_decision_log(report), encoding="utf-8")
    profile_candidate_json.write_text(
        json.dumps(
            {
                "recommended_threshold": report.selected_recommended_threshold,
                "conservative_fallback_threshold": report.selected_conservative_fallback_threshold,
                "stop_condition_met": report.stop_condition.stop_met,
                "stop_condition_reasons": list(report.stop_condition.reasons),
                "environment_tier": report.environment_tier,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return results_json, decision_markdown, profile_candidate_json


def _run_threshold_for_scenario(
    *,
    scenario: ReplayScenario,
    threshold: float,
    runs: int,
) -> ScenarioSweepMetrics:
    entries = _build_replay_entries(scenario)
    signatures: list[tuple[object, ...]] = []
    resolution_ms: list[float] = []
    slot_selection_ms: list[float] = []
    prompt_growth: list[float] = []
    completeness: list[float] = []
    trust_band_counts = {
        TRUST_BAND_STABLE: 0,
        TRUST_BAND_CONTESTED_USEFUL: 0,
        TRUST_BAND_UNSTABLE: 0,
    }

    for _ in range(runs):
        start = perf_counter()
        packet, _reasons = resolve_memory_packet(
            entries=entries,
            current_scene_id="sc_9999",
            current_chapter_id="ch_tune",
            current_scene_order=9999,
            max_candidates=8,
            max_unresolved=3,
            alternate_interpretation_threshold=float(threshold),
            suppressed_fallback_enabled=True,
            low_confidence_fallback_threshold=0.35,
        )
        elapsed_ms = (perf_counter() - start) * 1000.0
        resolution_ms.append(elapsed_ms)
        slot_count = max(1, len(packet.selection_slot_diagnostics))
        slot_selection_ms.append(elapsed_ms / float(slot_count))
        prompt_growth.append(_prompt_growth_for_packet(packet))
        completeness.append(_diagnostics_completeness(packet))
        signatures.append(_deterministic_signature(packet))
        for slot_row in packet.selection_slot_diagnostics:
            score_delta = slot_row.get("score_delta")
            band = classify_trust_band(
                float(score_delta) if isinstance(score_delta, (float, int)) else None
            )
            trust_band_counts[band] += 1

    first = signatures[0]
    winner_drift = sum(1 for sig in signatures if sig[0] != first[0])
    alternate_drift = sum(1 for sig in signatures if sig[1] != first[1])
    diag_drift = sum(1 for sig in signatures if sig[2:] != first[2:])

    return ScenarioSweepMetrics(
        scenario_id=scenario.scenario_id,
        chapter_size=scenario.chapter_size,
        contested_density=scenario.contested_density,
        runs=runs,
        winner_drift_count=winner_drift,
        alternate_drift_count=alternate_drift,
        deterministic_diagnostics_drift_count=diag_drift,
        p50_resolution_ms=_percentile(resolution_ms, 50),
        p95_resolution_ms=_percentile(resolution_ms, 95),
        p99_resolution_ms=_percentile(resolution_ms, 99),
        p95_slot_selection_ms=_percentile(slot_selection_ms, 95),
        p95_prompt_growth=_percentile(prompt_growth, 95),
        diagnostics_completeness_rate=(statistics.mean(completeness) if completeness else 0.0),
        trust_band_counts=trust_band_counts,
    )


def _aggregate_threshold_result(
    *,
    threshold: float,
    scenario_metrics: list[ScenarioSweepMetrics],
    config: ThresholdSweepConfig,
    enforce_determinism: bool,
    baseline_metrics: list[ScenarioSweepMetrics] | None,
    baseline_threshold: float,
) -> ThresholdSweepResult:
    winner_drift_total = sum(item.winner_drift_count for item in scenario_metrics)
    alternate_drift_total = sum(item.alternate_drift_count for item in scenario_metrics)
    diag_drift_total = sum(item.deterministic_diagnostics_drift_count for item in scenario_metrics)
    trust_band_counts = {
        TRUST_BAND_STABLE: 0,
        TRUST_BAND_CONTESTED_USEFUL: 0,
        TRUST_BAND_UNSTABLE: 0,
    }
    for item in scenario_metrics:
        for key, value in item.trust_band_counts.items():
            trust_band_counts[key] += int(value)

    avg_completeness = (
        statistics.mean([item.diagnostics_completeness_rate for item in scenario_metrics])
        if scenario_metrics
        else 0.0
    )
    p95_resolution_worst = max((item.p95_resolution_ms for item in scenario_metrics), default=0.0)
    p95_slot_worst = max((item.p95_slot_selection_ms for item in scenario_metrics), default=0.0)
    p95_prompt_growth_worst = max(
        (item.p95_prompt_growth for item in scenario_metrics), default=0.0
    )

    reasons: list[str] = []
    if enforce_determinism and winner_drift_total > 0:
        reasons.append("winner_drift_detected")
    if enforce_determinism and alternate_drift_total > 0:
        reasons.append("alternate_drift_detected")
    if enforce_determinism and diag_drift_total > 0:
        reasons.append("deterministic_diagnostics_drift_detected")
    if p95_resolution_worst > config.latency_budget_p95_ms:
        reasons.append("resolution_latency_budget_exceeded")
    if p95_slot_worst > config.slot_selection_budget_p95_ms:
        reasons.append("slot_selection_latency_budget_exceeded")
    if p95_prompt_growth_worst > config.prompt_growth_budget_p95:
        reasons.append("prompt_growth_budget_exceeded")
    if avg_completeness < 0.99:
        reasons.append("diagnostics_completeness_below_target")
    if (
        enforce_determinism
        and baseline_metrics is not None
        and float(threshold) != float(baseline_threshold)
    ):
        baseline_winner = sum(item.winner_drift_count for item in baseline_metrics)
        baseline_alternate = sum(item.alternate_drift_count for item in baseline_metrics)
        baseline_diag = sum(item.deterministic_diagnostics_drift_count for item in baseline_metrics)
        if winner_drift_total > baseline_winner:
            reasons.append("winner_drift_regression_vs_baseline")
        if alternate_drift_total > baseline_alternate:
            reasons.append("alternate_drift_regression_vs_baseline")
        if diag_drift_total > baseline_diag:
            reasons.append("diagnostics_drift_regression_vs_baseline")

    return ThresholdSweepResult(
        threshold=float(threshold),
        scenario_metrics=scenario_metrics,
        winner_drift_total=winner_drift_total,
        alternate_drift_total=alternate_drift_total,
        deterministic_diagnostics_drift_total=diag_drift_total,
        avg_diagnostics_completeness_rate=avg_completeness,
        aggregate_trust_band_counts=trust_band_counts,
        p95_resolution_ms_worst=p95_resolution_worst,
        p95_slot_selection_ms_worst=p95_slot_worst,
        p95_prompt_growth_worst=p95_prompt_growth_worst,
        blocker=bool(reasons),
        blocker_reasons=reasons,
    )


def _select_recommended_threshold(results: list[ThresholdSweepResult]) -> float | None:
    viable = [item for item in results if not item.blocker]
    if not viable:
        return None
    # Prefer contested_useful gains while keeping unstable as low as possible.
    viable_sorted = sorted(
        viable,
        key=lambda item: (
            -item.aggregate_trust_band_counts[TRUST_BAND_CONTESTED_USEFUL],
            item.aggregate_trust_band_counts[TRUST_BAND_UNSTABLE],
            abs(item.threshold - 0.08),
        ),
    )
    return float(viable_sorted[0].threshold)


def _select_conservative_threshold(results: list[ThresholdSweepResult]) -> float | None:
    viable = [item for item in results if not item.blocker]
    if not viable:
        return None
    viable_sorted = sorted(
        viable,
        key=lambda item: (
            -item.aggregate_trust_band_counts[TRUST_BAND_STABLE],
            item.p95_prompt_growth_worst,
            item.threshold,
        ),
    )
    return float(viable_sorted[0].threshold)


def _result_by_threshold(
    results: list[ThresholdSweepResult], threshold: float | None
) -> ThresholdSweepResult | None:
    if threshold is None:
        return None
    for item in results:
        if float(item.threshold) == float(threshold):
            return item
    return None


def _trust_band_documented(results: list[ThresholdSweepResult]) -> bool:
    for item in results:
        counts = item.aggregate_trust_band_counts
        if all(
            key in counts
            for key in (TRUST_BAND_STABLE, TRUST_BAND_CONTESTED_USEFUL, TRUST_BAND_UNSTABLE)
        ):
            return True
    return False


def _deterministic_signature(packet: ResolvedMemoryPacket) -> tuple[object, ...]:
    rows = []
    for item in packet.selection_slot_diagnostics:
        rows.append(
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
    advisory_reason = (
        "advisory_available" if packet.selected_artifact_ids else "advisory_unavailable"
    )
    return (
        tuple(packet.selected_artifact_ids),
        tuple(sorted(packet.alternate_interpretations_by_slot.items())),
        tuple(rows),
        advisory_reason,
    )


def _diagnostics_completeness(packet: ResolvedMemoryPacket) -> float:
    if not packet.selection_slot_diagnostics:
        return 1.0
    required_fields = (
        "winner",
        "top_loser",
        "score_delta",
        "used_fallback",
        "tie_break_tuple",
        "tie_break_rationale",
    )
    valid = 0
    for item in packet.selection_slot_diagnostics:
        if all(field in item for field in required_fields):
            valid += 1
    return valid / float(len(packet.selection_slot_diagnostics))


def _prompt_growth_for_packet(packet: ResolvedMemoryPacket) -> float:
    scene = OutlineScene(
        id="sc_9001",
        order=1,
        title="Tuning Scene",
        chapter_id="ch_9001",
        beat_refs=["turn"],
    )
    context = assemble_scene_context(
        scene=scene,
        front_matter={"pov": "tuning"},
        overrides=DraftUnitOverrides(),
        project_root=None,
        scene_lookup={scene.id: scene},
    )
    winner_only_packet = ResolvedMemoryPacket(
        selected_summary=packet.selected_summary,
        selected_unresolved_tensions=packet.selected_unresolved_tensions,
        selected_emotional_carryover=packet.selected_emotional_carryover,
        selected_location_state=packet.selected_location_state,
        alternate_interpretation=None,
        selected_artifact_ids=packet.selected_artifact_ids,
        resolver_notes=packet.resolver_notes,
        selected_interpretations=packet.selected_interpretations,
        alternate_interpretations_by_slot={},
        anchor_artifact_ids=packet.anchor_artifact_ids,
        suppressed_artifact_ids=packet.suppressed_artifact_ids,
        selection_slot_diagnostics=packet.selection_slot_diagnostics,
    )
    prompt_winner_only = compile_draft_prompt(
        replace(context, resolved_memory=winner_only_packet),
        profile=select_profile("ollama"),
    )
    prompt_with_alt = compile_draft_prompt(
        replace(context, resolved_memory=packet),
        profile=select_profile("ollama"),
    )
    base_tokens = estimate_prompt_tokens(prompt_winner_only)
    with_alt_tokens = estimate_prompt_tokens(prompt_with_alt)
    if base_tokens <= 0:
        return 0.0
    return max(0.0, (with_alt_tokens - base_tokens) / float(base_tokens))


def _build_replay_entries(scenario: ReplayScenario) -> list[MemoryLedgerEntry]:
    chapter_id = "ch_tune"
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
        entries.append(
            MemoryLedgerEntry(
                scene_id=scene_id,
                chapter_id=chapter_id,
                schema_version=MEMORY_LAB_SCHEMA_VERSION,
                artifacts=artifacts,
                source_summary=None,
                source_unresolved=[],
                source_emotional_carryover=None,
                source_location_state=None,
            )
        )
    return entries


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
        derived_from="phase6a-tuning",
        created_at="2026-04-13T00:00:00Z",
        interpretation_group_id=interpretation_group_id,
        interpretation_label=interpretation_label,
        source_kind="scene" if interpretation_group_id else None,
        source_ref=source_ref,
        artifact_scene_order=recency_order,
    )


def _percentile(values: list[float], pct: int) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    if len(ordered) == 1:
        return float(ordered[0])
    rank = (pct / 100.0) * (len(ordered) - 1)
    low = int(rank)
    high = min(low + 1, len(ordered) - 1)
    frac = rank - low
    return float(ordered[low] + (ordered[high] - ordered[low]) * frac)


def _build_decision_log(report: Phase6ATuningReport) -> str:
    lines = [
        "# Phase 6A Threshold Tuning Decision Log",
        "",
        f"- environment_tier: `{report.environment_tier}`",
        f"- os: `{report.environment_metadata.get('os')}`",
        f"- cpu: `{report.environment_metadata.get('cpu')}`",
        f"- python: `{report.environment_metadata.get('python_version')}`",
        f"- run_mode: `{report.environment_metadata.get('run_mode')}`",
        f"- lock_mode: `{report.lock_mode}`",
        f"- lock_is_effective: `{report.lock_is_effective}`",
        f"- runs_per_scenario: `{report.runs_per_scenario}`",
        "",
        "## Candidate Results",
    ]
    for result in sorted(report.results, key=lambda item: item.threshold):
        lines.extend(
            [
                f"- threshold `{result.threshold:.2f}`",
                f"  - blocker: `{result.blocker}`",
                f"  - blocker_reasons: `{', '.join(result.blocker_reasons) if result.blocker_reasons else 'none'}`",
                f"  - winner_drift_total: `{result.winner_drift_total}`",
                f"  - alternate_drift_total: `{result.alternate_drift_total}`",
                f"  - diagnostics_drift_total: `{result.deterministic_diagnostics_drift_total}`",
                f"  - p95_resolution_ms_worst: `{result.p95_resolution_ms_worst:.3f}`",
                f"  - p95_slot_selection_ms_worst: `{result.p95_slot_selection_ms_worst:.3f}`",
                f"  - p95_prompt_growth_worst: `{result.p95_prompt_growth_worst:.4f}`",
                f"  - avg_diagnostics_completeness_rate: `{result.avg_diagnostics_completeness_rate:.4f}`",
            ]
        )
    lines.extend(
        [
            "",
            "## Selection",
            f"- recommended_threshold: `{report.selected_recommended_threshold}`",
            f"- conservative_fallback_threshold: `{report.selected_conservative_fallback_threshold}`",
            f"- stop_condition_met: `{report.stop_condition.stop_met}`",
            f"- stop_condition_reasons: `{', '.join(report.stop_condition.reasons) if report.stop_condition.reasons else 'none'}`",
        ]
    )
    return "\n".join(lines) + "\n"


def _environment_metadata(*, lock_mode: str, lock_is_effective: bool) -> dict[str, object]:
    run_mode = "ci" if os.getenv("CI") else "local"
    return {
        "os": f"{platform.system()} {platform.release()}",
        "cpu": platform.machine(),
        "python_version": sys.version.split()[0],
        "run_mode": run_mode,
        "lock_mode": lock_mode,
        "lock_is_effective": lock_is_effective,
    }
