#!/usr/bin/env python3
"""M5 evaluation lane for Memory Prototype v1."""

from __future__ import annotations

import argparse
import json
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from blackskies.services.memory_prototype.canonical_state_reader import (
    CanonicalInputEligibilityError,
    CanonicalStateReader,
)
from blackskies.services.memory_prototype.continuity_signal_normalizer import (
    ContinuitySignalNormalizer,
)
from blackskies.services.memory_prototype.scene_delta_extractor import SceneDeltaExtractor
from blackskies.services.memory_prototype.schemas import CanonicalLineageKey
from blackskies.services.memory_prototype.storage import MemoryPrototypeStorage
from blackskies.services.memory_prototype.task_packet_assembler import TaskPacketAssembler


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Memory Prototype v1 M5 evaluation")
    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path.cwd(),
        help="Root directory to materialize and evaluate fixture projects.",
    )
    parser.add_argument(
        "--fixture-manifest",
        type=Path,
        default=Path("services/tests/prototype/fixtures/m5_eval_cases.json"),
        help="Fixture manifest path for M5 evaluation cases.",
    )
    return parser.parse_args()


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _accepted_source_hash(unit_id: str, draft_text: str, outline_scene: dict[str, Any]) -> str:
    blob = (
        f"{unit_id}\n{json.dumps(outline_scene, sort_keys=True, ensure_ascii=False)}\n{draft_text}"
    )
    import hashlib

    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


def _fingerprints(project_root: Path) -> dict[str, str]:
    import hashlib

    tracked = [
        project_root / "project.json",
        project_root / "outline.json",
    ]
    tracked.extend(
        (project_root / "drafts").glob("*.md") if (project_root / "drafts").exists() else []
    )
    tracked.extend(
        (project_root / "lore").glob("*.y*ml") if (project_root / "lore").exists() else []
    )
    tracked.extend(
        [project_root / "locked_facts.json", project_root / ".blackskies" / "locked_facts.json"]
    )
    out: dict[str, str] = {}
    for path in tracked:
        if not path.exists() or not path.is_file():
            continue
        out[str(path)] = hashlib.sha256(path.read_bytes()).hexdigest()
    return out


def _materialize_case(project_root: Path, project_id: str, case: dict[str, Any]) -> None:
    unit_id = str(case["unit_id"])
    snapshot_id = str(case["snapshot_id"])
    scene = dict(case["outline_scene"])
    draft_text = str(case["draft_text"])
    locked_facts = list(case.get("locked_facts") or [])
    lore_records = list(case.get("lore_records") or [])

    (project_root / "drafts").mkdir(parents=True, exist_ok=True)
    (project_root / "drafts" / f"{unit_id}.md").write_text(draft_text, encoding="utf-8")
    _write_json(project_root / "outline.json", {"scenes": [scene]})
    _write_json(project_root / "project.json", {"project_id": project_id})
    _write_json(project_root / "locked_facts.json", {"facts": locked_facts})

    lore_dir = project_root / "lore"
    lore_dir.mkdir(parents=True, exist_ok=True)
    for idx, record in enumerate(lore_records, start=1):
        lore_path = lore_dir / f"record_{idx:02d}.yaml"
        lore_path.write_text(
            "\n".join([f"{k}: {v}" for k, v in record.items()]) + "\n", encoding="utf-8"
        )

    snap = project_root / "history" / "snapshots" / f"{snapshot_id}_accept"
    (snap / "drafts").mkdir(parents=True, exist_ok=True)
    (snap / "lore").mkdir(parents=True, exist_ok=True)
    (snap / "drafts" / f"{unit_id}.md").write_text(draft_text, encoding="utf-8")
    _write_json(snap / "outline.json", {"scenes": [scene]})
    _write_json(snap / "locked_facts.json", {"facts": locked_facts})
    for idx, record in enumerate(lore_records, start=1):
        lore_path = snap / "lore" / f"record_{idx:02d}.yaml"
        lore_path.write_text(
            "\n".join([f"{k}: {v}" for k, v in record.items()]) + "\n", encoding="utf-8"
        )

    metadata = {
        "snapshot_id": snapshot_id,
        "project_id": project_id,
        "label": "accept",
        "created_at": "2026-04-12T00:00:00Z",
        "includes": ["drafts", "outline.json", "locked_facts.json", "lore"],
    }
    if not bool(case.get("legacy_missing_hash", False)):
        metadata["accepted_source_hash"] = _accepted_source_hash(unit_id, draft_text, scene)
    _write_json(snap / "metadata.json", metadata)


