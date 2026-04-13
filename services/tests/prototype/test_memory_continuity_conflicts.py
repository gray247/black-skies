"""Revision Pass A tests for high-value continuity contradiction detection."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from blackskies.services.memory_prototype.canonical_state_reader import CanonicalStateReader
from blackskies.services.memory_prototype.continuity_signal_normalizer import ContinuitySignalNormalizer
from blackskies.services.memory_prototype.scene_delta_extractor import SceneDeltaExtractor
from blackskies.services.memory_prototype.schemas import CanonicalLineageKey
from blackskies.services.memory_prototype.storage import MemoryPrototypeStorage

from ._helpers import load_m5_fixture_manifest, materialize_case


def _digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_dead_alive_conflict_signal_and_non_mutation(tmp_path: Path) -> None:
    manifest = load_m5_fixture_manifest()
    project = next(item for item in manifest["projects"] if item["project_id"] == "proj_m5_alpha")
    case = next(item for item in project["cases"] if item["case_id"] == "alpha_dead_alive_mismatch")

    project_root = tmp_path / "proj_m5_alpha"
    materialize_case(project_root, "proj_m5_alpha", case)

    canonical_paths = [
        project_root / "drafts" / f"{case['unit_id']}.md",
        project_root / "outline.json",
        project_root / "project.json",
        project_root / "locked_facts.json",
        project_root / "lore" / "record_01.yaml",
        project_root / "lore" / "record_02.yaml",
    ]
    before = {str(path): _digest(path) for path in canonical_paths}

    lineage = CanonicalLineageKey.from_snapshot(
        project_id="proj_m5_alpha",
        unit_id=case["unit_id"],
        snapshot_id=case["snapshot_id"],
        context="eval",
    )
    snapshot = CanonicalStateReader(project_root=project_root).read_snapshot(lineage)
    deltas = SceneDeltaExtractor().extract(snapshot)
    signals = ContinuitySignalNormalizer().normalize(deltas)

    conflict_signals = [signal for signal in signals.signals if signal.type == "status_contradiction"]
    assert conflict_signals, "expected a status_contradiction signal for dead/alive mismatch"
    first = conflict_signals[0]
    assert first.severity == "conflict"
    assert first.entities
    assert first.anchor.excerpt
    assert 0.0 <= first.confidence <= 1.0

    storage = MemoryPrototypeStorage(project_root=project_root)
    output_path = storage.write_continuity_artifact(
        lineage=lineage,
        payload=signals.as_dict(),
        source_hashes=snapshot.source_hashes,
    )
    assert output_path.resolve().is_relative_to((project_root / ".blackskies" / "memory" / "drift").resolve())
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    assert payload["advisory"] is True
    assert payload["envelope"]["lineage_key"] == lineage.key

    after = {str(path): _digest(path) for path in canonical_paths}
    assert after == before
