"""M4 tests for packet precedence and advisory non-override behavior."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from blackskies.services.memory_prototype.canonical_state_reader import CanonicalStateReader
from blackskies.services.memory_prototype.continuity_signal_normalizer import ContinuitySignalNormalizer
from blackskies.services.memory_prototype.scene_delta_extractor import SceneDeltaExtractor
from blackskies.services.memory_prototype.schemas import CanonicalLineageKey
from blackskies.services.memory_prototype.task_packet_assembler import TaskPacketAssembler


def _write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _accepted_hash(unit_id: str, text: str, scene_payload: dict[str, object]) -> str:
    front = json.dumps(scene_payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(f"{unit_id}\n{front}\n{text}".encode("utf-8")).hexdigest()


def test_packet_precedence_and_advisory_non_override(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_packet_precedence_m4"
    snapshot_id = "20260412T151515Z"
    scene_id = "sc_0001"
    scene_payload = {
        "id": scene_id,
        "purpose": "outline purpose",
        "location": "roof",
        "goal": "escape city",
    }
    draft_text = (
        "# sc_0001\n"
        "Mara reaches the roof and vows to protect the relic.\n"
        "Jonah is wounded and distrusts the plan.\n"
    )

    snapshot_dir = project_root / "history" / "snapshots" / f"{snapshot_id}_accept"
    (snapshot_dir / "drafts").mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "lore").mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "drafts" / f"{scene_id}.md").write_text(draft_text, encoding="utf-8")
    (snapshot_dir / "lore" / "char_mara.yaml").write_text(
        "id: char_mara\nname: Mara\nlocation: cellar\ngoal: stay hidden\n",
        encoding="utf-8",
    )
    _write_json(snapshot_dir / "outline.json", {"scenes": [scene_payload]})
    # locked location should outrank accepted draft/outline/lore for packet canonical value
    _write_json(snapshot_dir / "locked_facts.json", {"facts": ["Location: cellar"]})
    _write_json(
        snapshot_dir / "metadata.json",
        {
            "snapshot_id": snapshot_id,
            "project_id": "proj_packet_precedence_m4",
            "label": "accept",
            "accepted_source_hash": _accepted_hash(scene_id, draft_text, scene_payload),
            "created_at": "2026-04-12T15:15:15Z",
            "includes": ["drafts", "outline.json", "locked_facts.json", "lore"],
        },
    )

    lineage = CanonicalLineageKey.from_snapshot(
        project_id="proj_packet_precedence_m4",
        unit_id=scene_id,
        snapshot_id=snapshot_id,
        context="replay",
    )
    snapshot = CanonicalStateReader(project_root=project_root).read_snapshot(lineage)
    deltas = SceneDeltaExtractor().extract(snapshot)
    signals = ContinuitySignalNormalizer().normalize(deltas)
    packet = TaskPacketAssembler().assemble(
        packet_type="rewrite",
        snapshot=snapshot,
        deltas=deltas,
        signals=signals,
    )

    # Precedence: locked > draft > outline > lore
    assert packet.canonical["location"] == "cellar"
    # Draft goal should outrank outline goal because locked goal is absent.
    assert isinstance(packet.canonical["goal"], str)
    assert "protect the relic" in packet.canonical["goal"].lower()

    # Conflict metadata should surface disagreement instead of silent mutation.
    conflicts = [entry.as_dict() for entry in packet.canonical_conflicts]
    assert any(item["field"] == "location" for item in conflicts)

    # Advisory signals remain advisory; they do not override canonical resolved fields.
    advisory_signal_types = [entry["type"] for entry in packet.advisory["continuity_signals"]]
    assert advisory_signal_types
    assert packet.canonical["location"] != "roof"

