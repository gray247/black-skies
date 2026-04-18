"""Runtime orchestration for Memory Lab advisory state.

Memory Lab owns advisory resolution and advisory-state mutation only:
- resolver invocation
- contested selection diagnostics
- reinforcement and decay bookkeeping
- anchor promotion and experimental advisory behaviors

It must not own scene continuity persistence under ``.blackskies/continuity``.
Continuity enters Memory Lab through explicit ingestion helpers before this
orchestrator runs.
"""

from __future__ import annotations

from dataclasses import replace
from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path
import re
from time import perf_counter

from .anchors import is_anchor_candidate, promote_anchor_candidate
from .compat import (
    append_contested_outcome_event_current,
    append_decay_event_current,
    append_reinforcement_event_current,
    load_entries_compat,
    write_entry_current,
)
from .constants import MEMORY_CONTESTED_EVENT_SCHEMA_VERSION, MEMORY_DECAY_EVENT_SCHEMA_VERSION
from .decay import apply_decay_to_artifact
from .diagnostics import (
    AnchorPromotionDiagnostic,
    DecayDiagnostic,
    MemoryLabRuntimeDiagnostics,
    ResolverDecisionDiagnostic,
)
from .experimental import run_experimental_framework
from .lifecycle import derive_memory_status
from .locking import acquire_project_lock
from .options import MemoryLabRuntimeOptions
from .reinforcement import is_revival_candidate, reinforce_artifact, selection_delta
from .resolver import resolve_memory_packet
from .schemas import ContestedOutcomeEvent, DecayEvent, MemoryArtifact, ResolvedMemoryPacket
from .scoring import compute_status_multiplier, compute_total_score
from .storage import detect_event_file_corruption
from .wave1 import (
    append_wave1_metrics_log,
    apply_a1_exploration_pressure,
    b1_saturated_selection_delta,
    ensure_wave1_descriptors_registered,
    estimate_packet_prompt_tokens,
    evaluate_wave1_guardrails,
    is_a1_enabled,
    is_b1_enabled,
)

_SUPPORTED_DETERMINISTIC_LOCK_MODES = {"fcntl", "fcntl_posix"}


