"""PKG-D divergent active-path/backend-root write-target witnesses."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

from blackskies.services.app import create_app
from blackskies.services.config import ServiceSettings
from blackskies.services.routers.draft.common import _compute_sha256
from blackskies.services.scene_docs import read_scene_document

API_PREFIX = "/api/v1"
PROJECT_ID = "proj_alpha"
ACTIVE_ROOT_NAME = "path-beta"
SCENE_ID = "sc_1001"


def _write_outline(project_root: Path) -> None:
    outline = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_914",
        "acts": ["Act I"],
        "chapters": [{"id": "ch_1000", "order": 1, "title": "Main Act"}],
        "scenes": [
            {"id": SCENE_ID, "order": 1, "title": "Opening", "chapter_id": "ch_1000"},
        ],
    }
    (project_root / "outline.json").write_text(json.dumps(outline, indent=2), encoding="utf-8")


def _write_project_json(project_root: Path, *, name: str) -> None:
    payload = {
        "project_id": PROJECT_ID,
        "name": name,
        "budget": {"soft": 5.0, "hard": 10.0, "spent_usd": 0.0},
    }
    (project_root / "project.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _write_scene(project_root: Path, *, title: str, body: str) -> None:
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    metadata = (
        "---\n"
        f"id: {SCENE_ID}\n"
        f"title: {title}\n"
        "order: 1\n"
        "chapter_id: ch_1000\n"
        "---\n"
    )
    (drafts_dir / f"{SCENE_ID}.md").write_text(metadata + body + "\n", encoding="utf-8")


def _seed_project_root(base_dir: Path, root_name: str, *, name: str, body: str) -> Path:
    project_root = base_dir / root_name
    project_root.mkdir(parents=True, exist_ok=True)
    _write_project_json(project_root, name=name)
    _write_outline(project_root)
    _write_scene(project_root, title=name, body=body)
    return project_root


def _client_for(base_dir: Path) -> TestClient:
    app = create_app(ServiceSettings(project_base_dir=base_dir))
    client = TestClient(app)
    client.app = app  # type: ignore[attr-defined]
    return client


def _export_files(project_root: Path) -> list[Path]:
    exports_dir = project_root / "exports"
    if not exports_dir.exists():
        return []
    return sorted(path for path in exports_dir.iterdir() if path.is_file())


def test_export_writes_to_project_id_derived_root_when_active_path_diverges(tmp_path: Path) -> None:
    active_root = _seed_project_root(
        tmp_path,
        ACTIVE_ROOT_NAME,
        name="Active Path Project",
        body="ACTIVE ROOT EXPORT BODY",
    )
    project_id_root = _seed_project_root(
        tmp_path,
        PROJECT_ID,
        name="Project ID Root Project",
        body="PROJECT ID ROOT EXPORT BODY",
    )

    with _client_for(tmp_path) as client:
        response = client.post(
            f"{API_PREFIX}/export",
            json={"project_id": PROJECT_ID, "format": "txt"},
        )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["project_id"] == PROJECT_ID

    project_id_exports = _export_files(project_id_root)
    active_root_exports = _export_files(active_root)
    assert len(project_id_exports) == 1
    assert active_root_exports == []

    exported_text = project_id_exports[0].read_text(encoding="utf-8")
    assert "PROJECT ID ROOT EXPORT BODY" in exported_text
    assert "ACTIVE ROOT EXPORT BODY" not in exported_text


def test_draft_acceptance_writes_to_project_id_derived_root_when_active_path_diverges(
    tmp_path: Path,
    monkeypatch,
) -> None:
    active_root = _seed_project_root(
        tmp_path,
        ACTIVE_ROOT_NAME,
        name="Active Path Project",
        body="ACTIVE ROOT ACCEPT BODY",
    )
    project_id_root = _seed_project_root(
        tmp_path,
        PROJECT_ID,
        name="Project ID Root Project",
        body="PROJECT ID ROOT ACCEPT BODY",
    )

    def fake_create_accept_snapshot(
        project_id: str,
        label: str | None = None,
        *,
        snapshot_persistence: Any,
        recovery_tracker: Any,
        timing_hook: Any = None,
        durable: bool = True,
    ) -> dict[str, Any]:
        if timing_hook is not None:
            timing_hook({})
        return {
            "snapshot_id": "pkg-d-witness-snapshot",
            "label": label or "accept",
            "created_at": "2026-01-01T00:00:00Z",
            "path": "history/snapshots/pkg-d-witness-snapshot_accept",
            "includes": [],
        }

    monkeypatch.setattr(
        "blackskies.services.operations.draft_accept.create_accept_snapshot",
        fake_create_accept_snapshot,
    )

    _, _, project_id_body = read_scene_document(project_id_root, SCENE_ID)
    previous_sha256 = _compute_sha256(project_id_body)

    with _client_for(tmp_path) as client:
        response = client.post(
            f"{API_PREFIX}/draft/accept",
            json={
                "project_id": PROJECT_ID,
                "draft_id": "dr_pkg_d_001",
                "unit_id": SCENE_ID,
                "unit": {
                    "id": SCENE_ID,
                    "previous_sha256": previous_sha256,
                    "text": "PROJECT ID ROOT UPDATED BODY",
                    "meta": {},
                    "estimated_cost_usd": 0.01,
                },
                "message": "Accept divergent-root witness draft.",
            },
        )

    assert response.status_code == 200

    _, _, active_body_after = read_scene_document(active_root, SCENE_ID)
    _, _, project_id_body_after = read_scene_document(project_id_root, SCENE_ID)
    assert active_body_after.strip() == "ACTIVE ROOT ACCEPT BODY"
    assert project_id_body_after.strip() == "PROJECT ID ROOT UPDATED BODY"
    assert not (active_root / "history" / "snapshots").exists()
    assert not (project_id_root / "history" / "snapshots").exists()
