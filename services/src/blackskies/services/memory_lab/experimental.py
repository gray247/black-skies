"""Phase 7A experimental framework guards (no experimental behaviors yet)."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path

from .options import MemoryLabRuntimeOptions


@dataclass(frozen=True)
class ExperimentDescriptor:
    name: str
    hypothesis: str
    metrics: tuple[str, ...]
    guardrails: tuple[str, ...]
    regression_budget: dict[str, float]
    success_criteria: tuple[str, ...]
    requires_core_contract_mutation: bool = False
    requires_prompt_contract_mutation: bool = False
    requires_canonical_mutation: bool = False


@dataclass(frozen=True)
class ExperimentOutcome:
    experiment_name: str
    decision: str  # promote|defer|kill
    rationale: str


@dataclass(frozen=True)
class ExperimentEvaluationInput:
    no_canon_mutation: bool
    deterministic_gates_passed: bool
    prompt_budget_ok: bool
    event_growth_ok: bool
    diagnostics_slo_ok: bool
    meaningful_improvement: bool
    isolation_violation: bool = False
    blocker_drift: bool = False
    needs_unapproved_semantic_change: bool = False


@dataclass(frozen=True)
class ExperimentalExecutionResult:
    ran_any_experiment: bool
    blocked_experiments: list[str]
    outcomes: list[ExperimentOutcome]
    violation_notes: list[str]


_REGISTRY: dict[str, ExperimentDescriptor] = {}


def register_experiment(descriptor: ExperimentDescriptor) -> None:
    _REGISTRY[descriptor.name] = descriptor


def unregister_experiment(name: str) -> None:
    _REGISTRY.pop(name, None)


def clear_experiment_registry() -> None:
    _REGISTRY.clear()


def get_experiment_descriptor(name: str) -> ExperimentDescriptor | None:
    return _REGISTRY.get(name)


def list_registered_experiments() -> tuple[str, ...]:
    return tuple(sorted(_REGISTRY.keys()))


def evaluate_experiment_outcome(inp: ExperimentEvaluationInput) -> str:
    if inp.isolation_violation or inp.blocker_drift or inp.needs_unapproved_semantic_change:
        return "kill"
    if (
        inp.no_canon_mutation
        and inp.deterministic_gates_passed
        and inp.prompt_budget_ok
        and inp.event_growth_ok
        and inp.diagnostics_slo_ok
        and inp.meaningful_improvement
    ):
        return "promote"
    return "defer"


def run_experimental_framework(
    *,
    project_root: Path,
    options: MemoryLabRuntimeOptions,
    current_scene_id: str,
    current_scene_order: int,
) -> ExperimentalExecutionResult:
    if not options.experimental_enabled:
        return ExperimentalExecutionResult(
            ran_any_experiment=False,
            blocked_experiments=[],
            outcomes=[],
            violation_notes=[],
        )

    active_names = tuple(name for name in options.experimental_active_experiments if name)
    if not active_names:
        return ExperimentalExecutionResult(
            ran_any_experiment=False,
            blocked_experiments=[],
            outcomes=[],
            violation_notes=[],
        )

    blocked: list[str] = []
    outcomes: list[ExperimentOutcome] = []
    violations: list[str] = []

    for experiment_name in active_names:
        descriptor = get_experiment_descriptor(experiment_name)
        if descriptor is None:
            note = f"experimental_missing_descriptor name={experiment_name}"
            violations.append(note)
            blocked.append(experiment_name)
            if options.experimental_log_events:
                _append_experiment_log(
                    project_root=project_root,
                    payload={
                        "timestamp": datetime.now(UTC).isoformat(),
                        "event_type": "experiment_blocked",
                        "scene_id": current_scene_id,
                        "scene_order": current_scene_order,
                        "experiment_name": experiment_name,
                        "reason": "missing_descriptor",
                    },
                )
            if options.experimental_fail_closed:
                continue
            continue

        if _descriptor_violates_isolation(descriptor):
            note = f"experimental_isolation_violation name={experiment_name}"
            violations.append(note)
            blocked.append(experiment_name)
            if options.experimental_log_events:
                _append_experiment_log(
                    project_root=project_root,
                    payload={
                        "timestamp": datetime.now(UTC).isoformat(),
                        "event_type": "experiment_blocked",
                        "scene_id": current_scene_id,
                        "scene_order": current_scene_order,
                        "experiment_name": experiment_name,
                        "reason": "isolation_violation",
                        "descriptor": asdict(descriptor),
                    },
                )
            continue

        # 7A intentionally does not execute behavioral experiments; it only validates framework contracts.
        outcome = ExperimentOutcome(
            experiment_name=experiment_name,
            decision="defer",
            rationale="phase7a_framework_only_no_behavior_execution",
        )
        outcomes.append(outcome)
        if options.experimental_log_events:
            _append_experiment_log(
                project_root=project_root,
                payload={
                    "timestamp": datetime.now(UTC).isoformat(),
                    "event_type": "experiment_start",
                    "scene_id": current_scene_id,
                    "scene_order": current_scene_order,
                    "experiment_name": experiment_name,
                },
            )
            _append_experiment_log(
                project_root=project_root,
                payload={
                    "timestamp": datetime.now(UTC).isoformat(),
                    "event_type": "experiment_end",
                    "scene_id": current_scene_id,
                    "scene_order": current_scene_order,
                    "experiment_name": experiment_name,
                    "decision": outcome.decision,
                    "rationale": outcome.rationale,
                },
            )

    return ExperimentalExecutionResult(
        ran_any_experiment=bool(outcomes),
        blocked_experiments=blocked,
        outcomes=outcomes,
        violation_notes=violations,
    )


def _descriptor_violates_isolation(descriptor: ExperimentDescriptor) -> bool:
    return bool(
        descriptor.requires_core_contract_mutation
        or descriptor.requires_prompt_contract_mutation
        or descriptor.requires_canonical_mutation
    )


def _append_experiment_log(*, project_root: Path, payload: dict[str, object]) -> None:
    target = project_root / ".blackskies" / "memory_lab" / "experimental" / "experiment_runs.log"
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, sort_keys=True))
        handle.write("\n")
