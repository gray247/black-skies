from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from blackskies.services.app import create_app
from blackskies.services.config import ServiceSettings

API_PREFIX = "/api/v1"


def _write_scene(project_root: Path, *, unit_id: str = "sc_0001", body: str = "Original body line.") -> None:
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    scene_path = drafts_dir / f"{unit_id}.md"
    scene_path.write_text(
        "\n".join(
            [
                "---",
                f"id: {unit_id}",
                "title: Scene",
                "---",
                body,
                "",
            ]
        ),
        encoding="utf-8",
    )


def _rewrite_payload(project_id: str, *, scene_text: str, unit_id: str = "sc_0001") -> dict[str, object]:
    return {
        "project_id": project_id,
        "draft_id": "dr_0001",
        "unit_id": unit_id,
        "instructions": "Tighten the pacing.",
        "unit": {
            "id": unit_id,
            "text": scene_text,
            "meta": {},
        },
    }


def test_rewrite_conflict_response_includes_cors_and_provenance(tmp_path: Path) -> None:
    project_id = "proj_rewrite_conflict"
    project_root = tmp_path / project_id
    _write_scene(project_root, body="Original body line.")

    app = create_app(ServiceSettings(project_base_dir=tmp_path))
    client = TestClient(app)

    response = client.post(
        f"{API_PREFIX}/draft/rewrite",
        json=_rewrite_payload(project_id, scene_text="Different edited text."),
        headers={"Origin": "http://localhost:5173"},
    )

    assert response.status_code == 409
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    payload = response.json()
    assert payload["code"] == "CONFLICT"
    assert payload["message"] == "The scene on disk no longer matches the submitted draft unit."
    assert payload["details"]["error_code"] == "CONFLICT"
    assert payload["details"]["provenance"] == {
        "route_name": "draft/rewrite",
        "provider_called": False,
        "result_origin": "fallback",
        "budget_delta": None,
    }


def test_rewrite_accepts_full_scene_document_submission(tmp_path: Path) -> None:
    project_id = "proj_rewrite_full_scene"
    project_root = tmp_path / project_id
    body = "Original body line."
    _write_scene(project_root, body=body)

    full_scene_text = "\n".join(
        [
            "---",
            "id: sc_0001",
            "title: Scene",
            "---",
            body,
            "",
        ]
    )

    app = create_app(ServiceSettings(project_base_dir=tmp_path))
    client = TestClient(app)

    response = client.post(
        f"{API_PREFIX}/draft/rewrite",
        json=_rewrite_payload(project_id, scene_text=full_scene_text),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["unit_id"] == "sc_0001"
    assert payload["provenance"]["route_name"] == "draft/rewrite"
    assert payload["provenance"]["result_origin"] in {"provider", "fallback"}
