"""M5 failure isolation invariants for prototype execution."""

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
from blackskies.services.persistence import DraftPersistence

try:
    from fastapi.testclient import TestClient
except ModuleNotFoundError:  # pragma: no cover - environment dependent
    TestClient = None  # type: ignore[assignment]


def _write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _scene_checksum(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def test_memory_failure_isolation(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    if TestClient is None:
        pytest.skip("FastAPI test client unavailable")
    from blackskies.services.app import create_app

    monkeypatch.setenv("BLACKSKIES_PROJECT_BASE_DIR", str(tmp_path))
    app = create_app()
    project_id = "proj_failure_isolation_m5"
    scene_id = "sc_0001"
    project_root = tmp_path / project_id
    scene_text = "Initial accepted text."
    persistence = DraftPersistence(settings=app.state.settings)
    persistence.write_scene(
        project_id,
        {
            "id": scene_id,
            "slug": "scene-0001",
            "title": "Scene 1",
            "order": 1,
            "chapter_id": "ch_0001",
            "purpose": "setup",
            "emotion_tag": "tension",
            "pov": "Mara",
            "beats": ["inciting"],
        },
        scene_text,
    )
    _write_json(project_root / "outline.json", {"scenes": [{"id": scene_id, "purpose": "setup"}]})
    _write_json(
        project_root / "project.json",
        {
            "project_id": project_id,
            "name": "Failure Isolation",
            "budget": {"soft": 5.0, "hard": 10.0, "spent_usd": 0.0},
        },
    )

    accept_payload = {
        "project_id": project_id,
        "draft_id": "dr_iso_001",
        "unit_id": scene_id,
        "unit": {
            "id": scene_id,
            "previous_sha256": _scene_checksum(scene_text),
            "text": scene_text + "\nAccepted change.",
            "meta": {"purpose": "setup"},
        },
        "message": "accept for isolation test",
        "snapshot_label": "accept",
    }

    with TestClient(app) as client:
        response = client.post("/api/v1/draft/accept", json=accept_payload)
        assert response.status_code == 200
        accepted = response.json()
        snapshot_id = accepted["snapshot"]["snapshot_id"]

    # Prototype failure after accept should degrade prototype state only.
    lineage = CanonicalLineageKey.from_snapshot(
        project_id=project_id,
        unit_id=scene_id,
        snapshot_id="00000000T000000Z",  # invalid lineage to force failure
        context="replay",
    )
    reader = CanonicalStateReader(project_root=project_root)
    storage = MemoryPrototypeStorage(project_root=project_root)
    with pytest.raises(CanonicalInputEligibilityError):
        reader.read_snapshot(lineage)
    diagnostic = storage.write_diagnostic(
        lineage=lineage,
        code="M5_FAILURE_ISOLATION",
        message="expected prototype replay failure",
    )
    status = storage.write_status(
        status="degraded",
        last_error_code="M5_FAILURE_ISOLATION",
        last_error_message="expected prototype replay failure",
        affected_components=["reader"],
        retry_after_seconds=0,
    )

    # Canonical accept result and files remain committed.
    restored_scene = (project_root / "drafts" / f"{scene_id}.md").read_text(encoding="utf-8")
    assert "Accepted change." in restored_scene
    state_payload = json.loads(
        (project_root / "history" / "recovery" / "state.json").read_text(encoding="utf-8")
    )
    assert state_payload["last_snapshot"]["snapshot_id"] == snapshot_id

    # Prototype degraded visibility contract.
    assert diagnostic.exists()
    assert status.exists()
    degraded_payload = json.loads(status.read_text(encoding="utf-8"))
    assert degraded_payload["status"] == "degraded"
    assert degraded_payload["last_error_code"] == "M5_FAILURE_ISOLATION"