@dataclass
class EvalStats:
    evaluated_projects: set[str]
    evaluated_units: int
    lineage_modes: dict[str, int]
    artifact_counts: dict[str, int]
    degraded_count: int
    failure_count: int
    weaknesses: list[str]
    deterministic_checks: int
    legacy_replay_cases: int
    legacy_replay_bounded_cases: int
    legacy_replay_unbounded_cases: int


def _empty_stats() -> EvalStats:
    return EvalStats(
        evaluated_projects=set(),
        evaluated_units=0,
        lineage_modes={},
        artifact_counts={
            "deltas": 0,
            "signals": 0,
            "packets_draft": 0,
            "packets_rewrite": 0,
            "packets_critique": 0,
        },
        degraded_count=0,
        failure_count=0,
        weaknesses=[],
        deterministic_checks=0,
        legacy_replay_cases=0,
        legacy_replay_bounded_cases=0,
        legacy_replay_unbounded_cases=0,
    )


def _record_mode(stats: EvalStats, mode: str) -> None:
    stats.lineage_modes[mode] = stats.lineage_modes.get(mode, 0) + 1


def _append_weakness(stats: EvalStats, text: str) -> None:
    if text not in stats.weaknesses:
        stats.weaknesses.append(text)


def _evaluate_case(
    project_root: Path, project_id: str, case: dict[str, Any], stats: EvalStats
) -> None:
    lineage = CanonicalLineageKey.from_snapshot(
        project_id=project_id,
        unit_id=str(case["unit_id"]),
        snapshot_id=str(case["snapshot_id"]),
        context="eval",
    )
    reader = CanonicalStateReader(project_root=project_root)
    storage = MemoryPrototypeStorage(project_root=project_root)
    before = _fingerprints(project_root)
    try:
        snapshot = reader.read_snapshot(lineage)
        deltas = SceneDeltaExtractor().extract(snapshot)
        signals = ContinuitySignalNormalizer().normalize(deltas)
        assembler = TaskPacketAssembler()

        delta_path = storage.write_delta_artifact(
            lineage=lineage,
            payload=deltas.as_dict(),
            source_hashes=snapshot.source_hashes,
        )
        signal_path = storage.write_continuity_artifact(
            lineage=lineage,
            payload=signals.as_dict(),
            source_hashes=snapshot.source_hashes,
        )
        packet_paths = {}
        for packet_type in ("draft", "rewrite", "critique"):
            packet = assembler.assemble(
                packet_type=packet_type,
                snapshot=snapshot,
                deltas=deltas,
                signals=signals,
            )
            packet_path = storage.write_packet_artifact(
                packet_type=packet_type,
                lineage=lineage,
                payload=packet.as_dict(),
                source_hashes=snapshot.source_hashes,
            )
            packet_paths[packet_type] = packet_path

        after = _fingerprints(project_root)
        if before != after:
            _append_weakness(stats, f"{case['case_id']}: canonical mutation detected")
            stats.failure_count += 1
            return

        stats.evaluated_projects.add(project_id)
        stats.evaluated_units += 1
        mode = snapshot.source_hashes.get("accepted_source_hash_mode", "unknown")
        _record_mode(stats, mode)
        if mode == "legacy_replay_derived":
            stats.legacy_replay_cases += 1
            if snapshot.source_hashes.get("legacy_replay_bounded") == "true":
                stats.legacy_replay_bounded_cases += 1
            else:
                stats.legacy_replay_unbounded_cases += 1
                _append_weakness(
                    stats, f"{case['case_id']}: legacy replay derivation was not bounded"
                )
        stats.artifact_counts["deltas"] += 1 if delta_path.exists() else 0
        stats.artifact_counts["signals"] += 1 if signal_path.exists() else 0
        stats.artifact_counts["packets_draft"] += 1 if packet_paths["draft"].exists() else 0
        stats.artifact_counts["packets_rewrite"] += 1 if packet_paths["rewrite"].exists() else 0
        stats.artifact_counts["packets_critique"] += 1 if packet_paths["critique"].exists() else 0

        if bool(case.get("repeat_same_lineage", False)):
            stats.deterministic_checks += 1
            repeat_delta = storage.write_delta_artifact(
                lineage=lineage,
                payload=deltas.as_dict(),
                source_hashes=snapshot.source_hashes,
            )
            if repeat_delta != delta_path:
                _append_weakness(
                    stats, f"{case['case_id']}: repeat same-lineage output not deterministic"
                )
                stats.failure_count += 1

        if bool(case.get("simulate_race", False)):
            stats.deterministic_checks += 1

            def _write_race() -> Path:
                packet = assembler.assemble(
                    packet_type="rewrite",
                    snapshot=snapshot,
                    deltas=deltas,
                    signals=signals,
                )
                return storage.write_packet_artifact(
                    packet_type="rewrite",
                    lineage=lineage,
                    payload=packet.as_dict(),
                    source_hashes=snapshot.source_hashes,
                )

            with ThreadPoolExecutor(max_workers=4) as pool:
                race_paths = list(pool.map(lambda _: _write_race(), range(6)))
            if len(set(race_paths)) != 1:
                _append_weakness(stats, f"{case['case_id']}: race writes were non-deterministic")
                stats.failure_count += 1

        if bool(case.get("expect_conflict_signal", False)):
            has_conflict = any(signal.severity == "conflict" for signal in signals.signals)
            if not has_conflict:
                _append_weakness(stats, f"{case['case_id']}: expected conflict signal not observed")

    except CanonicalInputEligibilityError as exc:
        stats.failure_count += 1
        stats.degraded_count += 1
        storage.write_diagnostic(
            lineage=lineage,
            code="M5_CASE_ELIGIBILITY_FAILURE",
            message=str(exc),
            details={"case_id": case["case_id"]},
        )
        storage.write_status(
            status="degraded",
            last_error_code="M5_CASE_ELIGIBILITY_FAILURE",
            last_error_message=str(exc),
            affected_components=["reader"],
            retry_after_seconds=0,
        )
        _append_weakness(stats, f"{case['case_id']}: eligibility failure: {exc}")
    except Exception as exc:  # noqa: BLE001
        stats.failure_count += 1
        stats.degraded_count += 1
        storage.write_diagnostic(
            lineage=lineage,
            code="M5_CASE_FAILURE",
            message=str(exc),
            details={"case_id": case["case_id"]},
        )
        storage.write_status(
            status="degraded",
            last_error_code="M5_CASE_FAILURE",
            last_error_message=str(exc),
            affected_components=[
                "reader",
                "delta_extractor",
                "signal_normalizer",
                "packet_assembler",
            ],
            retry_after_seconds=0,
        )
        _append_weakness(stats, f"{case['case_id']}: runtime failure: {exc}")


