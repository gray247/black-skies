"""M3 tests for advisory scene delta extraction behavior."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from blackskies.services.memory_prototype.canonical_state_reader import CanonicalStateReader
from blackskies.services.memory_prototype.scene_delta_extractor import SceneDeltaExtractor
from blackskies.services.memory_prototype.schemas import CanonicalLineageKey
from blackskies.services.memory_prototype.storage import MemoryPrototypeStorage


def _write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _accepted_hash(unit_id: str, text: str, scene_payload: dict[str, object]) -> str:
    front = json.dumps(scene_payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(f"{unit_id}\n{front}\n{text}".encode("utf-8")).hexdigest()


def test_delta_extraction_is_advisory_and_non_mutating(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_delta_m3"
    snapshot_id = "20260412T101010Z"
    scene_id = "sc_0001"
    scene_payload = {"id": scene_id, "purpose": "setup"}
    draft_text = (
        "# sc_0001\n"
        "Mara and Jonah leave the cellar for the roof.\n"
        "Jonah is wounded but vows to continue the mission.\n"
        "Mara trusts Jonah after the reveal.\n"
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
    _write_json(canonical_project, {"project_id": "proj_delta_m3"})
    canonical_lore.write_text("id: char_mara\nname: Mara\n", encoding="utf-8")
    _write_json(canonical_locked, {"facts": ["The house is sealed."]})

    snapshot_dir = project_root / "history" / "snapshots" / f"{snapshot_id}_accept"
    (snapshot_dir / "drafts").mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "lore").mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "drafts" / f"{scene_id}.md").write_text(draft_text, encoding="utf-8")
    (snapshot_dir / "lore" / "char_mara.yaml").write_text("id: char_mara\nname: Mara\n", encoding="utf-8")
    _write_json(snapshot_dir / "outline.json", {"scenes": [scene_payload]})
    _write_json(snapshot_dir / "locked_facts.json", {"facts": ["The house is sealed."]})
    _write_json(
        snapshot_dir / "metadata.json",
        {
            "snapshot_id": snapshot_id,
            "project_id": "proj_delta_m3",
            "label": "accept",
            "accepted_source_hash": _accepted_hash(scene_id, draft_text, scene_payload),
            "created_at": "2026-04-12T10:10:10Z",
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

    reader = CanonicalStateReader(project_root=project_root)
    lineage = CanonicalLineageKey.from_snapshot(
        project_id="proj_delta_m3",
        unit_id=scene_id,
        snapshot_id=snapshot_id,
        context="replay",
    )
    snapshot = reader.read_snapshot(lineage)

    extractor = SceneDeltaExtractor()
    artifact = extractor.extract(snapshot)
    categories = {candidate.category for candidate in artifact.candidates}
    assert "entity_participation" in categories
    assert "location_change" in categories
    assert "injury_status_change" in categories
    assert "thread_advancement" in categories

    storage = MemoryPrototypeStorage(project_root=project_root)
    delta_path = storage.write_delta_artifact(
        lineage=lineage,
        payload=artifact.as_dict(),
        source_hashes=snapshot.source_hashes,
    )
    assert delta_path.resolve().is_relative_to((project_root / ".blackskies" / "memory" / "deltas").resolve())
    blob = json.loads(delta_path.read_text(encoding="utf-8"))
    assert blob["advisory"] is True
    assert blob["envelope"]["lineage_key"] == lineage.key
    assert blob["payload"]["candidate_count"] >= 1

    after = {
        "draft": _sha(canonical_draft),
        "outline": _sha(canonical_outline),
        "project": _sha(canonical_project),
        "lore": _sha(canonical_lore),
        "locked": _sha(canonical_locked),
    }
    assert before == after

