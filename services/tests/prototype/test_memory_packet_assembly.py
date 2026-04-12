"""M4 tests for lineage-safe advisory task packet assembly."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from blackskies.services.memory_prototype.canonical_state_reader import CanonicalStateReader
from blackskies.services.memory_prototype.continuity_signal_normalizer import ContinuitySignalNormalizer
from blackskies.services.memory_prototype.scene_delta_extractor import SceneDeltaExtractor
from blackskies.services.memory_prototype.schemas import CanonicalLineageKey
from blackskies.services.memory_prototype.storage import MemoryPrototypeStorage
from blackskies.services.memory_prototype.task_packet_assembler import TaskPacketAssembler


def _write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _accepted_hash(unit_id: str, text: str, scene_payload: dict[str, object]) -> str:
    front = json.dumps(scene_payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(f"{unit_id}\n{front}\n{text}".encode("utf-8")).hexdigest()


def test_task_packet_assembly_is_advisory_and_non_mutating(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_packet_m4"
    snapshot_id = "20260412T141414Z"
    scene_id = "sc_0001"
    scene_payload = {"id": scene_id, "purpose": "setup", "location": "roof"}
    draft_text = (
        "# sc_0001\n"
        "Mara and Jonah leave the cellar for the roof.\n"
        "Jonah is wounded but vows to continue the mission.\n"
    )

    canonical_draft = project_root / "drafts" / f"{scene_id}.md"
    canonical_outline = project_root / "outline.json"
    canonical_project = project_root / "project.json"
    canonical_lore = project_root / "lore" / "char_mara.yaml"
    canonical_locked = project_root / "locked_facts.json"
    canonical_draft.parent.mkdir(parents=True, exist_ok=True)
    canonical_lore.parent.mkdir(parents=True, exist_ok=True)
    canonical_draft.write_text(draft_text, encoding="utf-8")
    _write_json(canonical_outline, {"scenes": [scene_payload]})
    _write_json(canonical_project, {"project_id": "proj_packet_m4"})
    canonical_lore.write_text("id: char_mara\nname: Mara\n", encoding="utf-8")
    _write_json(canonical_locked, {"facts": ["Location: cellar", "The house is sealed."]})

    snapshot_dir = project_root / "history" / "snapshots" / f"{snapshot_id}_accept"
    (snapshot_dir / "drafts").mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "lore").mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "drafts" / f"{scene_id}.md").write_text(draft_text, encoding="utf-8")
    (snapshot_dir / "lore" / "char_mara.yaml").write_text("id: char_mara\nname: Mara\n", encoding="utf-8")
    _write_json(snapshot_dir / "outline.json", {"scenes": [scene_payload]})
    _write_json(snapshot_dir / "locked_facts.json", {"facts": ["Location: cellar", "The house is sealed."]})
    _write_json(
        snapshot_dir / "metadata.json",
        {
            "snapshot_id": snapshot_id,
            "project_id": "proj_packet_m4",
            "label": "accept",
            "accepted_source_hash": _accepted_hash(scene_id, draft_text, scene_payload),
            "created_at": "2026-04-12T14:14:14Z",
            "includes": ["drafts", "outline.json", "locked_facts.json", "lore"],
        },
    )

    before = {
        "draft": _sha(canonical_draft),
        "outline": _sha(canonical_outline),
        "project": _sha(canonical_project),
        "lore": _sha(canonical_lore),
        "locked": _sha(canonical_locked),
    }

    lineage = CanonicalLineageKey.from_snapshot(
        project_id="proj_packet_m4",
        unit_id=scene_id,
        snapshot_id=snapshot_id,
        context="replay",
    )
    snapshot = CanonicalStateReader(project_root=project_root).read_snapshot(lineage)
    deltas = SceneDeltaExtractor().extract(snapshot)
    signals = ContinuitySignalNormalizer().normalize(deltas)
    packet = TaskPacketAssembler().assemble(
        packet_type="draft",
        snapshot=snapshot,
        deltas=deltas,
        signals=signals,
    )

    storage = MemoryPrototypeStorage(project_root=project_root)
    packet_path = storage.write_packet_artifact(
        packet_type="draft",
        lineage=lineage,
        payload=packet.as_dict(),
        source_hashes=snapshot.source_hashes,
    )
    assert packet_path.resolve().is_relative_to(
        (project_root / ".blackskies" / "memory" / "packets" / "draft").resolve()
    )

    blob = json.loads(packet_path.read_text(encoding="utf-8"))
    assert blob["advisory"] is True
    assert blob["envelope"]["lineage_key"] == lineage.key
    payload = blob["payload"]
    for required in (
        "schema_version",
        "prototype_version",
        "project_id",
        "unit_id",
        "lineage_key",
        "packet_type",
        "generated_at",
        "source_hashes",
    ):
        assert required in payload
    assert payload["packet_type"] == "draft"

    after = {
        "draft": _sha(canonical_draft),
        "outline": _sha(canonical_outline),
        "project": _sha(canonical_project),
        "lore": _sha(canonical_lore),
        "locked": _sha(canonical_locked),
    }
    assert before == after