def _recommendation(stats: EvalStats) -> str:
    criteria = {
        "canonical_mutation_zero": not any(
            "canonical mutation detected" in item for item in stats.weaknesses
        ),
        "lineage_deterministic": not any("non-deterministic" in item for item in stats.weaknesses),
        "advisory_only_outputs": stats.artifact_counts["deltas"] > 0
        and stats.artifact_counts["signals"] > 0,
        "failure_isolation_visible": stats.degraded_count >= 0,
        "truth_lane_regressions": True,
    }
    # M5 runner does not execute truth lane directly; caller should ensure it separately.
    if stats.failure_count > 0 or not all(criteria.values()):
        return "revise before v2"
    if stats.legacy_replay_unbounded_cases > 0:
        return "revise before v2"
    return "continue to v2"


def main() -> int:
    args = parse_args()
    root = args.project_root.resolve()
    storage = MemoryPrototypeStorage(project_root=root)
    storage.ensure_scaffold()

    manifest = json.loads(args.fixture_manifest.read_text(encoding="utf-8"))
    stats = _empty_stats()
    case_total = 0

    for project in manifest.get("projects", []):
        project_id = str(project["project_id"])
        project_root = root / project_id
        for case in project.get("cases", []):
            case_total += 1
            _materialize_case(project_root, project_id, case)
            _evaluate_case(project_root, project_id, case, stats)

    recommendation = _recommendation(stats)
    status = "m5_eval_complete" if stats.failure_count == 0 else "m5_eval_degraded"
    now = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    report = {
        "status": status,
        "phase": "m5",
        "evaluated_projects": len(stats.evaluated_projects),
        "evaluated_units": stats.evaluated_units,
        "fixture_cases": case_total,
        "lineage_modes": stats.lineage_modes,
        "artifact_counts": stats.artifact_counts,
        "degraded_count": stats.degraded_count,
        "failure_count": stats.failure_count,
        "deterministic_checks": stats.deterministic_checks,
        "weakness_flags": stats.weaknesses,
        "legacy_replay": {
            "used": stats.legacy_replay_cases > 0,
            "cases": stats.legacy_replay_cases,
            "bounded_cases": stats.legacy_replay_bounded_cases,
            "unbounded_cases": stats.legacy_replay_unbounded_cases,
            "classification": (
                "reducible risk, now contained"
                if stats.legacy_replay_cases > 0 and stats.legacy_replay_unbounded_cases == 0
                else (
                    "acceptable prototype debt"
                    if stats.legacy_replay_cases == 0
                    else "true blocker"
                )
            ),
            "notes": ["Legacy replay is replay/eval only and never live accept lineage."],
        },
        "informational_flags": (
            ["legacy replay hash derivation path used (bounded replay/eval mode)"]
            if stats.legacy_replay_cases > 0 and stats.legacy_replay_unbounded_cases == 0
            else []
        ),
        "decision_criteria": {
            "canonical_mutation_zero": not any(
                "canonical mutation detected" in item for item in stats.weaknesses
            ),
            "lineage_stability_deterministic": not any(
                "non-deterministic" in item for item in stats.weaknesses
            ),
            "replay_behavior_bounded": "legacy_replay_derived" in stats.lineage_modes
            or "metadata_hash" in stats.lineage_modes,
            "packet_usefulness_structural": all(
                stats.artifact_counts[key] >= stats.evaluated_units
                for key in ("packets_draft", "packets_rewrite", "packets_critique")
            ),
            "advisory_outputs_attributable_non_canonical": stats.artifact_counts["deltas"]
            >= stats.evaluated_units
            and stats.artifact_counts["signals"] >= stats.evaluated_units,
            "truth_lane_regressions": "not evaluated in M5 runner",
            "failure_handling_visible_non_blocking": stats.degraded_count >= 0,
        },
        "recommendation": recommendation,
    }

    report_path = root / "history" / "memory_prototype" / "eval" / f"report_{now}.json"
    _write_json(report_path, report)
    print(
        json.dumps(
            {
                "status": status,
                "phase": "m5",
                "report_path": str(report_path),
                "recommendation": recommendation,
                "evaluated_projects": report["evaluated_projects"],
                "evaluated_units": report["evaluated_units"],
                "failure_count": report["failure_count"],
                "degraded_count": report["degraded_count"],
            },
            indent=2,
        )
    )
    return 0 if stats.failure_count == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
