"""M3 tests for continuity signal normalization."""

from __future__ import annotations

import json
from pathlib import Path

from blackskies.services.memory_prototype.canonical_state_reader import CanonicalStateReader
from blackskies.services.memory_prototype.continuity_signal_normalizer import (
    ContinuitySignalNormalizer,
)
from blackskies.services.memory_prototype.scene_delta_extractor import SceneDeltaExtractor
from blackskies.services.memory_prototype.schemas import CanonicalLineageKey
from blackskies.services.memory_prototype.storage import MemoryPrototypeStorage


def _write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def test_continuity_signal_shape_and_advisory_storage(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_signal_m3"
    snapshot_id = "20260412T121212Z"
    scene_id = "sc_0001"
    draft_text = (
        "# sc_0001\n"
        "Mara finds Jonah alive, then reports Jonah dead by dawn.\n"
        "They move from the cellar to the dock and continue the mission.\n"
    )
    scene_payload = {"id": scene_id, "purpose": "continuity"}

    snapshot_dir = project_root / "history" / "snapshots" / f"{snapshot_id}_accept"
    (snapshot_dir / "drafts").mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "drafts" / f"{scene_id}.md").write_text(draft_text, encoding="utf-8")
    _write_json(snapshot_dir / "outline.json", {"scenes": [scene_payload]})
    _write_json(
        snapshot_dir / "metadata.json",
        {
            "snapshot_id": snapshot_id,
            "project_id": "proj_signal_m3",
            "label": "accept",
            "created_at": "2026-04-12T12:12:12Z",
            "includes": ["drafts", "outline.json"],
        },
    )

    lineage = CanonicalLineageKey.from_snapshot(
        project_id="proj_signal_m3",
        unit_id=scene_id,
        snapshot_id=snapshot_id,
        context="replay",
    )
    reader = CanonicalStateReader(project_root=project_root)
    snapshot = reader.read_snapshot(lineage)
    deltas = SceneDeltaExtractor().extract(snapshot)

    signals = ContinuitySignalNormalizer().normalize(deltas)
    assert signals.signals
    for signal in signals.signals:
        data = signal.as_dict()
        for required in ("type", "entities", "scope", "severity", "confidence", "anchor"):
            assert required in data
        assert data["severity"] in {"info", "warning", "conflict"}
        assert isinstance(data["confidence"], float)
        assert 0.0 <= data["confidence"] <= 1.0
        assert data["anchor"]["excerpt"]

    storage = MemoryPrototypeStorage(project_root=project_root)
    drift_path = storage.write_continuity_artifact(
        lineage=lineage,
        payload=signals.as_dict(),
        source_hashes=snapshot.source_hashes,
    )
    assert drift_path.resolve().is_relative_to(
        (project_root / ".blackskies" / "memory" / "drift").resolve()
    )
    payload = json.loads(drift_path.read_text(encoding="utf-8"))
    assert payload["advisory"] is True
    assert payload["payload"]["signal_count"] == len(signals.signals)