def orchestrate_memory_resolution(
    *,
    project_root: Path,
    current_scene_id: str,
    current_chapter_id: str | None,
    current_scene_order: int,
    options: MemoryLabRuntimeOptions,
    now_iso: str | None = None,
) -> tuple[ResolvedMemoryPacket | None, MemoryLabRuntimeDiagnostics]:
    if not options.enabled:
        return None, MemoryLabRuntimeDiagnostics(
            memory_lab_enabled=False,
            used_legacy_continuity_only=True,
            current_scene_order=current_scene_order,
            lock_acquired=False,
            decay_events_written=0,
            reinforcement_events_written=0,
            revival_events_written=0,
            anchor_promotions=0,
            advisory_available=False,
            advisory_unavailable_reason_code="disabled_by_flag",
            resolver_decisions=[],
            slot_selection_diagnostics=[],
            decay_diagnostics=[],
            anchor_promotion_diagnostics=[],
            failure_entries=[],
            corruption_entries=[],
            notes=["Memory Lab disabled via runtime options."],
        )

    effective_now_iso = now_iso or datetime.now(UTC).isoformat()
    notes: list[str] = []
    write_failure_notes: list[str] = []
    failure_entries: list[str] = []
    corruption_entries: list[str] = []
    decay_events_written = 0
    reinforcement_events_written = 0
    revival_events_written = 0
    anchor_promotions = 0
    anchor_promotion_diagnostics: list[AnchorPromotionDiagnostic] = []
    decay_diagnostics: list[DecayDiagnostic] = []
    experimental_ran = False
    experimental_blocked_experiments: list[str] = []
    experimental_outcomes: list[dict[str, str]] = []
    experimental_metrics: dict[str, object] = {}
    experimental_guardrail_passed: bool | None = None
    experimental_guardrail_violations: list[str] = []

    with acquire_project_lock(project_root) as lock_state:
        environment_tier = _environment_tier_from_lock(lock_state.lock_mode, lock_state.lock_is_effective)
        if not lock_state.lock_is_effective:
            lock_note = f"lock_not_effective mode={lock_state.lock_mode} scene_order={current_scene_order}"
            write_failure_notes.append(lock_note)
            failure_entries.append(lock_note)
        try:
            entries = load_entries_compat(project_root)
        except Exception as exc:  # noqa: BLE001
            fail_note = (
                "advisory_operation_failed "
                f"operation=load_entries_compat scene_id={current_scene_id} "
                f"scene_order={current_scene_order} error={exc}"
            )
            return None, MemoryLabRuntimeDiagnostics(
                memory_lab_enabled=True,
                used_legacy_continuity_only=False,
                current_scene_order=current_scene_order,
                lock_acquired=lock_state.lock_acquired,
                decay_events_written=0,
                reinforcement_events_written=0,
                revival_events_written=0,
                anchor_promotions=0,
                environment_tier=environment_tier,
                advisory_available=False,
                advisory_unavailable_reason_code="load_failed",
                resolver_decisions=[],
                slot_selection_diagnostics=[],
                decay_diagnostics=[],
                anchor_promotion_diagnostics=[],
                failure_entries=failure_entries + [fail_note],
                corruption_entries=corruption_entries,
                notes=write_failure_notes + [fail_note],
            )
        for corruption_note in detect_event_file_corruption(project_root):
            formatted = f"event_file_corruption {corruption_note}"
            write_failure_notes.append(formatted)
            corruption_entries.append(formatted)
        if not entries:
            return None, MemoryLabRuntimeDiagnostics(
                memory_lab_enabled=True,
                used_legacy_continuity_only=False,
                current_scene_order=current_scene_order,
                lock_acquired=lock_state.lock_acquired,
                decay_events_written=0,
                reinforcement_events_written=0,
                revival_events_written=0,
                anchor_promotions=0,
                environment_tier=environment_tier,
                advisory_available=False,
                advisory_unavailable_reason_code="no_entries",
                resolver_decisions=[],
                slot_selection_diagnostics=[],
                decay_diagnostics=[],
                anchor_promotion_diagnostics=[],
                failure_entries=failure_entries,
                corruption_entries=corruption_entries,
                notes=write_failure_notes + ["No ledger entries available."],
            )

        working_entries = entries
        mutations_enabled = lock_state.lock_is_effective
        if options.decay_enabled and mutations_enabled:
            working_entries, decay_events_written, decay_diagnostics, decay_failure_notes = _apply_decay_prepass(
                entries=entries,
                current_scene_id=current_scene_id,
                current_scene_order=current_scene_order,
                now_iso=effective_now_iso,
                options=options,
                project_root=project_root,
            )
            write_failure_notes.extend(decay_failure_notes)
            failure_entries.extend(decay_failure_notes)
        else:
            decay_diagnostics = _build_decay_disabled_diagnostics(
                entries=working_entries,
                current_scene_id=current_scene_id,
                reason=(
                    "lock_not_effective_mutations_disabled"
                    if options.decay_enabled and not mutations_enabled
                    else "decay_disabled"
                ),
            )

        resolve_started = perf_counter()
        try:
            packet, reasons = resolve_memory_packet(
                entries=working_entries,
                current_scene_id=current_scene_id,
                current_chapter_id=current_chapter_id,
                current_scene_order=current_scene_order,
                max_candidates=options.max_candidates,
                max_unresolved=options.max_unresolved,
                alternate_interpretation_threshold=options.alternate_interpretation_threshold,
                suppressed_fallback_enabled=options.decay_suppressed_fallback_enabled,
                low_confidence_fallback_threshold=options.decay_low_confidence_fallback_threshold,
            )
            resolve_duration_ms = (perf_counter() - resolve_started) * 1000.0
        except Exception as exc:  # noqa: BLE001
            fail_note = (
                "advisory_operation_failed "
                f"operation=resolve_memory_packet scene_id={current_scene_id} "
                f"scene_order={current_scene_order} error={exc}"
            )
            return None, MemoryLabRuntimeDiagnostics(
                memory_lab_enabled=True,
                used_legacy_continuity_only=False,
                current_scene_order=current_scene_order,
                lock_acquired=lock_state.lock_acquired,
                decay_events_written=decay_events_written,
                reinforcement_events_written=0,
                revival_events_written=0,
                anchor_promotions=0,
                environment_tier=environment_tier,
                advisory_available=False,
                advisory_unavailable_reason_code="resolve_failed",
                resolver_decisions=[],
                slot_selection_diagnostics=[],
                decay_diagnostics=decay_diagnostics,
                anchor_promotion_diagnostics=[],
                failure_entries=failure_entries + [fail_note],
                corruption_entries=corruption_entries,
                notes=notes + write_failure_notes + [fail_note],
            )
        baseline_packet = packet
        wave1_a1_enabled = is_a1_enabled(options)
        wave1_b1_enabled = is_b1_enabled(options)
        a1_duration_ms = 0.0
        a1_metrics: dict[str, float] = {
            "baseline_alternate_count": float(len(packet.alternate_interpretations_by_slot)),
            "experimental_alternate_count": float(len(packet.alternate_interpretations_by_slot)),
            "alternate_surfacing_delta": 0.0,
            "eligible_slots": 0.0,
            "added_slots": 0.0,
        }
        baseline_prompt_tokens = estimate_packet_prompt_tokens(baseline_packet)
        if wave1_a1_enabled:
            packet, a1_metrics, a1_duration_ms = apply_a1_exploration_pressure(
                packet=packet,
                entries=working_entries,
                alternate_interpretation_threshold=options.alternate_interpretation_threshold,
            )
        if not packet.selected_artifact_ids:
            return None, MemoryLabRuntimeDiagnostics(
                memory_lab_enabled=True,
                used_legacy_continuity_only=False,
                current_scene_order=current_scene_order,
                lock_acquired=lock_state.lock_acquired,
                decay_events_written=decay_events_written,
                reinforcement_events_written=0,
                revival_events_written=0,
                anchor_promotions=0,
                environment_tier=environment_tier,
                advisory_available=False,
                advisory_unavailable_reason_code="no_selected_artifacts",
                resolver_decisions=_build_resolver_decision_diagnostics(
                    entries=working_entries,
                    current_scene_id=current_scene_id,
                    current_chapter_id=current_chapter_id,
                    selected_artifact_ids=[],
                ),
                slot_selection_diagnostics=packet.selection_slot_diagnostics,
                decay_diagnostics=decay_diagnostics,
                anchor_promotion_diagnostics=[],
                failure_entries=failure_entries,
                corruption_entries=corruption_entries,
                notes=notes + write_failure_notes + ["Resolver returned no selected advisory artifacts."],
            )

        determinism_entries = working_entries
        if mutations_enabled:
            artifact_lookup: dict[str, MemoryArtifact] = {
                artifact.artifact_id: artifact
                for entry in working_entries
                for artifact in entry.artifacts
            }
            for slot_diag in packet.selection_slot_diagnostics:
                event = _build_contested_outcome_event(
                    slot_diag=slot_diag,
                    packet=packet,
                    current_chapter_id=current_chapter_id,
                    current_scene_order=current_scene_order,
                    effective_now_iso=effective_now_iso,
                    options=options,
                    winner_artifact=artifact_lookup.get(str(slot_diag.get("winner", ""))),
                )
                if event is None:
                    continue
                try:
                    append_contested_outcome_event_current(
                        project_root,
                        current_scene_id,
                        event,
                        retention_limit=options.contested_event_retention_limit,
                    )
                except Exception as exc:  # noqa: BLE001
                    fail_note = (
                        "append_contested_outcome_event_failed "
                        f"scene_id={current_scene_id} slot={event.slot_type} error={exc}"
                    )
                    write_failure_notes.append(fail_note)
                    failure_entries.append(fail_note)
        else:
            fail_note = "contested_event_write_skipped lock_not_effective_mutations_disabled"
            write_failure_notes.append(fail_note)
            failure_entries.append(fail_note)

        if options.reinforcement_enabled and mutations_enabled:
            (
                working_entries,
                reinforcement_events_written,
                revival_events_written,
                anchor_promotion_diagnostics,
                baseline_reinforcement_events,
                b1_stage_counts,
                b1_latency_ms,
                post_selection_failure_notes,
            ) = _apply_post_selection_updates(
                entries=working_entries,
                selected_artifact_ids=packet.selected_artifact_ids,
                current_scene_order=current_scene_order,
                now_iso=effective_now_iso,
                options=options,
                project_root=project_root,
                b1_enabled=wave1_b1_enabled,
            )
            write_failure_notes.extend(post_selection_failure_notes)
            failure_entries.extend(post_selection_failure_notes)
            anchor_promotions = len(anchor_promotion_diagnostics)
            # Persist updated entries after reinforcement/anchor promotion.
            for entry in working_entries:
                try:
                    write_entry_current(project_root, entry)
                except Exception as exc:  # noqa: BLE001
                    fail_note = f"write_entry_failed scene_id={entry.scene_id} error={exc}"
                    write_failure_notes.append(fail_note)
                    failure_entries.append(fail_note)
        elif options.reinforcement_enabled and not mutations_enabled:
            fail_note = "reinforcement_skipped lock_not_effective_mutations_disabled"
            write_failure_notes.append(fail_note)
            failure_entries.append(fail_note)
            baseline_reinforcement_events = 0
            b1_stage_counts = {"normal": 0, "diminishing": 0, "near_flat": 0}
            b1_latency_ms = 0.0
        else:
            baseline_reinforcement_events = 0
            b1_stage_counts = {"normal": 0, "diminishing": 0, "near_flat": 0}
            b1_latency_ms = 0.0

        if options.experimental_enabled:
            ensure_wave1_descriptors_registered()
            try:
                experimental_result = run_experimental_framework(
                    project_root=project_root,
                    options=options,
                    current_scene_id=current_scene_id,
                    current_scene_order=current_scene_order,
                )
                experimental_ran = experimental_result.ran_any_experiment
                experimental_blocked_experiments = list(experimental_result.blocked_experiments)
                experimental_outcomes = [
                    {"experiment_name": item.experiment_name, "decision": item.decision, "rationale": item.rationale}
                    for item in experimental_result.outcomes
                ]
                if experimental_result.violation_notes:
                    failure_entries.extend(experimental_result.violation_notes)
                    write_failure_notes.extend(experimental_result.violation_notes)
            except Exception as exc:  # noqa: BLE001
                fail_note = f"experimental_framework_failed scene_id={current_scene_id} error={exc}"
                failure_entries.append(fail_note)
                write_failure_notes.append(fail_note)

        wave1_active = wave1_a1_enabled or wave1_b1_enabled
        if wave1_active:
            deterministic_winner_drift = 0
            deterministic_alternate_drift = 0
            if environment_tier == "supported_deterministic":
                replay_packet, _replay_reasons = resolve_memory_packet(
                    entries=determinism_entries,
                    current_scene_id=current_scene_id,
                    current_chapter_id=current_chapter_id,
                    current_scene_order=current_scene_order,
                    max_candidates=options.max_candidates,
                    max_unresolved=options.max_unresolved,
                    alternate_interpretation_threshold=options.alternate_interpretation_threshold,
                    suppressed_fallback_enabled=options.decay_suppressed_fallback_enabled,
                    low_confidence_fallback_threshold=options.decay_low_confidence_fallback_threshold,
                )
                if wave1_a1_enabled:
                    replay_packet, _replay_a1_metrics, _replay_a1_ms = apply_a1_exploration_pressure(
                        packet=replay_packet,
                        entries=working_entries,
                        alternate_interpretation_threshold=options.alternate_interpretation_threshold,
                    )
                if replay_packet.selected_artifact_ids != packet.selected_artifact_ids:
                    deterministic_winner_drift = 1
                if replay_packet.alternate_interpretations_by_slot != packet.alternate_interpretations_by_slot:
                    deterministic_alternate_drift = 1

            experimental_prompt_tokens = estimate_packet_prompt_tokens(packet)
            prompt_growth = _relative_growth(experimental_prompt_tokens, baseline_prompt_tokens)
            event_growth = _relative_growth(reinforcement_events_written, baseline_reinforcement_events)
            latency_baseline_ms = max(resolve_duration_ms, 1.0)
            b1_latency_growth = _relative_growth(b1_latency_ms, latency_baseline_ms)
            combined_latency_growth = _relative_growth(a1_duration_ms + b1_latency_ms, latency_baseline_ms)

            wave1_metric_values: dict[str, float] = {
                "a1.alternate_surfacing_delta": float(a1_metrics.get("alternate_surfacing_delta", 0.0)),
                "a1.prompt_token_growth": float(prompt_growth if wave1_a1_enabled else 0.0),
                "b1.event_growth": float(event_growth if wave1_b1_enabled else 0.0),
                "b1.latency_growth": float(b1_latency_growth if wave1_b1_enabled else 0.0),
                "b1.prompt_growth_from_saturation_logic": 0.0,
                "combined.prompt_growth": float(prompt_growth),
                "combined.event_growth": float(event_growth),
                "combined.latency_growth": float(combined_latency_growth),
                "determinism.winner_drift_count": float(deterministic_winner_drift),
                "determinism.alternate_drift_count": float(deterministic_alternate_drift),
            }
            experimental_guardrail_passed, experimental_guardrail_violations = evaluate_wave1_guardrails(
                wave1_metric_values,
                a1_enabled=wave1_a1_enabled,
                b1_enabled=wave1_b1_enabled,
            )
            if experimental_guardrail_violations:
                for violation in experimental_guardrail_violations:
                    violation_note = f"wave1_guardrail_violation {violation}"
                    failure_entries.append(violation_note)
                    write_failure_notes.append(violation_note)

            experimental_metrics = {
                "wave_id": "phase7b-wave1",
                "a1_enabled": wave1_a1_enabled,
                "b1_enabled": wave1_b1_enabled,
                "measurements": wave1_metric_values,
                "a1": {
                    **a1_metrics,
                    "baseline_prompt_tokens": baseline_prompt_tokens,
                    "experimental_prompt_tokens": experimental_prompt_tokens,
                },
                "b1": {
                    "baseline_reinforcement_events": baseline_reinforcement_events,
                    "experimental_reinforcement_events": reinforcement_events_written,
                    "stage_counts": b1_stage_counts,
                    "latency_ms": b1_latency_ms,
                },
                "combined": {
                    "a1_latency_ms": a1_duration_ms,
                    "b1_latency_ms": b1_latency_ms,
                    "resolve_latency_ms": resolve_duration_ms,
                },
                "guardrail_passed": experimental_guardrail_passed,
                "guardrail_violations": list(experimental_guardrail_violations),
            }
            try:
                append_wave1_metrics_log(project_root=project_root, payload=experimental_metrics)
            except Exception as exc:  # noqa: BLE001
                fail_note = f"wave1_metrics_log_failed scene_id={current_scene_id} error={exc}"
                failure_entries.append(fail_note)
                write_failure_notes.append(fail_note)
        else:
            experimental_metrics = {}
            experimental_guardrail_passed = None
            experimental_guardrail_violations = []

        return packet, MemoryLabRuntimeDiagnostics(
            memory_lab_enabled=True,
            used_legacy_continuity_only=False,
            current_scene_order=current_scene_order,
            lock_acquired=lock_state.lock_acquired,
            decay_events_written=decay_events_written,
            reinforcement_events_written=reinforcement_events_written,
            revival_events_written=revival_events_written,
            anchor_promotions=anchor_promotions,
            environment_tier=environment_tier,
            advisory_available=True,
            advisory_unavailable_reason_code=None,
            experimental_framework_enabled=options.experimental_enabled,
            experimental_ran=experimental_ran,
            experimental_blocked_experiments=experimental_blocked_experiments,
            experimental_outcomes=experimental_outcomes,
            experimental_metrics=experimental_metrics,
            experimental_guardrail_passed=experimental_guardrail_passed,
            experimental_guardrail_violations=experimental_guardrail_violations,
            resolver_decisions=_build_resolver_decision_diagnostics(
                entries=working_entries,
                current_scene_id=current_scene_id,
                current_chapter_id=current_chapter_id,
                selected_artifact_ids=packet.selected_artifact_ids,
            ),
            slot_selection_diagnostics=packet.selection_slot_diagnostics,
            decay_diagnostics=decay_diagnostics,
            anchor_promotion_diagnostics=anchor_promotion_diagnostics,
            failure_entries=failure_entries,
            corruption_entries=corruption_entries,
            notes=(
                notes
                + (
                    [
                        (
                            f"debug: candidates_limit={options.max_candidates} "
                            f"max_unresolved={options.max_unresolved} "
                            f"decay_enabled={options.decay_enabled} "
                            f"reinforcement_enabled={options.reinforcement_enabled}"
                        )
                    ]
                    if options.debug_logging
                    else []
                )
                + write_failure_notes
            ),
        )


