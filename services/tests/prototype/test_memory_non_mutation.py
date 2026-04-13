"""M2 invariants for advisory-only memory prototype behavior."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from blackskies.services.memory_prototype.canonical_state_reader import (
    CanonicalInputEligibilityError,
    CanonicalStateReader,
)
from blackskies.services.memory_prototype.schemas import CanonicalLineageKey
from blackskies.services.memory_prototype.storage import MemoryPrototypeStorage


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _accepted_source_hash(*, unit_id: str, draft_text: str, scene_payload: dict[str, object]) -> str:
    front_matter = json.dumps(scene_payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(f"{unit_id}\n{front_matter}\n{draft_text}".encode("utf-8")).hexdigest()


def test_memory_non_mutation_invariant(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_memory_m2"
    canonical_draft = project_root / "drafts" / "sc_0001.md"
    canonical_outline = project_root / "outline.json"
    canonical_project = project_root / "project.json"
    canonical_lore = project_root / "lore" / "char_mara.yaml"
    canonical_locked = project_root / "locked_facts.json"

    canonical_draft.parent.mkdir(parents=True, exist_ok=True)
    canonical_lore.parent.mkdir(parents=True, exist_ok=True)
    canonical_draft.write_text("# sc_0001\naccepted line\n", encoding="utf-8")
    _write_json(canonical_outline, {"scenes": [{"id": "sc_0001", "purpose": "setup"}]})
    _write_json(canonical_project, {"project_id": "proj_memory_m2"})
    canonical_lore.write_text("id: char_mara\nname: Mara\n", encoding="utf-8")
    _write_json(canonical_locked, {"facts": ["The house is sealed."]})

    snapshot_id = "20260101T000000Z"
    snapshot_dir = project_root / "history" / "snapshots" / f"{snapshot_id}_accept"
    (snapshot_dir / "drafts").mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "lore").mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "drafts" / "sc_0001.md").write_text(
        "# sc_0001\naccepted line\n",
        encoding="utf-8",
    )
    scene_payload = {"id": "sc_0001", "purpose": "setup"}
    _write_json(snapshot_dir / "outline.json", {"scenes": [scene_payload]})
    (snapshot_dir / "lore" / "char_mara.yaml").write_text("id: char_mara\nname: Mara\n", encoding="utf-8")
    _write_json(snapshot_dir / "locked_facts.json", {"facts": ["The house is sealed."]})
    accepted_source_hash = _accepted_source_hash(
        unit_id="sc_0001",
        draft_text="# sc_0001\naccepted line\n",
        scene_payload=scene_payload,
    )
    _write_json(
        snapshot_dir / "metadata.json",
        {
            "snapshot_id": snapshot_id,
            "project_id": "proj_memory_m2",
            "label": "accept",
            "accepted_source_hash": accepted_source_hash,
            "created_at": "2026-01-01T00:00:00Z",
            "includes": ["project.json", "outline.json", "drafts", "lore", "locked_facts.json"],
        },
    )

    canonical_hashes_before = {
        "draft": _sha256(canonical_draft),
        "outline": _sha256(canonical_outline),
        "project": _sha256(canonical_project),
        "lore": _sha256(canonical_lore),
        "locked": _sha256(canonical_locked),
    }

    reader = CanonicalStateReader(project_root=project_root)
    lineage = CanonicalLineageKey.from_snapshot(
        project_id="proj_memory_m2",
        unit_id="sc_0001",
        snapshot_id=snapshot_id,
        context="replay",
    )
    snapshot = reader.read_snapshot(lineage)

    storage = MemoryPrototypeStorage(project_root=project_root)
    artifact_path = storage.write_advisory_artifact(
        category="ledger",
        lineage=lineage,
        payload={"reader_check": "ok", "draft_preview": snapshot.draft_text[:32]},
        source_hashes=snapshot.source_hashes,
    )
    diagnostic_path = storage.write_diagnostic(
        lineage=lineage,
        code="M2_CHECK",
        message="non-mutation invariant exercised",
    )
    status_path = storage.write_status(status="ok", affected_components=["reader", "storage"])

    canonical_hashes_after = {
        "draft": _sha256(canonical_draft),
        "outline": _sha256(canonical_outline),
        "project": _sha256(canonical_project),
        "lore": _sha256(canonical_lore),
        "locked": _sha256(canonical_locked),
    }
    assert canonical_hashes_before == canonical_hashes_after

    for created in (artifact_path, diagnostic_path, status_path):
        resolved = created.resolve()
        assert resolved.is_relative_to((project_root / ".blackskies" / "memory").resolve()) or resolved.is_relative_to(
            (project_root / "history" / "memory_prototype").resolve()
        )


def test_reader_requires_lineage_evidence_for_replay(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_memory_m2_missing_lineage"
    (project_root / "drafts").mkdir(parents=True, exist_ok=True)
    (project_root / "drafts" / "sc_0001.md").write_text("accepted content", encoding="utf-8")

    reader = CanonicalStateReader(project_root=project_root)
    lineage = CanonicalLineageKey.from_snapshot(
        project_id="proj_memory_m2_missing_lineage",
        unit_id="sc_0001",
        snapshot_id="20260101T010101Z",
        context="replay",
    )
    with pytest.raises(CanonicalInputEligibilityError):
        reader.read_snapshot(lineage)


def test_reader_replay_legacy_snapshot_without_hash_uses_bounded_fallback(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_memory_m2_legacy"
    snapshot_id = "20260412T030303Z"
    snapshot_dir = project_root / "history" / "snapshots" / f"{snapshot_id}_accept"
    (snapshot_dir / "drafts").mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "drafts" / "sc_0001.md").write_text("# sc_0001\nlegacy accepted text\n", encoding="utf-8")
    _write_json(snapshot_dir / "outline.json", {"scenes": [{"id": "sc_0001", "purpose": "legacy"}]})
    # Intentionally no accepted_source_hash to simulate legacy metadata shape.
    _write_json(
        snapshot_dir / "metadata.json",
        {
            "snapshot_id": snapshot_id,
            "project_id": "proj_memory_m2_legacy",
            "label": "accept",
            "created_at": "2026-04-12T03:03:03Z",
            "includes": ["drafts", "outline.json"],
        },
    )

    reader = CanonicalStateReader(project_root=project_root)
    lineage = CanonicalLineageKey.from_snapshot(
        project_id="proj_memory_m2_legacy",
        unit_id="sc_0001",
        snapshot_id=snapshot_id,
        context="replay",
    )
    snapshot = reader.read_snapshot(lineage)
    assert snapshot.source_hashes["accepted_source_hash"]
    assert snapshot.source_hashes["accepted_source_hash_mode"] == "legacy_replay_derived"
    assert snapshot.source_hashes["legacy_replay_bounded"] == "true"
