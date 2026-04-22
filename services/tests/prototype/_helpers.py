"""Shared helpers for prototype M5 fixture-backed tests."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


def load_m5_fixture_manifest() -> dict[str, Any]:
    path = Path(__file__).parent / "fixtures" / "m5_eval_cases.json"
    return json.loads(path.read_text(encoding="utf-8"))


def accepted_source_hash(unit_id: str, draft_text: str, outline_scene: dict[str, Any]) -> str:
    front = json.dumps(outline_scene, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(f"{unit_id}\n{front}\n{draft_text}".encode("utf-8")).hexdigest()


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def materialize_case(project_root: Path, project_id: str, case: dict[str, Any]) -> None:
    unit_id = str(case["unit_id"])
    snapshot_id = str(case["snapshot_id"])
    outline_scene = dict(case["outline_scene"])
    draft_text = str(case["draft_text"])

    # Canonical root files remain separate from prototype outputs.
    (project_root / "drafts").mkdir(parents=True, exist_ok=True)
    (project_root / "drafts" / f"{unit_id}.md").write_text(draft_text, encoding="utf-8")
    write_json(project_root / "outline.json", {"scenes": [outline_scene]})
    write_json(project_root / "project.json", {"project_id": project_id})
    locked_facts = list(case.get("locked_facts") or [])
    write_json(project_root / "locked_facts.json", {"facts": locked_facts})

    lore_dir = project_root / "lore"
    lore_dir.mkdir(parents=True, exist_ok=True)
    for index, lore in enumerate(list(case.get("lore_records") or []), start=1):
        lore_path = lore_dir / f"record_{index:02d}.yaml"
        lines = [f"{key}: {value}" for key, value in lore.items()]
        lore_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    snapshot_dir = project_root / "history" / "snapshots" / f"{snapshot_id}_accept"
    (snapshot_dir / "drafts").mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "drafts" / f"{unit_id}.md").write_text(draft_text, encoding="utf-8")
    write_json(snapshot_dir / "outline.json", {"scenes": [outline_scene]})
    write_json(snapshot_dir / "locked_facts.json", {"facts": locked_facts})
    snapshot_lore_dir = snapshot_dir / "lore"
    snapshot_lore_dir.mkdir(parents=True, exist_ok=True)
    for index, lore in enumerate(list(case.get("lore_records") or []), start=1):
        lore_path = snapshot_lore_dir / f"record_{index:02d}.yaml"
        lines = [f"{key}: {value}" for key, value in lore.items()]
        lore_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    metadata = {
        "snapshot_id": snapshot_id,
        "project_id": project_id,
        "label": "accept",
        "created_at": "2026-04-12T00:00:00Z",
        "includes": ["drafts", "outline.json", "locked_facts.json", "lore"],
    }
    if not case.get("legacy_missing_hash", False):
        metadata["accepted_source_hash"] = accepted_source_hash(unit_id, draft_text, outline_scene)
    write_json(snapshot_dir / "metadata.json", metadata)