def _environment_tier_from_lock(lock_mode: str, lock_is_effective: bool) -> str:
    if lock_is_effective and lock_mode in _SUPPORTED_DETERMINISTIC_LOCK_MODES:
        return "supported_deterministic"
    return "best_effort"


def _apply_decay_prepass(
    *,
    entries,
    current_scene_id: str,
    current_scene_order: int,
    now_iso: str,
    options: MemoryLabRuntimeOptions,
    project_root: Path,
) -> tuple[list, int, list[DecayDiagnostic], list[str]]:
    updated_entries = []
    events_written = 0
    diagnostics: list[DecayDiagnostic] = []
    failure_notes: list[str] = []
    for entry in entries:
        entry_changed = False
        updated_artifacts: list[MemoryArtifact] = []
        entry_events: list[DecayEvent] = []
        for artifact in entry.artifacts:
            if artifact.scene_id == current_scene_id:
                updated_artifacts.append(artifact)
                diagnostics.append(
                    DecayDiagnostic(
                        artifact_id=artifact.artifact_id,
                        decay_skipped=True,
                        decay_skip_reason="current_scene_excluded",
                        old_status=artifact.status,
                        new_status=artifact.status,
                        old_weight=artifact.weight,
                        new_weight=artifact.weight,
                    )
                )
                continue
            try:
                updated_artifact, events = apply_decay_to_artifact(
                    artifact,
                    current_scene_order=current_scene_order,
                    now_iso=now_iso,
                    artifact_scene_order=artifact.recency_order,
                    base_decay_rate=options.decay_base_rate,
                    min_weight=options.decay_min_weight,
                    fading_threshold=options.decay_fading_threshold,
                    suppressed_threshold=options.decay_suppressed_threshold,
                    archived_threshold=options.decay_archived_threshold,
                    log_anchor_protection=options.decay_log_anchor_protection,
                )
            except Exception as exc:  # noqa: BLE001
                failure_notes.append(
                    f"decay_apply_failed artifact_id={artifact.artifact_id} scene_id={entry.scene_id} error={exc}"
                )
                updated_artifact = artifact
                events = []
            updated_artifacts.append(updated_artifact)
            diagnostics.append(
                DecayDiagnostic(
                    artifact_id=artifact.artifact_id,
                    decay_skipped=(updated_artifact == artifact),
                    decay_skip_reason=_derive_decay_skip_reason(artifact, updated_artifact, current_scene_order),
                    old_status=artifact.status,
                    new_status=updated_artifact.status,
                    old_weight=artifact.weight,
                    new_weight=updated_artifact.weight,
                )
            )
            if updated_artifact != artifact:
                entry_changed = True
            if events:
                entry_events.extend(events)
        updated_entry = replace(entry, artifacts=updated_artifacts) if entry_changed else entry
        updated_entries.append(updated_entry)
        if entry_changed:
            try:
                write_entry_current(project_root, updated_entry)
            except Exception as exc:  # noqa: BLE001
                failure_notes.append(
                    f"write_entry_failed scene_id={updated_entry.scene_id} error={exc}"
                )
        for event in entry_events:
            try:
                append_decay_event_current(
                    project_root,
                    event,
                    retention_limit=options.decay_event_retention_limit,
                )
                events_written += 1
            except Exception as exc:  # noqa: BLE001
                failure_notes.append(
                    f"append_decay_event_failed artifact_id={event.artifact_id} event_type={event.event_type} error={exc}"
                )
    return updated_entries, events_written, diagnostics, failure_notes


