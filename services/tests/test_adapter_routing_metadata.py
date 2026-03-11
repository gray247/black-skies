from __future__ import annotations

import json
from pathlib import Path

import pytest

from blackskies.services.app import create_app
from blackskies.services.config import ServiceSettings
from blackskies.services.model_adapters import AdapterError
from blackskies.services.persistence import DraftPersistence

try:
    from fastapi.testclient import TestClient
except ModuleNotFoundError as exc:  # pragma: no cover - environment dependent
    pytest.skip(f"fastapi is required for service tests: {exc}", allow_module_level=True)


API_PREFIX = "/api/v1"


def _write_project_budget(project_root: Path) -> None:
    payload = {
        "project_id": project_root.name,
        "name": f"Project {project_root.name}",
        "budget": {"soft": 5.0, "hard": 10.0, "spent_usd": 0.0},
    }
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "project.json").write_text(
        json.dumps(payload, indent=2),
        encoding="utf-8",
    )


def _bootstrap_scene(tmp_path: Path, project_id: str, scene_id: str = "sc_0001") -> str:
    settings = ServiceSettings(project_base_dir=tmp_path)
    persistence = DraftPersistence(settings=settings)
    front_matter = {
        "id": scene_id,
        "slug": scene_id.replace("sc_", "scene-"),
        "title": "Scene 1",
        "order": 1,
        "chapter_id": "ch_0001",
        "purpose": "setup",
        "emotion_tag": "tension",
        "pov": "Mara",
        "beats": ["inciting"],
    }
    body = "The cellar hums with static and distant thunder."
    persistence.write_scene(project_id, front_matter, body)
    return body


def test_rewrite_adapter_empty_text_falls_back(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_id = "proj_rewrite_adapter_empty"
    body = _bootstrap_scene(tmp_path, project_id)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        model_router_provider_calls_enabled=True,
        model_router_metadata_enabled=True,
    )
    app = create_app(settings)

    monkeypatch.setattr(
        "blackskies.services.model_adapters.OllamaAdapter.rewrite",
        lambda self, _payload: {"text": "   "},
    )

    payload = {
        "project_id": project_id,
        "draft_id": "dr_001",
        "unit_id": "sc_0001",
        "instructions": "Tighten pacing.",
        "unit": {"id": "sc_0001", "text": body, "meta": {}},
    }

    with TestClient(app) as client:
        response = client.post(f"{API_PREFIX}/draft/rewrite", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["revised_text"].endswith("(Tighten pacing.)")
        routing = data["routing"]
        assert routing["policy"] == "local_only"
        assert routing["provider"] == "local_llm"
        assert routing["model"]
        assert routing["reason"]
        assert routing["fallback_used"] is False


def test_rewrite_adapter_exception_falls_back(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_id = "proj_rewrite_adapter_exc"
    body = _bootstrap_scene(tmp_path, project_id)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        model_router_provider_calls_enabled=True,
    )
    app = create_app(settings)

    def _raise(self, _payload):
        raise AdapterError("boom")

    monkeypatch.setattr(
        "blackskies.services.model_adapters.OllamaAdapter.rewrite",
        _raise,
    )

    payload = {
        "project_id": project_id,
        "draft_id": "dr_002",
        "unit_id": "sc_0001",
        "instructions": "Hold tone.",
        "unit": {"id": "sc_0001", "text": body, "meta": {}},
    }

    with TestClient(app) as client:
        response = client.post(f"{API_PREFIX}/draft/rewrite", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["revised_text"].endswith("(Hold tone.)")


def test_rewrite_adapter_success_uses_text(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_id = "proj_rewrite_adapter_success"
    body = _bootstrap_scene(tmp_path, project_id)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        model_router_provider_calls_enabled=True,
    )
    app = create_app(settings)

    monkeypatch.setattr(
        "blackskies.services.model_adapters.OllamaAdapter.rewrite",
        lambda self, _payload: {"text": "Rewritten sentence."},
    )

    payload = {
        "project_id": project_id,
        "draft_id": "dr_003",
        "unit_id": "sc_0001",
        "instructions": "Ignore.",
        "unit": {"id": "sc_0001", "text": body, "meta": {}},
    }

    with TestClient(app) as client:
        response = client.post(f"{API_PREFIX}/draft/rewrite", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["revised_text"] == "Rewritten sentence."


def test_critique_budget_includes_routing_metadata(tmp_path: Path) -> None:
    project_id = "proj_critique_routing"
    project_root = tmp_path / project_id
    _write_project_budget(project_root)
    _bootstrap_scene(tmp_path, project_id)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        model_router_metadata_enabled=True,
    )
    app = create_app(settings)

    payload = {
        "project_id": project_id,
        "draft_id": "dr_004",
        "unit_id": "sc_0001",
        "rubric": ["Logic"],
    }

    with TestClient(app) as client:
        response = client.post(f"{API_PREFIX}/draft/critique", json=payload)
        assert response.status_code == 200
        data = response.json()
        routing = data["budget"]["routing"]
        assert routing["policy"] == "local_only"
        assert routing["provider"] == "local_llm"
        assert routing["model"]
        assert routing["reason"]
        assert routing["fallback_used"] is False
