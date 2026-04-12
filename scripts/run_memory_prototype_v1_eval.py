#!/usr/bin/env python3
"""M4 entrypoint for Memory Prototype v1 packet assembly validation."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from blackskies.services.memory_prototype.canonical_state_reader import CanonicalStateReader
from blackskies.services.memory_prototype.continuity_signal_normalizer import ContinuitySignalNormalizer
from blackskies.services.memory_prototype.scene_delta_extractor import SceneDeltaExtractor
from blackskies.services.memory_prototype.schemas import CanonicalLineageKey
from blackskies.services.memory_prototype.storage import MemoryPrototypeStorage
from blackskies.services.memory_prototype.task_packet_assembler import TaskPacketAssembler


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Memory Prototype v1 eval scaffold")
    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path.cwd(),
        help="Target project root for scaffold validation (default: current working directory).",
    )
    parser.add_argument("--project-id", type=str, default=None, help="Project id for lineage validation.")
    parser.add_argument("--unit-id", type=str, default=None, help="Unit id for lineage validation.")
    parser.add_argument(
        "--snapshot-id",
        type=str,
        default=None,
        help="Snapshot id for primary lineage validation.",
    )
    parser.add_argument(
        "--accepted-source-hash",
        type=str,
        default=None,
        help="Fallback accepted source hash (eval/replay contexts only).",
    )
    parser.add_argument(
        "--context",
        type=str,
        default="eval",
        choices=["live_accept", "replay", "eval"],
        help="Lineage context for eligibility rules.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    project_root = args.project_root.resolve()
    storage = MemoryPrototypeStorage(project_root=project_root)
    storage.ensure_scaffold()

    if not (args.project_id and args.unit_id):
        payload = {
            "status": "scaffold_only",
            "phase": "m4",
            "project_root": str(project_root),
            "created_paths": {
                "memory_root": str(storage.memory_root),
                "history_root": str(storage.history_root),
            },
            "note": "M4 validation requires --project-id and --unit-id.",
        }
        print(json.dumps(payload, indent=2))
        return 0

    if args.snapshot_id:
        lineage = CanonicalLineageKey.from_snapshot(
            project_id=args.project_id,
            unit_id=args.unit_id,
            snapshot_id=args.snapshot_id,
            context=args.context,
        )
    elif args.accepted_source_hash:
        lineage = CanonicalLineageKey.from_fallback_hash(
            project_id=args.project_id,
            unit_id=args.unit_id,
            accepted_source_hash=args.accepted_source_hash,
            context=args.context,
        )
    else:
        payload = {
            "status": "scaffold_only",
            "phase": "m4",
            "project_root": str(project_root),
            "note": "Lineage validation requires --snapshot-id or --accepted-source-hash.",
        }
        print(json.dumps(payload, indent=2))
        return 0

    reader = CanonicalStateReader(project_root=project_root)
    try:
        snapshot = reader.read_snapshot(lineage)
        delta_artifact = SceneDeltaExtractor().extract(snapshot)
        signal_artifact = ContinuitySignalNormalizer().normalize(delta_artifact)
        delta_path = storage.write_delta_artifact(
            lineage=lineage,
            payload=delta_artifact.as_dict(),
            source_hashes=snapshot.source_hashes,
        )
        signal_path = storage.write_continuity_artifact(
            lineage=lineage,
            payload=signal_artifact.as_dict(),
            source_hashes=snapshot.source_hashes,
        )
        assembler = TaskPacketAssembler()
        packet_paths: dict[str, str] = {}
        packet_counts: dict[str, int] = {}
        for packet_type in ("draft", "rewrite", "critique"):
            packet = assembler.assemble(
                packet_type=packet_type,
                snapshot=snapshot,
                deltas=delta_artifact,
                signals=signal_artifact,
            )
            packet_path = storage.write_packet_artifact(
                packet_type=packet_type,
                lineage=lineage,
                payload=packet.as_dict(),
                source_hashes=snapshot.source_hashes,
            )
            packet_paths[packet_type] = str(packet_path)
            packet_counts[packet_type] = len(packet.advisory.get("delta_highlights", []))
        status_path = storage.write_status(
            status="ok",
            affected_components=[
                "reader",
                "delta_extractor",
                "signal_normalizer",
                "packet_assembler",
                "storage",
            ],
        )
    except Exception as exc:  # noqa: BLE001 - eval output must surface eligibility errors.
        diagnostic_path = storage.write_diagnostic(
            lineage=lineage,
            code="M4_PACKET_ASSEMBLY_FAILURE",
            message=str(exc),
        )
        status_path = storage.write_status(
            status="degraded",
            last_error_code="M4_PACKET_ASSEMBLY_FAILURE",
            last_error_message=str(exc),
            affected_components=[
                "reader",
                "delta_extractor",
                "signal_normalizer",
                "packet_assembler",
                "storage",
            ],
            retry_after_seconds=0,
        )
        payload = {
            "status": "m4_packet_assembly_error",
            "phase": "m4",
            "project_root": str(project_root),
            "lineage_key": lineage.key,
            "diagnostic_path": str(diagnostic_path),
            "status_path": str(status_path),
            "error": str(exc),
        }
        print(json.dumps(payload, indent=2))
        return 1

    payload = {
        "status": "m4_packet_assembly",
        "phase": "m4",
        "project_root": str(project_root),
        "lineage_key": lineage.key,
        "delta_path": str(delta_path),
        "signal_path": str(signal_path),
        "packet_paths": packet_paths,
        "packet_counts": packet_counts,
        "delta_count": len(delta_artifact.candidates),
        "signal_count": len(signal_artifact.signals),
        "status_path": str(status_path),
        "note": "M4 validated lineage-safe advisory task packet assembly from canonical plus advisory inputs.",
    }
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