def _apply_post_selection_updates(
    *,
    entries,
    selected_artifact_ids: list[str],
    current_scene_order: int,
    now_iso: str,
    options: MemoryLabRuntimeOptions,
    project_root: Path,
    b1_enabled: bool,
) -> tuple[list, int, int, list[AnchorPromotionDiagnostic], int, dict[str, int], float, list[str]]:
    artifact_locations: dict[str, tuple[int, int]] = {}
    for entry_index, entry in enumerate(entries):
        for artifact_index, artifact in enumerate(entry.artifacts):
            artifact_locations[artifact.artifact_id] = (entry_index, artifact_index)

    updated_entries = list(entries)
    reinforcement_events_written = 0
    baseline_reinforcement_events = 0
    revival_events_written = 0
    anchor_promotion_diagnostics: list[AnchorPromotionDiagnostic] = []
    failure_notes: list[str] = []
    b1_stage_counts = {"normal": 0, "diminishing": 0, "near_flat": 0}
    b1_overhead_ms = 0.0

    for artifact_id in selected_artifact_ids:
        try:
            location = artifact_locations.get(artifact_id)
            if location is None:
                continue
            entry_index, artifact_index = location
            artifacts = list(updated_entries[entry_index].artifacts)
            original = artifacts[artifact_index]
            if original.status == "archived":
                continue
            if original.last_reinforced_scene_order == current_scene_order:
                continue
            baseline_reinforcement_events += 1

            selected_updated = replace(
                original,
                selection_count=original.selection_count + 1,
                last_selected_at=now_iso,
                last_touch_scene_order=current_scene_order,
            )
            applied_delta = selection_delta()
            if b1_enabled:
                b1_started = perf_counter()
                applied_delta, stage = b1_saturated_selection_delta(
                    original,
                    baseline_delta=applied_delta,
                )
                b1_overhead_ms += (perf_counter() - b1_started) * 1000.0
                b1_stage_counts[stage] = b1_stage_counts.get(stage, 0) + 1
            else:
                b1_stage_counts["normal"] = b1_stage_counts.get("normal", 0) + 1
            reinforced, reinforcement_event = reinforce_artifact(
                selected_updated,
                delta=applied_delta,
                event_type="selection",
                now_iso=now_iso,
                weight_max=options.weight_max,
            )
            reinforced = replace(
                reinforced,
                last_reinforced_scene_order=current_scene_order,
            )

            try:
                append_reinforcement_event_current(
                    project_root,
                    replace(
                        reinforcement_event,
                        event_id=_build_deterministic_event_id(
                            artifact_id=artifact_id,
                            created_at=now_iso,
                            event_type="selection",
                        ),
                    ),
                    retention_limit=options.reinforcement_event_retention_limit,
                )
                reinforcement_events_written += 1
            except Exception as exc:  # noqa: BLE001
                failure_notes.append(
                    f"append_reinforcement_event_failed artifact_id={artifact_id} event_type=selection error={exc}"
                )

            if options.decay_allow_revival and is_revival_candidate(original):
                revived_status = derive_memory_status(
                    reinforced.weight,
                    fading_threshold=options.decay_fading_threshold,
                    suppressed_threshold=options.decay_suppressed_threshold,
                    archived_threshold=options.decay_archived_threshold,
                )
                if _status_rank(revived_status) > _status_rank(original.status):
                    revival_event = DecayEvent(
                        event_id=_build_deterministic_event_id(
                            artifact_id=artifact_id,
                            created_at=now_iso,
                            event_type="revived",
                            prefix="de",
                        ),
                        schema_version=MEMORY_DECAY_EVENT_SCHEMA_VERSION,
                        artifact_id=artifact_id,
                        event_type="revived",
                        old_weight=original.weight,
                        new_weight=reinforced.weight,
                        old_status=original.status,
                        new_status=revived_status,
                        scene_order=current_scene_order,
                        created_at=now_iso,
                        notes="revived after selection",
                    )
                    try:
                        append_decay_event_current(
                            project_root,
                            revival_event,
                            retention_limit=options.decay_event_retention_limit,
                        )
                        revival_events_written += 1
                    except Exception as exc:  # noqa: BLE001
                        failure_notes.append(
                            f"append_decay_event_failed artifact_id={artifact_id} event_type=revived error={exc}"
                        )
                    reinforced = replace(
                        reinforced,
                        status=revived_status,
                        last_revived_scene_order=current_scene_order,
                        revival_grace_until_scene_order=current_scene_order + 1,
                    )

            if options.anchor_enabled and not reinforced.is_anchor and is_anchor_candidate(
                reinforced,
                min_threshold=options.anchor_auto_threshold,
            ):
                reason = f"auto-promoted after reinforcement threshold ({options.anchor_auto_threshold})"
                reinforced = promote_anchor_candidate(reinforced, reason)
                anchor_promotion_diagnostics.append(
                    AnchorPromotionDiagnostic(
                        artifact_id=reinforced.artifact_id,
                        threshold_used=options.anchor_auto_threshold,
                        selection_count=reinforced.selection_count,
                        reinforcement_count=reinforced.reinforcement_count,
                        reason=reason,
                    )
                )

            artifacts[artifact_index] = reinforced
            updated_entries[entry_index] = replace(updated_entries[entry_index], artifacts=artifacts)
        except Exception as exc:  # noqa: BLE001
            failure_notes.append(
                f"post_selection_update_failed artifact_id={artifact_id} error={exc}"
            )

    return (
        updated_entries,
        reinforcement_events_written,
        revival_events_written,
        anchor_promotion_diagnostics,
        baseline_reinforcement_events,
        b1_stage_counts,
        b1_overhead_ms,
        failure_notes,
    )


