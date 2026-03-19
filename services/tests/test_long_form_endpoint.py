from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from blackskies.services.app import create_app
from blackskies.services.config import ServiceSettings
from blackskies.services.long_form import LongFormChunk
from blackskies.services.operations.long_form_execution import LongFormExecutionResult


def _client(tmp_path: Path) -> TestClient:
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    app = create_app(settings)
    return TestClient(app)


def test_long_form_execute_success(monkeypatch, tmp_path: Path) -> None:
    project_root = tmp_path / "proj_long_form"
    project_root.mkdir(parents=True, exist_ok=True)

    def _fake_execute(self, **_kwargs):
        chunk = LongFormChunk(
            chunk_id="lf_test",
            chapter_id="ch_0001",
            scene_ids=["sc_0001"],
            order=1,
            continuation_of=None,
            prompt_fingerprint="sha256:test",
            provider="ollama",
            model="qwen3:4b",
            continuity_snapshot={"summary": "Mara moves."},
            budget_snapshot={"estimated_usd": 0.2},
            routing_snapshot={"provider": "ollama"},
            review_snapshot={
                "status": "flagged",
                "failure_class": "patch_specificity_unresolved",
                "review_actions": ["accept_current_text", "regenerate_local_repair"],
            },
            carryover_snapshot={
                "carryover_risk": "medium",
                "carryover_mode": "restricted",
                "carryover_allowed": True,
            },
        )
        return LongFormExecutionResult(
            chunks=[chunk],
            stopped_reason=None,
            budget_summary={"chunk_count": 1, "estimated_usd": 0.2},
        )

    monkeypatch.setattr(
        "blackskies.services.routers.long_form.LongFormExecutionService.execute",
        _fake_execute,
    )

    client = _client(tmp_path)
    payload = {
        "project_id": "proj_long_form",
        "chapter_id": "ch_0001",
        "scene_ids": ["sc_0001"],
        "chunk_size": 1,
        "target_words_per_chunk": 900,
        "enabled": True,
    }
    response = client.post("/api/v1/long-form/execute", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["project_id"] == "proj_long_form"
    assert body["stopped_reason"] is None
    assert body["chunks"][0]["provider"] == "ollama"
    assert body["chunks"][0]["review_snapshot"]["failure_class"] == "patch_specificity_unresolved"
    assert body["chunks"][0]["carryover_snapshot"]["carryover_mode"] == "restricted"


def test_long_form_execute_validation_error(tmp_path: Path) -> None:
    client = _client(tmp_path)
    response = client.post(
        "/api/v1/long-form/execute",
        json={"project_id": "proj_long_form", "chapter_id": "bad", "scene_ids": []},
    )

    assert response.status_code == 400
    body = response.json()
    assert body["code"] == "VALIDATION"


def test_long_form_retry_local_repair_success(monkeypatch, tmp_path: Path) -> None:
    project_root = tmp_path / "proj_long_form"
    project_root.mkdir(parents=True, exist_ok=True)

    def _fake_retry(self, **_kwargs):
        return {
            "chunk_id": "lf_test",
            "scene_ids": ["sc_0001"],
            "status": "still_flagged",
            "attempt_count": 1,
            "source_failure_class": "patch_specificity_unresolved",
            "retry_snapshot": {"used": True, "succeeded": False},
            "retry_result_review_snapshot": {
                "status": "flagged",
                "failure_class": "patch_specificity_unresolved",
            },
            "retry_result_carryover_snapshot": {
                "carryover_risk": "medium",
                "carryover_mode": "restricted",
                "carryover_allowed": True,
                "failure_class": "patch_specificity_unresolved",
            },
            "carryover_changed": False,
        }

    monkeypatch.setattr(
        "blackskies.services.routers.long_form.LongFormExecutionService.retry_local_repair",
        _fake_retry,
    )

    client = _client(tmp_path)
    response = client.post(
        "/api/v1/long-form/retry-local-repair",
        json={"project_path": str(project_root), "chunk_id": "lf_deadbeef"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["chunk_id"] == "lf_test"
    assert body["status"] == "still_flagged"
    assert body["retry_result_review_snapshot"]["failure_class"] == "patch_specificity_unresolved"
