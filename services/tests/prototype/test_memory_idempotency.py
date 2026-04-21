"""M5 idempotency invariants for repeated same-lineage processing."""

from __future__ import annotations

from pathlib import Path

from blackskies.services.memory_prototype.canonical_state_reader import CanonicalStateReader
from blackskies.services.memory_prototype.continuity_signal_normalizer import (
    ContinuitySignalNormalizer,
)
from blackskies.services.memory_prototype.scene_delta_extractor import SceneDeltaExtractor
from blackskies.services.memory_prototype.schemas import CanonicalLineageKey
from blackskies.services.memory_prototype.storage import MemoryPrototypeStorage
from blackskies.services.memory_prototype.task_packet_assembler import TaskPacketAssembler

from ._helpers import load_m5_fixture_manifest, materialize_case


def test_memory_idempotency_dedup(tmp_path: Path) -> None:
    manifest = load_m5_fixture_manifest()
    project = next(item for item in manifest["projects"] if item["project_id"] == "proj_m5_alpha")
    case = next(item for item in project["cases"] if item["case_id"] == "alpha_dead_alive_mismatch")

    project_root = tmp_path / "proj_m5_alpha"
    materialize_case(project_root, "proj_m5_alpha", case)
    lineage = CanonicalLineageKey.from_snapshot(
        project_id="proj_m5_alpha",
        unit_id=case["unit_id"],
        snapshot_id=case["snapshot_id"],
        context="replay",
    )
    reader = CanonicalStateReader(project_root=project_root)
    storage = MemoryPrototypeStorage(project_root=project_root)

    def run_once() -> tuple[Path, Path, dict[str, Path]]:
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
            packet_paths[packet_type] = storage.write_packet_artifact(
                packet_type=packet_type,
                lineage=lineage,
                payload=packet.as_dict(),
                source_hashes=snapshot.source_hashes,
            )
        return delta_path, signal_path, packet_paths

    first_delta, first_signal, first_packets = run_once()
    second_delta, second_signal, second_packets = run_once()

    assert first_delta == second_delta
    assert first_signal == second_signal
    assert first_packets == second_packets

    assert len(list((project_root / ".blackskies" / "memory" / "deltas").glob("*.json"))) == 1
    assert len(list((project_root / ".blackskies" / "memory" / "drift").glob("*.json"))) == 1
    assert (
        len(list((project_root / ".blackskies" / "memory" / "packets" / "draft").glob("*.json")))
        == 1
    )
    assert (
        len(list((project_root / ".blackskies" / "memory" / "packets" / "rewrite").glob("*.json")))
        == 1
    )
    assert (
        len(list((project_root / ".blackskies" / "memory" / "packets" / "critique").glob("*.json")))
        == 1
    )