def _build_deterministic_event_id(
    *,
    artifact_id: str,
    created_at: str,
    event_type: str,
    prefix: str = "re",
) -> str:
    digest = sha256(f"{artifact_id}:{event_type}:{created_at}".encode("utf-8")).hexdigest()[:12]
    return f"{prefix}_{digest}"


def _relative_growth(current: float, baseline: float) -> float:
    baseline_value = float(baseline)
    if baseline_value <= 0.0:
        return 0.0 if float(current) <= 0.0 else 1.0
    return max(0.0, (float(current) - baseline_value) / baseline_value)


def _status_rank(status: str) -> int:
    if status == "archived":
        return 0
    if status == "suppressed":
        return 1
    if status == "fading":
        return 2
    if status == "active":
        return 3
    return -1


def _derive_decay_skip_reason(
    original: MemoryArtifact,
    updated: MemoryArtifact,
    current_scene_order: int,
) -> str | None:
    if original != updated:
        return None
    if original.last_decay_scene_order == current_scene_order:
        return "already_processed_this_scene"
    if original.status == "archived":
        return "artifact_archived"
    if original.is_anchor:
        return "anchor_protected"
    return "no_effective_change"


def _build_decay_disabled_diagnostics(
    *,
    entries,
    current_scene_id: str,
    reason: str = "decay_disabled",
) -> list[DecayDiagnostic]:
    diagnostics: list[DecayDiagnostic] = []
    for entry in entries:
        for artifact in entry.artifacts:
            if artifact.scene_id == current_scene_id:
                continue
            diagnostics.append(
                DecayDiagnostic(
                    artifact_id=artifact.artifact_id,
                    decay_skipped=True,
                    decay_skip_reason=reason,
                    old_status=artifact.status,
                    new_status=artifact.status,
                    old_weight=artifact.weight,
                    new_weight=artifact.weight,
                )
            )
    return diagnostics


