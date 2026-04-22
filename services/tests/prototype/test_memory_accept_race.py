"""M5 deterministic same-scene race and failure gating invariants."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest

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

from ._helpers import load_m5_fixture_manifest, materialize_case


def test_memory_accept_race_resolution(tmp_path: Path) -> None:
    manifest = load_m5_fixture_manifest()
    project = next(item for item in manifest["projects"] if item["project_id"] == "proj_m5_beta")
    case = next(
        item for item in project["cases"] if item["case_id"] == "beta_same_scene_parallel_accept"
    )

    project_root = tmp_path / "proj_m5_beta"
    materialize_case(project_root, "proj_m5_beta", case)
    lineage = CanonicalLineageKey.from_snapshot(
        project_id="proj_m5_beta",
        unit_id=case["unit_id"],
        snapshot_id=case["snapshot_id"],
        context="replay",
    )
    reader = CanonicalStateReader(project_root=project_root)
    snapshot = reader.read_snapshot(lineage)
    deltas = SceneDeltaExtractor().extract(snapshot)
    signals = ContinuitySignalNormalizer().normalize(deltas)
    packet = TaskPacketAssembler().assemble(
        packet_type="rewrite",
        snapshot=snapshot,
        deltas=deltas,
        signals=signals,
    )
    storage = MemoryPrototypeStorage(project_root=project_root)

    def write_once() -> Path:
        return storage.write_packet_artifact(
            packet_type="rewrite",
            lineage=lineage,
            payload=packet.as_dict(),
            source_hashes=snapshot.source_hashes,
        )

    with ThreadPoolExecutor(max_workers=4) as pool:
        paths = list(pool.map(lambda _: write_once(), range(8)))
    assert len(set(paths)) == 1
    packet_files = list(
        (project_root / ".blackskies" / "memory" / "packets" / "rewrite").glob("*.json")
    )
    assert len(packet_files) == 1

    # Failed/conflicting accept lineage should not create lineage artifacts.
    bad_lineage = CanonicalLineageKey.from_snapshot(
        project_id="proj_m5_beta",
        unit_id=case["unit_id"],
        snapshot_id="19990101T000000Z",
        context="replay",
    )
    with pytest.raises(CanonicalInputEligibilityError):
        reader.read_snapshot(bad_lineage)

    # Ensure no extra artifact created after failed replay attempt.
    packet_files_after = list(
        (project_root / ".blackskies" / "memory" / "packets" / "rewrite").glob("*.json")
    )
    assert len(packet_files_after) == 1