def _build_resolver_decision_diagnostics(
    *,
    entries,
    current_scene_id: str,
    current_chapter_id: str | None,
    selected_artifact_ids: list[str],
) -> list[ResolverDecisionDiagnostic]:
    artifacts = [
        artifact
        for entry in entries
        for artifact in entry.artifacts
        if artifact.scene_id != current_scene_id
        if artifact.status != "archived"
    ]
    if not artifacts:
        return []
    max_recency_order = max((artifact.recency_order for artifact in artifacts), default=0)
    selected_set = set(selected_artifact_ids)
    diagnostics: list[ResolverDecisionDiagnostic] = []
    for artifact in artifacts:
        total, relevance, recency, _weight, _confidence, _anchor, _reinforcement = compute_total_score(
            artifact,
            current_chapter_id=current_chapter_id,
            max_recency_order=max_recency_order,
        )
        diagnostics.append(
            ResolverDecisionDiagnostic(
                artifact_id=artifact.artifact_id,
                selected=artifact.artifact_id in selected_set,
                status_multiplier_used=compute_status_multiplier(artifact),
                suppressed_fallback_used=(artifact.status == "suppressed" and artifact.artifact_id in selected_set),
                tie_break_tuple=(
                    -total,
                    -float(1 if artifact.is_anchor else 0),
                    -float(_effective_recency_priority(artifact)),
                    -float(artifact.reinforcement_count),
                    artifact.artifact_id,
                ),
                tie_break_rationale="sorted by (-final_total, -anchor_status, -recency, -reinforcement_count, artifact_id)",
            )
        )
    return diagnostics


def _effective_recency_priority(artifact: MemoryArtifact) -> int:
    if artifact.last_touch_scene_order is not None:
        return int(artifact.last_touch_scene_order)
    if int(artifact.recency_order) > 0:
        return int(artifact.recency_order)
    if artifact.artifact_scene_order is not None:
        return int(artifact.artifact_scene_order)
    return -1


def _build_contested_outcome_event(
    *,
    slot_diag: dict[str, object],
    packet: ResolvedMemoryPacket,
    current_chapter_id: str | None,
    current_scene_order: int,
    effective_now_iso: str,
    options: MemoryLabRuntimeOptions,
    winner_artifact: MemoryArtifact | None,
) -> ContestedOutcomeEvent | None:
    slot = slot_diag.get("slot")
    winner = slot_diag.get("winner")
    if not isinstance(slot, str) or not isinstance(winner, str):
        return None
    tie_break = slot_diag.get("tie_break_tuple")
    tie_break_basis = repr(tie_break) if tie_break is not None else None
    runner_up = slot_diag.get("top_loser")
    delta = slot_diag.get("score_delta")
    runner_up_id = runner_up if isinstance(runner_up, str) else None
    score_delta = float(delta) if isinstance(delta, (int, float)) else None
    winner_score = None
    if isinstance(tie_break, tuple) and tie_break:
        first = tie_break[0]
        if isinstance(first, (int, float)):
            winner_score = -float(first)
    if winner_score is None:
        return None
    contested_key = _canonical_contested_key(winner_artifact, current_chapter_id=current_chapter_id)
    if contested_key is None:
        contested_key = ""
    digest = sha256(
        f"{slot}:{winner}:{runner_up_id}:{current_scene_order}:{effective_now_iso}".encode("utf-8")
    ).hexdigest()[:12]
    return ContestedOutcomeEvent(
        event_id=f"co_{digest}",
        schema_version=MEMORY_CONTESTED_EVENT_SCHEMA_VERSION,
        created_at=effective_now_iso,
        scene_order=current_scene_order,
        chapter_id=current_chapter_id,
        slot_type=slot,
        contested_key=contested_key,
        winner_artifact_id=winner,
        winner_score=winner_score,
        runner_up_artifact_id=runner_up_id,
        runner_up_score=(winner_score - score_delta) if score_delta is not None else None,
        score_delta=score_delta,
        alternate_included=bool(packet.alternate_interpretations_by_slot.get(slot)),
        alternate_threshold=float(options.alternate_interpretation_threshold),
        fallback_used=bool(slot_diag.get("used_fallback", False)),
        tie_break_applied=bool(tie_break is not None),
        tie_break_basis=tie_break_basis,
    )


def _normalize_key_part(value: str | None) -> str:
    if value is None:
        return ""
    lowered = value.strip().lower()
    return re.sub(r"\s+", " ", lowered)


def _canonical_contested_key(
    artifact: MemoryArtifact | None,
    *,
    current_chapter_id: str | None,
) -> str | None:
    if artifact is None:
        return None
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
