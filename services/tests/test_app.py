"""Tests for the Black Skies FastAPI application."""

from __future__ import annotations

import asyncio
import errno
import hashlib
import json
import importlib
import shutil
import threading
import time
import zipfile
from contextlib import contextmanager
import os
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch
from typing import Any, Protocol, TypedDict, cast
from uuid import UUID

import httpx
import pytest

try:
    from fastapi import status
    from fastapi.testclient import TestClient
except ModuleNotFoundError as exc:  # pragma: no cover - environment dependent
    pytest.skip(f"fastapi is required for service tests: {exc}", allow_module_level=True)

try:
    import yaml
except ModuleNotFoundError as exc:  # pragma: no cover - environment dependent
    pytest.skip(f"yaml is required for service tests: {exc}", allow_module_level=True)

from blackskies.services.analytics.service import AnalyticsSummaryService
from blackskies.services.app import SERVICE_VERSION, BuildTracker, create_app
from blackskies.services.config import ServiceSettings
from blackskies.services.diagnostics import DiagnosticLogger
import blackskies.services.snapshots as snapshots_module
from blackskies.services.persistence import DraftPersistence, SnapshotPersistence
from blackskies.services.routers.recovery import RecoveryTracker
import blackskies.services.routers.draft.generation as draft_generation_router
from blackskies.services.critique import CritiqueService
import blackskies.services.operations.draft_accept as draft_accept_module
from blackskies.services.operations.draft_accept import DraftAcceptService, DraftAcceptanceResult
from blackskies.services.operations.draft_generation import DraftGenerationService
from blackskies.services.scene_docs import DraftRequestError

app_module = importlib.import_module("blackskies.services.app")

TRACE_HEADER = "x-trace-id"
API_PREFIX = "/api/v1"
CONTRACT_FIXTURES_DIR = Path(__file__).parent / "contracts"


class _SceneRecord(TypedDict):
    id: str
    order: int
    title: str
    chapter_id: str
    beat_refs: list[str]


class _BuildTrackerState(Protocol):
    build_tracker: BuildTracker


def _assert_trace_header(response: Any) -> str:
    """Ensure the response includes a valid trace identifier header."""

    trace_id = response.headers.get(TRACE_HEADER)
    assert trace_id is not None
    UUID(trace_id)
    return trace_id


def _read_error(response: Any) -> dict[str, Any]:
    """Return the structured error payload with validated trace metadata."""

    payload = response.json()
    trace_id = _assert_trace_header(response)
    assert payload["trace_id"] == trace_id
    return payload


def _fetch_analytics_budget(test_client: TestClient, project_id: str) -> Any:
    """Retrieve the analytics budget payload for a given project."""

    return test_client.get(
        f"{API_PREFIX}/analytics/budget",
        params={"project_id": project_id},
    )


def test_service_index_reports_manifest(test_client: TestClient) -> None:
    """Root endpoint returns a manifest to aid manual verification."""

    response = test_client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "service": "black-skies",
        "version": SERVICE_VERSION,
        "api_base": "/api/v1",
    }
    _assert_trace_header(response)


def test_favicon_placeholder_returns_no_content(test_client: TestClient) -> None:
    """Favicon requests return a no-content response instead of 404."""

    response = test_client.get("/favicon.ico")
    assert response.status_code == 204
    assert response.content == b""
    _assert_trace_header(response)


def _build_payload() -> dict[str, Any]:
    """Return a representative outline build payload."""

    return {
        "project_id": "proj_123",
        "force_rebuild": False,
        "wizard_locks": {
            "acts": [{"title": "Act I"}, {"title": "Act II"}, {"title": "Act III"}],
            "chapters": [
                {"title": "Arrival", "act_index": 1},
                {"title": "Storm", "act_index": 2},
            ],
            "scenes": [
                {
                    "title": "Storm Cellar",
                    "chapter_index": 1,
                    "beat_refs": ["inciting"],
                },
                {"title": "Radio", "chapter_index": 2, "beat_refs": ["twist"]},
            ],
        },
    }


def _load_contract_snapshot(name: str) -> dict[str, Any]:
    """Load a contract snapshot from disk for response comparison."""

    snapshot_path = CONTRACT_FIXTURES_DIR / f"{name}.json"
    with snapshot_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _build_critique_payload(
    *,
    draft_id: str = "dr_004",
    unit_id: str = "sc_0001",
    rubric: list[str] | None = None,
    rubric_id: str | None = None,
) -> dict[str, Any]:
    """Return a critique request payload matching the rubric specification."""

    rubric_values = (
        rubric
        if rubric is not None
        else [
            "Logic",
            "Continuity",
            "Character",
        ]
    )
    payload = {"draft_id": draft_id, "unit_id": unit_id, "rubric": rubric_values}
    if rubric_id is not None:
        payload["rubric_id"] = rubric_id
    return payload


def _build_contract_outline_request(project_id: str) -> dict[str, Any]:
    """Return a wizard lock payload matching the docs contract."""

    return {
        "project_id": project_id,
        "force_rebuild": False,
        "wizard_locks": {
            "acts": [
                {"title": "Act I"},
                {"title": "Act II"},
                {"title": "Act III"},
            ],
            "chapters": [
                {"title": "Arrival", "act_index": 1},
            ],
            "scenes": [
                {
                    "title": "Storm Cellar",
                    "chapter_index": 1,
                    "beat_refs": ["inciting"],
                }
            ],
        },
    }


def _write_project_budget(
    base_dir: Path,
    project_id: str,
    *,
    soft_limit: float = 5.0,
    hard_limit: float = 10.0,
    spent_usd: float = 0.0,
) -> Path:
    """Create or overwrite the project budget configuration."""

    project_dir = base_dir / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    project_path = project_dir / "project.json"
    payload = {
        "project_id": project_id,
        "name": f"Project {project_id}",
        "budget": {
            "soft": soft_limit,
            "hard": hard_limit,
            "spent_usd": spent_usd,
        },
    }
    with project_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
    return project_path


def _bootstrap_outline(
    base_dir: Path,
    project_id: str,
    scene_count: int = 2,
    *,
    soft_limit: float = 5.0,
    hard_limit: float = 10.0,
    spent_usd: float = 0.0,
) -> list[str]:
    """Write a minimal outline artifact for draft generation tests."""

    project_dir = base_dir / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    outline_path = project_dir / "outline.json"

    _write_project_budget(
        base_dir,
        project_id,
        soft_limit=soft_limit,
        hard_limit=hard_limit,
        spent_usd=spent_usd,
    )

    scenes: list[_SceneRecord] = []
    for index in range(scene_count):
        order = index + 1
        scene_id = f"sc_{order:04d}"
        scenes.append(
            {
                "id": scene_id,
                "order": order,
                "title": f"Scene {order}",
                "chapter_id": "ch_0001",
                "beat_refs": ["inciting"] if index == 0 else [],
            }
        )

    outline = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_001",
        "acts": ["Act I"],
        "chapters": [{"id": "ch_0001", "order": 1, "title": "Chapter 1"}],
        "scenes": scenes,
    }

    with outline_path.open("w", encoding="utf-8") as handle:
        json.dump(outline, handle, indent=2)

    return [scene["id"] for scene in scenes]


def _bootstrap_blank_project(
    base_dir: Path,
    project_id: str,
    *,
    bootstrap_state: str = "empty",
) -> Path:
    """Write a minimal fresh-project contract without scaffolded story content."""

    project_dir = base_dir / project_id
    project_dir.mkdir(parents=True, exist_ok=True)

    _write_project_budget(base_dir, project_id)

    project_meta = {
        "schema_version": "ProjectMetadataSchema v1",
        "project_id": project_id,
        "name": f"Project {project_id}",
        "bootstrap_state": bootstrap_state,
        "budget": {
            "soft": 5.0,
            "hard": 10.0,
            "spent_usd": 0.0,
        },
    }
    (project_dir / "project.json").write_text(
        json.dumps(project_meta, indent=2),
        encoding="utf-8",
    )
    (project_dir / "outline.json").write_text(
        json.dumps(
            {
                "schema_version": "OutlineSchema v1",
                "outline_id": f"outline_{project_id}",
                "project_id": project_id,
                "acts": [],
                "chapters": [],
                "scenes": [],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return project_dir


def _bootstrap_scene(
    tmp_path: Path,
    project_id: str,
    scene_id: str = "sc_0001",
    *,
    order: int = 1,
    body: str | None = None,
) -> str:
    """Write a canonical scene markdown file for rewrite tests."""

    settings = ServiceSettings(project_base_dir=tmp_path)
    persistence = DraftPersistence(settings=settings)
    front_matter = {
        "id": scene_id,
        "slug": scene_id.replace("sc_", "scene-"),
        "title": f"Scene {order}",
        "order": order,
        "chapter_id": "ch_0001",
        "purpose": "setup",
        "emotion_tag": "tension",
        "pov": "Mara",
        "beats": ["inciting"],
    }
    scene_body = body or "The cellar hums with static and distant thunder."
    persistence.write_scene(project_id, front_matter, scene_body)
    return scene_body


def _compute_sha256(content: str) -> str:
    """Return the SHA-256 hex digest of normalised markdown text."""

    normalized = content.replace("\r\n", "\n").strip()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def test_health(test_client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """The versioned health endpoint returns the expected payload."""

    monkeypatch.setenv("BLACKSKIES_ENABLE_VOICE_NOTES", "1")

    response = test_client.get(f"{API_PREFIX}/healthz")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["version"] == SERVICE_VERSION
    assert payload["backup_status"] == "warning"
    assert payload["backup_enabled"] is False
    assert "backup_message" in payload
    assert payload["backup_checked_snapshots"] == 0
    assert payload["backup_failed_snapshots"] == 0
    assert payload["feature_maturity_contract"] == "diagnostics_only_v1"
    assert payload["feature_maturity"] == {
        "analytics": "production",
        "backup_verifier": "off",
        "memory_lab": "off",
        "plugins": "off",
        "voice_notes": "internal",
    }
    assert payload["backup_voice_notes_checked"] == 0
    assert payload["backup_voice_note_issues"] == 0
    _assert_trace_header(response)


def test_metrics_endpoint(test_client: TestClient) -> None:
    """Metrics endpoint returns Prometheus-formatted content with trace headers."""

    test_client.get(f"{API_PREFIX}/healthz")
    response = test_client.get(f"{API_PREFIX}/metrics")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain; version=0.0.4"
    body = response.text
    assert "blackskies_requests_total" in body
    assert "blackskies_service_info" in body
    _assert_trace_header(response)


def test_analytics_summary_handles_internal_error(
    test_client: TestClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Analytics summary surfaces INTERNAL responses when the service fails."""

    project_id = "proj_analytics_error"
    (tmp_path / project_id).mkdir(parents=True, exist_ok=True)

    def _raise_summary(self: AnalyticsSummaryService, project_id: str) -> dict[str, Any]:
        raise RuntimeError("analytics subsystem offline")

    monkeypatch.setattr(AnalyticsSummaryService, "build_summary", _raise_summary)

    response = test_client.get(
        f"{API_PREFIX}/analytics/summary",
        params={"project_id": project_id},
    )
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = _read_error(response)
    assert detail["code"] == "INTERNAL"


def test_analytics_routes_are_hidden_when_disabled(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Analytics endpoints respond 404 when the feature is not enabled."""

    monkeypatch.setenv("BLACKSKIES_ANALYTICS_MATURITY", "off")
    monkeypatch.setenv("BLACKSKIES_PROJECT_BASE_DIR", str(tmp_path))
    app = create_app()
    with TestClient(app) as client:
        summary_response = client.get(
            f"{API_PREFIX}/analytics/summary",
            params={"project_id": "proj_analytics_disabled"},
        )
        assert summary_response.status_code == status.HTTP_404_NOT_FOUND

        budget_response = client.get(
            f"{API_PREFIX}/analytics/budget",
            params={"project_id": "proj_analytics_disabled"},
        )
        assert budget_response.status_code == status.HTTP_404_NOT_FOUND


def test_export_omits_analytics_when_disabled(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Export defaults no longer include analytics_report without the feature flag."""

    project_id = "proj_export_no_analytics"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    _bootstrap_scene(tmp_path, project_id, scene_id=scene_ids[0], body="Scene text.")

    monkeypatch.setenv("BLACKSKIES_ANALYTICS_MATURITY", "off")
    monkeypatch.setenv("BLACKSKIES_PROJECT_BASE_DIR", str(tmp_path))
    app = create_app()
    with TestClient(app) as client:
        response = client.post(
            f"{API_PREFIX}/draft/export",
            json={"project_id": project_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert "analytics_report" not in data["artifacts"]

    analytics_path = tmp_path / project_id / "analytics_report.json"
    assert not analytics_path.exists()


def test_analytics_budget_tracks_spend_and_hints(
    test_client: TestClient,
    tmp_path: Path,
) -> None:
    """Analytics budget surfaces project spend, limits, and hint metadata."""

    project_id = "proj_analytics_budget_normal"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    _bootstrap_scene(tmp_path, project_id, scene_id=scene_ids[0])

    critique_payload = _build_critique_payload(unit_id=scene_ids[0])
    critique_payload["project_id"] = project_id
    critique_response = test_client.post(
        f"{API_PREFIX}/draft/critique",
        json=critique_payload,
    )
    assert critique_response.status_code == status.HTTP_200_OK
    critique_budget = critique_response.json()["budget"]

    analytics_response = _fetch_analytics_budget(test_client, project_id)
    assert analytics_response.status_code == status.HTTP_200_OK
    analytics_payload = analytics_response.json()
    assert analytics_payload["project_id"] == project_id
    budget_payload = analytics_payload["budget"]
    assert budget_payload["soft_limit_usd"] == pytest.approx(5.0)
    assert budget_payload["hard_limit_usd"] == pytest.approx(10.0)
    assert budget_payload["spent_usd"] == pytest.approx(critique_budget["spent_usd"])
    assert budget_payload["remaining_usd"] == pytest.approx(10.0 - budget_payload["spent_usd"])
    assert analytics_payload["hint"] == "ample"


def test_analytics_budget_near_cap_reflects_block(
    test_client: TestClient,
    tmp_path: Path,
) -> None:
    """Blocked budget attempts keep hint metadata aligned with thresholds."""

    project_id = "proj_analytics_budget_near_cap"
    scene_ids = _bootstrap_outline(
        tmp_path,
        project_id,
        scene_count=1,
        spent_usd=5.01,
    )

    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {scene_ids[0]: {"word_target": 300000}},
    }

    response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert response.status_code == status.HTTP_402_PAYMENT_REQUIRED
    detail = _read_error(response)
    assert detail["code"] == "BUDGET_EXCEEDED"

    analytics_response = _fetch_analytics_budget(test_client, project_id)
    assert analytics_response.status_code == status.HTTP_200_OK
    analytics_payload = analytics_response.json()
    assert analytics_payload["hint"] == "near_cap"
    budget_payload = analytics_payload["budget"]
    assert budget_payload["spent_usd"] == pytest.approx(5.01)
    assert budget_payload["remaining_usd"] == pytest.approx(10.0 - 5.01)


def test_analytics_budget_handles_store_errors(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Budget API surfaces structured code when storage fails."""

    project_id = "proj_analytics_budget_store_failure"
    _bootstrap_outline(tmp_path, project_id, scene_count=1)

    def _fail_load_state(*_args: Any, **_kwargs: Any) -> None:
        raise RuntimeError("budget store offline")

    monkeypatch.setattr(
        "blackskies.services.operations.budget_service.BudgetService.load_state",
        _fail_load_state,
    )

    response = _fetch_analytics_budget(test_client, project_id)
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = _read_error(response)
    assert detail["code"] == "INTERNAL"
    assert "Failed to load budget information." in detail["message"]
    assert detail["details"]["error"] == "budget store offline"


def test_analytics_runtime_event_failure_logs_and_continues(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Analytics write failures log diagnostics but do not break text flows."""

    project_id = "proj_analytics_runtime_failure"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    _bootstrap_scene(tmp_path, project_id, scene_id=scene_ids[0])

    captured: list[dict[str, Any]] = []
    original_log = DiagnosticLogger.log

    def _capture_log(
        self: DiagnosticLogger,
        project_root: Path,
        *,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> Path:
        path = original_log(
            self,
            project_root,
            code=code,
            message=message,
            details=details,
        )
        captured.append({"code": code, "message": message, "details": details or {}})
        return path

    monkeypatch.setattr(DiagnosticLogger, "log", _capture_log)

    def _broken_logger(*_args: Any, **_kwargs: Any) -> None:
        raise RuntimeError("analytics disk failure")

    for target in (
        "blackskies.services.analytics.runtime.log_runtime_event",
        "blackskies.services.operations.draft_generation.log_runtime_event",
        "blackskies.services.routers.draft.revision.log_runtime_event",
    ):
        monkeypatch.setattr(target, _broken_logger)

    generate_payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
    }
    generate_response = test_client.post(
        f"{API_PREFIX}/draft/generate",
        json=generate_payload,
    )
    assert generate_response.status_code == status.HTTP_200_OK

    critique_payload = _build_critique_payload(unit_id=scene_ids[0])
    critique_payload["project_id"] = project_id
    critique_response = test_client.post(
        f"{API_PREFIX}/draft/critique",
        json=critique_payload,
    )
    assert critique_response.status_code == status.HTTP_200_OK

    analytics_response = _fetch_analytics_budget(test_client, project_id)
    assert analytics_response.status_code == status.HTTP_200_OK

    analytics_failures = [entry for entry in captured if entry["code"] == "ANALYTICS"]
    assert len(analytics_failures) >= 2
    assert all(
        "Failed to record analytics runtime event." in entry["message"]
        for entry in analytics_failures
    )


@pytest.mark.contract
def test_contract_outline_build(test_client: TestClient, tmp_path: Path) -> None:
    """Outline build matches the golden contract snapshot."""

    project_id = "proj_contract_outline"
    payload = _build_contract_outline_request(project_id)

    response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
    assert response.status_code == 200
    assert response.json() == _load_contract_snapshot("outline_build")
    _assert_trace_header(response)

    outline_path = tmp_path / project_id / "outline.json"
    assert outline_path.exists()


def test_outline_build_success(test_client: TestClient, tmp_path: Path) -> None:
    """Building an outline persists an OutlineSchema artifact."""

    payload = _build_payload()
    response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["schema_version"] == "OutlineSchema v1"
    assert data["outline_id"] == "out_001"
    assert data["acts"] == ["Act I", "Act II", "Act III"]
    assert data["chapters"][0]["id"] == "ch_0001"
    assert data["scenes"][0]["beat_refs"] == ["inciting"]

    outline_path = tmp_path / payload["project_id"] / "outline.json"
    assert outline_path.exists()
    with outline_path.open("r", encoding="utf-8") as handle:
        persisted = json.load(handle)
    assert persisted == data


def test_outline_build_missing_locks(test_client: TestClient, tmp_path: Path) -> None:
    """Missing wizard locks are rejected with validation errors and diagnostics."""

    project_id = "proj_missing"
    payload = {
        "project_id": project_id,
        "force_rebuild": False,
        "wizard_locks": {"acts": [{"title": "Act I"}], "chapters": [], "scenes": []},
    }

    response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert "missing" in detail["details"]

    diagnostics_dir = tmp_path / project_id / "history" / "diagnostics"
    files = list(diagnostics_dir.glob("*.json"))
    assert len(files) == 1
    with files[0].open("r", encoding="utf-8") as handle:
        diagnostic = json.load(handle)
    assert diagnostic["code"] == "VALIDATION"


def test_outline_build_conflict(test_client: TestClient, tmp_path: Path) -> None:
    """Concurrent outline builds return a conflict and log diagnostics."""

    payload = _build_payload()
    payload["project_id"] = "proj_conflict"

    tracker = cast(BuildTracker, cast(_BuildTrackerState, test_client.app.state).build_tracker)
    asyncio.run(tracker.begin(payload["project_id"]))
    try:
        response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
    finally:
        asyncio.run(tracker.end(payload["project_id"]))

    assert response.status_code == 409
    detail = _read_error(response)
    assert detail["code"] == "CONFLICT"

    diagnostics_dir = tmp_path / payload["project_id"] / "history" / "diagnostics"
    files = list(diagnostics_dir.glob("*.json"))
    assert len(files) == 1
    with files[0].open("r", encoding="utf-8") as handle:
        diagnostic = json.load(handle)
    assert diagnostic["code"] == "CONFLICT"


def test_draft_generate_scene_success(test_client: TestClient, tmp_path: Path) -> None:
    """Draft generation writes Markdown and returns deterministic metadata."""

    project_id = "proj_draft_success"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=2)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "seed": 11,
        "overrides": {
            scene_ids[0]: {
                "purpose": "escalation",
                "emotion_tag": "tension",
                "order": 3,
            }
        },
    }

    response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["schema_version"] == "DraftUnitSchema v1"
    assert data["draft_id"].startswith("dr_")
    assert len(data["units"]) == len(scene_ids)

    first_unit = data["units"][0]
    assert first_unit["id"] == scene_ids[0]
    assert first_unit["meta"]["purpose"] == "escalation"
    assert first_unit["meta"]["emotion_tag"] == "tension"
    assert first_unit["seed"] == payload["seed"]
    assert first_unit["prompt_fingerprint"].startswith("sha256:")

    draft_path = tmp_path / project_id / "drafts" / f"{scene_ids[0]}.md"
    assert draft_path.exists()
    content = draft_path.read_text(encoding="utf-8")
    assert "purpose: escalation" in content
    assert "emotion_tag: tension" in content
    assert "order: 3" in content
    assert "Scene 1" in content

    snapshots_dir = tmp_path / project_id / "history" / "snapshots"
    assert not snapshots_dir.exists()
    budget = data["budget"]
    assert budget["estimated_usd"] >= 0.0
    assert budget["status"] == "ok"
    assert budget["soft_limit_usd"] == pytest.approx(5.0)
    assert budget["hard_limit_usd"] == pytest.approx(10.0)
    current_spend = budget["spent_usd"]
    assert current_spend == pytest.approx(0.0)
    assert budget["total_after_usd"] == pytest.approx(current_spend + budget["estimated_usd"])

    project_config = tmp_path / project_id / "project.json"
    with project_config.open("r", encoding="utf-8") as handle:
        project_meta = json.load(handle)
    assert project_meta["budget"]["spent_usd"] == pytest.approx(current_spend)


def test_draft_generate_rehydrates_cached_units(test_client: TestClient, tmp_path: Path) -> None:
    """Cached draft responses rewrite missing scene files before being returned."""

    project_id = "proj_draft_rehydrate"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
    }

    first_response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert first_response.status_code == 200
    first_data = first_response.json()

    scene_path = tmp_path / project_id / "drafts" / f"{scene_ids[0]}.md"
    original_content = scene_path.read_text(encoding="utf-8")
    scene_path.unlink()

    second_response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert second_response.status_code == 200
    second_data = second_response.json()

    assert second_data == first_data
    assert scene_path.exists()
    regenerated = scene_path.read_text(encoding="utf-8")
    assert regenerated == original_content

    project_config = tmp_path / project_id / "project.json"
    with project_config.open("r", encoding="utf-8") as handle:
        project_meta = json.load(handle)
    assert project_meta["budget"]["spent_usd"] == pytest.approx(first_data["budget"]["spent_usd"])


def test_draft_generate_handles_request_error(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Draft generation surfaces service-level DraftRequestError as validation failures."""

    project_id = "proj_draft_request_error"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
    }

    async def _raise_request_error(self, *_args: Any, **_kwargs: Any) -> Any:
        raise DraftRequestError("Scene markdown is missing.", {"unit_id": scene_ids[0]})

    monkeypatch.setattr(DraftGenerationService, "generate", _raise_request_error)

    response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["details"]["unit_id"] == scene_ids[0]


def test_draft_generate_scene_limit(test_client: TestClient, tmp_path: Path) -> None:
    """Scene batches above the limit are rejected with validation errors."""

    project_id = "proj_draft_limit"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=6)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids[:6],
    }

    response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert response.status_code == 400

    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    errors = detail["details"]["errors"]
    assert any("at most 5" in error["msg"] for error in errors)

    drafts_dir = tmp_path / project_id / "drafts"
    assert not drafts_dir.exists()

    project_config = tmp_path / project_id / "project.json"
    with project_config.open("r", encoding="utf-8") as handle:
        project_meta = json.load(handle)
    assert project_meta["budget"]["spent_usd"] == pytest.approx(0.0)


def test_draft_generate_missing_scene(test_client: TestClient, tmp_path: Path) -> None:
    """Unknown scene identifiers surface a validation error with context."""

    project_id = "proj_draft_missing"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=2)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": [scene_ids[0], "sc_9999"],
    }

    response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert response.status_code == 400

    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["details"]["missing_scene_ids"] == ["sc_9999"]

    drafts_dir = tmp_path / project_id / "drafts"
    assert not drafts_dir.exists()

    project_config = tmp_path / project_id / "project.json"
    with project_config.open("r", encoding="utf-8") as handle:
        project_meta = json.load(handle)
    assert project_meta["budget"]["spent_usd"] == pytest.approx(0.0)


def test_draft_generate_rejects_blank_project_without_scenes(
    test_client: TestClient, tmp_path: Path
) -> None:
    """Fresh blank projects fail honestly when generation is requested prematurely."""

    project_id = "proj_draft_blank_generate"
    _bootstrap_blank_project(tmp_path, project_id)

    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": ["sc_0001"],
    }

    response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert response.status_code == 400

    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["message"] == "Outline artifact failed schema validation."

    project_config = tmp_path / project_id / "project.json"
    with project_config.open("r", encoding="utf-8") as handle:
        project_meta = json.load(handle)
    assert project_meta["bootstrap_state"] == "empty"
    assert project_meta["budget"]["spent_usd"] == pytest.approx(0.0)

    drafts_dir = tmp_path / project_id / "drafts"
    assert not drafts_dir.exists()


def test_draft_generate_budget_blocked(test_client: TestClient, tmp_path: Path) -> None:
    """Generation refuses to run when the hard budget would be exceeded."""

    project_id = "proj_draft_blocked"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1, spent_usd=9.75)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {scene_ids[0]: {"word_target": 30000}},
    }

    response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert response.status_code == 402

    detail = _read_error(response)
    assert detail["code"] == "BUDGET_EXCEEDED"

    drafts_dir = tmp_path / project_id / "drafts"
    assert not drafts_dir.exists()

    project_config = tmp_path / project_id / "project.json"
    with project_config.open("r", encoding="utf-8") as handle:
        project_meta = json.load(handle)
    assert project_meta["budget"]["spent_usd"] == pytest.approx(9.75)


def test_draft_generate_soft_limit_status(test_client: TestClient, tmp_path: Path) -> None:
    """Generation succeeds but surfaces soft-limit status when nearing the cap."""

    project_id = "proj_draft_soft_limit"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1, spent_usd=4.9)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {scene_ids[0]: {"word_target": 10000}},
    }

    response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert response.status_code == 200

    data = response.json()
    budget = data["budget"]
    assert budget["status"] == "soft-limit"
    assert budget["soft_limit_usd"] == pytest.approx(5.0)
    assert budget["hard_limit_usd"] == pytest.approx(10.0)
    assert budget["spent_usd"] == pytest.approx(4.9)
    assert budget["total_after_usd"] == pytest.approx(budget["estimated_usd"] + 4.9)

    project_config = tmp_path / project_id / "project.json"
    with project_config.open("r", encoding="utf-8") as handle:
        project_meta = json.load(handle)
    assert project_meta["budget"]["spent_usd"] == pytest.approx(4.9)


@pytest.mark.contract
def test_contract_draft_preflight_ok(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Draft preflight matches the documented ok contract payload."""

    project_id = "proj_contract_preflight_ok"
    monkeypatch.setattr(ServiceSettings, "ENV_FILE", None, raising=False)
    # Force the local/Ollama path so this contract stays deterministic even when
    # the host environment carries an OpenAI API key.
    monkeypatch.delenv("BLACKSKIES_OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("BLACKSKIES_PROJECT_BASE_DIR", str(tmp_path))
    monkeypatch.setenv("BLACKSKIES_MODEL_ROUTING_POLICY", "local_only")
    monkeypatch.setenv("BLACKSKIES_LOCAL_PROVIDER", "ollama")
    monkeypatch.setenv("BLACKSKIES_LOCAL_MODEL", "qwen3:4b")
    app = create_app()
    with TestClient(app) as test_client:
        build_payload = _build_contract_outline_request(project_id)
        build_response = test_client.post(f"{API_PREFIX}/outline/build", json=build_payload)
        assert build_response.status_code == 200

        _write_project_budget(
            tmp_path,
            project_id,
            soft_limit=5.0,
            hard_limit=10.0,
            spent_usd=0.18,
        )

        request_payload = {
            "project_id": project_id,
            "unit_scope": "scene",
            "unit_ids": ["sc_0001"],
            "overrides": {"sc_0001": {"word_target": 62000}},
        }

        response = test_client.post(f"{API_PREFIX}/draft/preflight", json=request_payload)
        assert response.status_code == 200
        assert response.json() == _load_contract_snapshot("draft_preflight_ok")
        _assert_trace_header(response)


@pytest.mark.contract
def test_contract_draft_critique(test_client: TestClient, tmp_path: Path) -> None:
    """Draft critique endpoint returns the documented fixture payload."""

    project_id = "proj_contract_critique"
    _bootstrap_outline(tmp_path, project_id, scene_count=1)
    _bootstrap_scene(tmp_path, project_id, scene_id="sc_0001")

    payload = _build_critique_payload()
    payload["project_id"] = project_id
    response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert response.status_code == 200
    assert response.json() == _load_contract_snapshot("draft_critique")
    _assert_trace_header(response)


def test_draft_critique_validation_unknown_category(test_client: TestClient) -> None:
    """Critique rejects requests with rubric entries outside the specification."""

    payload = _build_critique_payload(rubric=["Logic", "Unknown"])
    response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert response.status_code == 400

    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    errors = detail["details"]["errors"]
    assert any("Unknown rubric categories" in error["msg"] for error in errors)


def test_draft_critique_loads_custom_rubric(
    test_client: TestClient,
    tmp_path: Path,
) -> None:
    """Critique loads rubric definitions from project metadata when provided."""

    project_id = "proj_custom_rubric"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    _bootstrap_scene(tmp_path, project_id, scene_id=scene_ids[0])

    rubric_dir = tmp_path / project_id / "history" / "rubrics"
    rubric_dir.mkdir(parents=True, exist_ok=True)
    rubric_definition = {
        "rubric_id": "team.story",
        "label": "Team Story Rubric",
        "categories": ["Theme", "Emotional Arc"],
        "steps": [],
    }
    (rubric_dir / "team.story.json").write_text(
        json.dumps(rubric_definition, indent=2),
        encoding="utf-8",
    )

    payload = _build_critique_payload(rubric=None, rubric_id="team.story")
    payload["project_id"] = project_id
    response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["rubric_id"] == "team.story"
    assert data["rubric"] == ["Theme", "Emotional Arc"]

    summary_path = tmp_path / project_id / "history" / "critiques" / f"{payload['unit_id']}.json"
    stored = json.loads(summary_path.read_text(encoding="utf-8"))
    assert stored["rubric_id"] == "team.story"
    assert stored["rubric"] == ["Theme", "Emotional Arc"]


def test_draft_critique_unknown_rubric_id(
    test_client: TestClient,
) -> None:
    """Critique rejects requests referencing unknown rubric identifiers."""

    payload = _build_critique_payload(rubric=None, rubric_id="missing.rubric")
    response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    detail = response.json()
    assert detail["code"] == "VALIDATION"
    assert any(
        error["loc"] == ["rubric_id"] for error in detail.get("details", {}).get("errors", [])
    )


def test_draft_critique_persists_summary(test_client: TestClient, tmp_path: Path) -> None:
    """Critique summaries are stored for export when a project id is provided."""

    project_id = "proj_batch_store"
    project_root = tmp_path / project_id
    project_root.mkdir()

    payload = _build_critique_payload()
    payload["project_id"] = project_id

    _bootstrap_scene(tmp_path, project_id, scene_id=payload["unit_id"], order=1)

    response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert "budget" in result
    critique_budget = result["budget"]
    assert critique_budget["estimated_usd"] > 0
    assert critique_budget["spent_usd"] == pytest.approx(critique_budget["total_after_usd"])

    summary_path = project_root / "history" / "critiques" / f"{payload['unit_id']}.json"
    assert summary_path.exists()

    stored = json.loads(summary_path.read_text(encoding="utf-8"))
    assert stored["schema_version"] == "BatchCritiqueSummary v1"
    assert stored["project_id"] == project_id
    assert stored["unit_id"] == payload["unit_id"]
    assert stored["summary"] == result["summary"]
    assert stored["rubric"] == payload["rubric"]
    assert stored["rubric_id"] == result.get("rubric_id")
    assert "budget" in stored
    assert stored["budget"]["estimated_usd"] == pytest.approx(critique_budget["estimated_usd"])
    assert stored["budget"]["spent_usd"] == pytest.approx(critique_budget["spent_usd"])


def test_draft_critique_missing_scene_budget_failure(
    test_client: TestClient, tmp_path: Path
) -> None:
    """Critique surfaces validation errors when budget telemetry cannot read the scene."""

    project_id = "proj_batch_missing_scene"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    # Intentionally omit creating drafts/sc_0001.md so read_scene_document raises.
    payload = _build_critique_payload(unit_id=scene_ids[0])
    payload["project_id"] = project_id

    response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    detail = response.json()
    assert detail["code"] == "VALIDATION"
    assert "Scene markdown is missing" in detail["message"]


def test_draft_critique_rejects_missing_draft_state(
    test_client: TestClient, tmp_path: Path
) -> None:
    """Scaffolded projects fail honestly when their draft state is absent."""

    project_id = "proj_critique_missing_draft"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    project_meta_path = tmp_path / project_id / "project.json"
    project_meta = json.loads(project_meta_path.read_text(encoding="utf-8"))
    project_meta["bootstrap_state"] = "scaffold_initialized"
    project_meta["bootstrap_template"] = "starter-scaffold-v1"
    project_meta_path.write_text(json.dumps(project_meta, indent=2), encoding="utf-8")

    payload = _build_critique_payload(unit_id=scene_ids[0])
    payload["project_id"] = project_id

    response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["message"] == "Scene markdown is missing."

    summary_path = tmp_path / project_id / "history" / "critiques" / f"{scene_ids[0]}.json"
    assert not summary_path.exists()

    project_meta_after = json.loads(project_meta_path.read_text(encoding="utf-8"))
    assert project_meta_after["bootstrap_state"] == "scaffold_initialized"
    assert project_meta_after["bootstrap_template"] == "starter-scaffold-v1"


def test_draft_critique_budget_logging(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Critique budgets surface diagnostics when persistence fails."""

    project_id = "proj_batch_logging"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    _bootstrap_scene(tmp_path, project_id, scene_id=scene_ids[0])

    captured_logs: list[dict[str, Any]] = []

    def _capture_log(
        self: DiagnosticLogger,
        project_root: Path,
        *,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        captured_logs.append({"code": code, "message": message, "details": details})

    monkeypatch.setattr(DiagnosticLogger, "log", _capture_log)

    def _fail_persist(*args: Any, **kwargs: Any) -> None:
        raise OSError("disk failure secret-token")

    monkeypatch.setattr(
        "blackskies.services.routers.draft.revision.persist_project_budget",
        _fail_persist,
    )

    payload = _build_critique_payload(unit_id=scene_ids[0])
    payload["project_id"] = project_id

    response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert response.status_code == status.HTTP_200_OK
    assert response.json().get("budget") is None

    error_logs = [
        entry
        for entry in captured_logs
        if entry["code"] == "INTERNAL" and "critique budget telemetry" in (entry["message"] or "")
    ]
    assert error_logs, "Expected telemetry log when budget persistence fails."
    assert any(
        entry.get("details", {}).get("error") == "disk failure secret-token" for entry in error_logs
    )


def test_draft_critique_budget_handles_generic_errors(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Budget telemetry errors return a structured INTERNAL response instead of generic failures."""

    project_id = "proj_batch_budget_error"
    scene_id = _bootstrap_outline(tmp_path, project_id, scene_count=1)[0]
    _bootstrap_scene(tmp_path, project_id, scene_id=scene_id)

    @contextmanager
    def _failing_edit_state(*_args: Any, **_kwargs: Any):
        raise RuntimeError("budget subsystem offline")
        yield  # pragma: no cover - unreachable

    monkeypatch.setattr(
        "blackskies.services.operations.budget_service.BudgetService.edit_state",
        _failing_edit_state,
    )

    payload = _build_critique_payload(unit_id=scene_id)
    payload["project_id"] = project_id

    response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = _read_error(response)
    assert detail["code"] == "INTERNAL"
    assert detail["message"] == "Failed to record critique budget telemetry."


def test_budget_guardrail_smoke(test_client: TestClient, tmp_path: Path) -> None:
    """Multi-route write paths respect the hard budget guardrail."""

    project_id = "proj_budget_guardrail_smoke"
    scene_ids = _bootstrap_outline(
        tmp_path,
        project_id,
        scene_count=1,
        soft_limit=0.05,
        hard_limit=0.06,
        spent_usd=0.03,
    )

    draft_payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {scene_ids[0]: {"word_target": 1200}},
    }

    first_response = test_client.post(f"{API_PREFIX}/draft/generate", json=draft_payload)
    assert first_response.status_code == status.HTTP_200_OK
    first_budget = first_response.json()["budget"]
    assert first_budget["status"] in {"ok", "soft-limit"}

    long_body = " ".join("word" for _ in range(1200))
    _bootstrap_scene(tmp_path, project_id, scene_id=scene_ids[0], body=long_body)

    critique_payload = _build_critique_payload(
        draft_id=first_response.json()["draft_id"],
        unit_id=scene_ids[0],
    )
    critique_payload["project_id"] = project_id

    critique_response = test_client.post(f"{API_PREFIX}/draft/critique", json=critique_payload)
    assert critique_response.status_code == status.HTTP_200_OK
    critique_budget = critique_response.json()["budget"]
    assert critique_budget["status"] in {"ok", "soft-limit"}

    project_meta_path = tmp_path / project_id / "project.json"
    project_meta = json.loads(project_meta_path.read_text(encoding="utf-8"))
    assert project_meta["budget"]["spent_usd"] == pytest.approx(critique_budget["spent_usd"])

    blocked_payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {scene_ids[0]: {"word_target": 500000}},
    }
    blocked_generate = test_client.post(f"{API_PREFIX}/draft/generate", json=blocked_payload)
    assert blocked_generate.status_code == status.HTTP_402_PAYMENT_REQUIRED

    blocked_critique = test_client.post(f"{API_PREFIX}/draft/critique", json=critique_payload)
    assert blocked_critique.status_code == status.HTTP_402_PAYMENT_REQUIRED

    analytics_response = _fetch_analytics_budget(test_client, project_id)
    assert analytics_response.status_code == status.HTTP_200_OK
    analytics_payload = analytics_response.json()
    assert analytics_payload["hint"] == "near_cap"
    assert analytics_payload["budget"]["spent_usd"] == pytest.approx(critique_budget["spent_usd"])


@pytest.mark.anyio("asyncio")
async def test_draft_critique_handles_concurrent_requests(
    async_client: "httpx.AsyncClient",
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Batch critiques can run concurrently and persist summaries for each scene."""

    project_id = "proj_batch_concurrency"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=3)
    for index, scene_id in enumerate(scene_ids, start=1):
        _bootstrap_scene(
            tmp_path,
            project_id,
            scene_id=scene_id,
            order=index,
            body=f"Scene {index} body with escalating tension.",
        )

    active_calls = 0
    peak_calls = 0
    lock = threading.Lock()

    def _concurrent_run(self: CritiqueService, request: Any, **_: Any) -> dict[str, Any]:
        nonlocal active_calls, peak_calls
        with lock:
            active_calls += 1
            peak_calls = max(peak_calls, active_calls)
        try:
            time.sleep(0.05)
            return {
                "unit_id": request.unit_id,
                "schema_version": "CritiqueOutputSchema v1",
                "summary": f"Summary for {request.unit_id}",
                "priorities": ["Continuity"],
                "model": {"name": "critique-concurrency", "provider": "test-double"},
            }
        finally:
            with lock:
                active_calls -= 1

    monkeypatch.setattr(CritiqueService, "run", _concurrent_run)

    payloads = []
    for index, scene_id in enumerate(scene_ids, start=1):
        payload = _build_critique_payload(
            draft_id=f"dr_{index + 100:03d}",
            unit_id=scene_id,
            rubric=["Continuity", "Voice"],
        )
        payload["project_id"] = project_id
        payloads.append(payload)

    responses = await asyncio.gather(
        *(async_client.post(f"{API_PREFIX}/draft/critique", json=payload) for payload in payloads)
    )

    estimated_costs: list[float] = []
    for response, payload in zip(responses, payloads, strict=True):
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["unit_id"] == payload["unit_id"]
        assert data["schema_version"].startswith("CritiqueOutputSchema")
        assert data["model"]["name"] == "critique-concurrency"
        budget = data["budget"]
        assert budget["estimated_usd"] > 0
        estimated_costs.append(budget["estimated_usd"])

        summary_path = (
            tmp_path / project_id / "history" / "critiques" / f"{payload['unit_id']}.json"
        )
        assert summary_path.exists()
        stored = json.loads(summary_path.read_text(encoding="utf-8"))
        assert stored["draft_id"] == payload["draft_id"]
        assert stored["rubric"] == payload["rubric"]
        assert stored["model"]["name"] == "critique-concurrency"
        assert "budget" in stored
        assert stored["budget"]["estimated_usd"] == pytest.approx(budget["estimated_usd"])

    assert peak_calls >= 2, "Expected critique service to process requests in parallel"

    project_meta_path = tmp_path / project_id / "project.json"
    assert project_meta_path.exists()
    project_meta = json.loads(project_meta_path.read_text(encoding="utf-8"))
    assert project_meta["budget"]["spent_usd"] == pytest.approx(sum(estimated_costs))


def test_draft_critique_repeated_updates_budget(test_client: TestClient, tmp_path: Path) -> None:
    """Repeated critiques accumulate spend without requiring generation."""

    project_id = "proj_critique_repeat"
    _bootstrap_outline(tmp_path, project_id, scene_count=1)
    _bootstrap_scene(tmp_path, project_id, scene_id="sc_0001")

    payload = _build_critique_payload(unit_id="sc_0001")
    payload["project_id"] = project_id

    first_response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert first_response.status_code == status.HTTP_200_OK
    first_budget = first_response.json()["budget"]
    assert first_budget["estimated_usd"] > 0

    second_response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert second_response.status_code == status.HTTP_200_OK
    second_budget = second_response.json()["budget"]

    assert second_budget["spent_usd"] == pytest.approx(first_budget["estimated_usd"] * 2)
    assert second_budget["total_after_usd"] == pytest.approx(second_budget["spent_usd"])

    project_meta_path = tmp_path / project_id / "project.json"
    project_meta = json.loads(project_meta_path.read_text(encoding="utf-8"))
    assert project_meta["budget"]["spent_usd"] == pytest.approx(second_budget["spent_usd"])

    summary_path = tmp_path / project_id / "history" / "critiques" / "sc_0001.json"
    assert summary_path.exists()
    stored = json.loads(summary_path.read_text(encoding="utf-8"))
    assert stored["budget"]["spent_usd"] == pytest.approx(second_budget["spent_usd"])
    assert isinstance(stored.get("captured_at"), str)


def test_draft_preflight_success(test_client: TestClient, tmp_path: Path) -> None:
    """Preflight returns an estimate within budget for valid scenes."""

    project_id = "proj_preflight_success"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=2)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
    }

    response = test_client.post(f"{API_PREFIX}/draft/preflight", json=payload)
    assert response.status_code == 200

    data = response.json()
    budget = data["budget"]
    assert data["project_id"] == project_id
    assert data["model"]["name"] == "qwen3:4b"
    assert data["model"]["provider"] == "ollama"
    assert len(data["scenes"]) == len(scene_ids)
    assert data["scenes"][0]["id"] == scene_ids[0]
    assert data["scenes"][0]["title"].startswith("Scene ")
    assert budget["status"] == "ok"
    assert budget["estimated_usd"] > 0
    assert budget["soft_limit_usd"] == 5.0
    assert budget["hard_limit_usd"] == 10.0
    assert budget["spent_usd"] == pytest.approx(0.0)
    assert budget["total_after_usd"] == pytest.approx(budget["estimated_usd"])


def test_draft_preflight_soft_limit(test_client: TestClient, tmp_path: Path) -> None:
    """Preflight surfaces a soft limit warning when estimate crosses the threshold."""

    project_id = "proj_preflight_soft"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {scene_ids[0]: {"word_target": 300000}},
    }

    response = test_client.post(f"{API_PREFIX}/draft/preflight", json=payload)
    assert response.status_code == 200

    preflight_payload = cast(dict[str, Any], response.json())
    budget = preflight_payload["budget"]
    assert preflight_payload["model"]["name"] == "qwen3:4b"
    assert len(preflight_payload["scenes"]) == 1
    assert budget["status"] == "soft-limit"
    assert budget["estimated_usd"] >= 5.0
    assert budget["soft_limit_usd"] == pytest.approx(5.0)
    assert budget["hard_limit_usd"] == pytest.approx(10.0)
    assert budget["spent_usd"] == pytest.approx(0.0)
    assert budget["total_after_usd"] == pytest.approx(budget["estimated_usd"])


def test_wizard_to_draft_flow(test_client: TestClient, tmp_path: Path) -> None:
    """Wizard/binder flow can build an outline and produce a draft without errors."""

    project_id = "proj_wizard_draft_flow"
    payload = _build_payload()
    payload["project_id"] = project_id

    response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
    assert response.status_code == 200
    build_payload = response.json()
    scene_ids = [scene["id"] for scene in build_payload["scenes"]]

    draft_payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids[:1],
        "overrides": {scene_ids[0]: {"word_target": 1200}},
    }

    generate_response = test_client.post(f"{API_PREFIX}/draft/generate", json=draft_payload)
    assert generate_response.status_code == status.HTTP_200_OK
    generate_data = generate_response.json()
    assert generate_data["project_id"] == project_id
    assert generate_data["budget"]["status"] == "ok"
    assert generate_data["model"]["name"] == "qwen3:4b"
    assert generate_data["model"]["provider"] == "ollama"
    units = generate_data["units"]
    assert units
    first_unit = units[0]
    assert first_unit["text"].strip()
    meta = first_unit["meta"]
    for field_name in ("pov", "conflict", "pacing_target"):
        assert meta.get(field_name)

    summary_response = test_client.get(
        f"{API_PREFIX}/analytics/summary",
        params={"project_id": project_id},
    )
    assert summary_response.status_code == status.HTTP_200_OK
    summary = summary_response.json()
    assert summary["runtime_hints"]["budget"]["soft_limit_usd"] > 0
    assert summary["pacing"]["scene_metrics"]
    pacing_scene = summary["pacing"]["scene_metrics"][0]
    assert pacing_scene["scene_id"] == scene_ids[0]
    assert summary["emotion_arc"]
    assert summary["cost_overlays"]["budget"]["spent_usd"] == pytest.approx(
        generate_data["budget"]["spent_usd"]
    )


def test_draft_to_critique_flow(test_client: TestClient, tmp_path: Path) -> None:
    """Draft production flows into critique with heuristics and budget metadata."""

    project_id = "proj_draft_critique_flow"
    payload = _build_payload()
    payload["project_id"] = project_id
    build_response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
    assert build_response.status_code == 200
    build_payload = cast(dict[str, Any], build_response.json())
    scene_ids = [scene["id"] for scene in cast(list[dict[str, Any]], build_payload["scenes"])]

    draft_payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids[:1],
    }
    generate_response = test_client.post(f"{API_PREFIX}/draft/generate", json=draft_payload)
    assert generate_response.status_code == status.HTTP_200_OK
    draft_data = generate_response.json()

    critique_payload = _build_critique_payload(
        draft_id=draft_data["draft_id"],
        unit_id=scene_ids[0],
    )
    critique_payload["project_id"] = project_id

    critique_response = test_client.post(f"{API_PREFIX}/draft/critique", json=critique_payload)
    assert critique_response.status_code == status.HTTP_200_OK
    critique_data = critique_response.json()
    assert critique_data["summary"]
    assert critique_data["heuristics"]
    assert critique_data["budget"]["status"] == "ok"
    assert critique_data["budget"]["estimated_usd"] > 0
    assert critique_data["model"]["name"] == "qwen3:4b"
    assert critique_data["model"]["provider"] == "ollama"


def test_draft_preflight_blocked(test_client: TestClient, tmp_path: Path) -> None:
    """Preflight reports blocked status when hard limit would be exceeded."""

    project_id = "proj_preflight_blocked"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {scene_ids[0]: {"word_target": 600000}},
    }

    response = test_client.post(f"{API_PREFIX}/draft/preflight", json=payload)
    assert response.status_code == 200

    preflight_payload = cast(dict[str, Any], response.json())
    budget = preflight_payload["budget"]
    assert preflight_payload["model"]["name"] == "qwen3:4b"
    assert len(preflight_payload["scenes"]) == 1
    assert budget["status"] == "blocked"
    assert budget["estimated_usd"] >= 10.0
    assert budget["hard_limit_usd"] == pytest.approx(10.0)
    assert budget["total_after_usd"] >= budget["hard_limit_usd"] - 1e-6
    assert budget["spent_usd"] == pytest.approx(0.0)


def test_draft_preflight_missing_scene(test_client: TestClient, tmp_path: Path) -> None:
    """Preflight returns validation error when scenes are missing from outline."""

    project_id = "proj_preflight_missing"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": [scene_ids[0], "sc_9999"],
    }

    response = test_client.post(f"{API_PREFIX}/draft/preflight", json=payload)
    assert response.status_code == 400

    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["details"]["missing_scene_ids"] == ["sc_9999"]


def test_draft_preflight_handles_request_error(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Preflight surfaces DraftRequestError values raised during service execution."""

    project_id = "proj_preflight_request_error"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
    }

    async def _preflight_raise(self, *_args: Any, **_kwargs: Any) -> Any:
        raise DraftRequestError("Chapter metadata missing.", {"chapter_id": "ch_9999"})

    monkeypatch.setattr(DraftGenerationService, "preflight", _preflight_raise)

    response = test_client.post(f"{API_PREFIX}/draft/preflight", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["details"]["chapter_id"] == "ch_9999"


def test_draft_preflight_emits_trace_logs(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Preflight logs bounded trace metadata without leaking payload text."""

    project_id = "proj_preflight_trace_logs"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
    }

    async def _preflight(self, *_args: Any, **_kwargs: Any) -> Any:
        return SimpleNamespace(
            payload={
                "project_id": project_id,
                "unit_scope": "scene",
                "unit_ids": scene_ids,
                "model": {"name": "qwen3:4b", "provider": "ollama"},
                "scenes": [
                    {
                        "id": scene_ids[0],
                        "title": "Arrival",
                        "order": 1,
                        "chapter_id": "ch_0001",
                    }
                ],
                "budget": {
                    "estimated_usd": 1.0,
                    "status": "ok",
                    "soft_limit_usd": 5,
                    "hard_limit_usd": 10,
                    "spent_usd": 0.0,
                    "total_after_usd": 1.0,
                },
            }
        )

    info_mock = Mock()
    monkeypatch.setattr(draft_generation_router.LOGGER, "info", info_mock)
    monkeypatch.setattr(DraftGenerationService, "preflight", _preflight)

    response = test_client.post(
        f"{API_PREFIX}/draft/preflight",
        json=payload,
        headers={TRACE_HEADER: "11111111-1111-4111-8111-111111111111"},
    )
    assert response.status_code == 200

    def _render_message(call: Any) -> str:
        if not call.args:
            return ""
        if len(call.args) == 1:
            return str(call.args[0])
        try:
            return str(call.args[0] % call.args[1:])
        except Exception:
            return " ".join(str(part) for part in call.args)

    logged_messages = " ".join(_render_message(call) for call in info_mock.call_args_list)
    assert "[preflight][11111111-1111-4111-8111-111111111111] route-start" in logged_messages
    assert "[preflight][11111111-1111-4111-8111-111111111111] route-exit" in logged_messages
    assert "Arrival" not in logged_messages


def test_draft_generate_emits_trace_logs(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Generate logs entry before service work and keeps the trace id intact."""

    project_id = "proj_generate_trace_logs"
    payload = _build_payload()
    payload["project_id"] = project_id
    build_response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
    assert build_response.status_code == 200
    build_payload = cast(dict[str, Any], build_response.json())
    scene_ids = [scene["id"] for scene in cast(list[dict[str, Any]], build_payload["scenes"])]
    _write_project_budget(tmp_path, project_id, soft_limit=5.0, hard_limit=10.0, spent_usd=0.0)

    info_mock = Mock()
    monkeypatch.setattr(draft_generation_router.LOGGER, "info", info_mock)

    async def _generate(self, *_args: Any, **_kwargs: Any) -> Any:
        def _render_message(call: Any) -> str:
            if not call.args:
                return ""
            if len(call.args) == 1:
                return str(call.args[0])
            try:
                return str(call.args[0] % call.args[1:])
            except Exception:
                return " ".join(str(part) for part in call.args)

        logged_messages = " ".join(_render_message(call) for call in info_mock.call_args_list)
        assert "draft-generate:backend-enter" in logged_messages
        return SimpleNamespace(
            response={
                "project_id": project_id,
                "unit_scope": "scene",
                "unit_ids": [scene_ids[0]],
                "draft_id": "dr_trace",
                "schema_version": "DraftUnitSchema v1",
                "units": [],
                "model": {"name": "qwen3:4b", "provider": "ollama"},
                "budget": {"status": "ok"},
            }
        )

    monkeypatch.setattr(DraftGenerationService, "generate", _generate)

    response = test_client.post(
        f"{API_PREFIX}/draft/generate",
        json={
            "project_id": project_id,
            "unit_scope": "scene",
            "unit_ids": [scene_ids[0]],
        },
        headers={TRACE_HEADER: "22222222-2222-4222-8222-222222222222"},
    )
    assert response.status_code == 200

    def _render_message(call: Any) -> str:
        if not call.args:
            return ""
        if len(call.args) == 1:
            return str(call.args[0])
        try:
            return str(call.args[0] % call.args[1:])
        except Exception:
            return " ".join(str(part) for part in call.args)

    logged_messages = " ".join(_render_message(call) for call in info_mock.call_args_list)
    assert (
        "[draft-generate][22222222-2222-4222-8222-222222222222] draft-generate:route-enter"
        in logged_messages
    )
    assert (
        "[draft-generate][22222222-2222-4222-8222-222222222222] draft-generate:backend-enter"
        in logged_messages
    )
    assert (
        "[draft-generate][22222222-2222-4222-8222-222222222222] draft-generate:request-validated"
        in logged_messages
    )
    assert (
        "[draft-generate][22222222-2222-4222-8222-222222222222] draft-generate:response"
        in logged_messages
    )
    assert (
        "[draft-generate][22222222-2222-4222-8222-222222222222] draft-generate:backend-exit"
        in logged_messages
    )
    assert "Arrival" not in logged_messages


def test_draft_generate_logs_asgi_request_start_before_route(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The ASGI middleware should log draft generate requests before route handling."""

    project_id = "proj_generate_request_start"
    payload = _build_payload()
    payload["project_id"] = project_id
    build_response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
    assert build_response.status_code == 200
    build_payload = cast(dict[str, Any], build_response.json())
    scene_ids = [scene["id"] for scene in cast(list[dict[str, Any]], build_payload["scenes"])]
    _write_project_budget(tmp_path, project_id, soft_limit=5.0, hard_limit=10.0, spent_usd=0.0)

    info_mock = Mock()
    monkeypatch.setattr(app_module.LOGGER, "info", info_mock)

    async def _generate(self, *_args: Any, **_kwargs: Any) -> Any:
        return SimpleNamespace(
            response={
                "project_id": project_id,
                "unit_scope": "scene",
                "unit_ids": [scene_ids[0]],
                "draft_id": "dr_request_start",
                "schema_version": "DraftUnitSchema v1",
                "units": [],
                "model": {"name": "qwen3:4b", "provider": "ollama"},
                "budget": {"status": "ok"},
            }
        )

    monkeypatch.setattr(DraftGenerationService, "generate", _generate)

    response = test_client.post(
        f"{API_PREFIX}/draft/generate",
        json={
            "project_id": project_id,
            "unit_scope": "scene",
            "unit_ids": [scene_ids[0]],
        },
        headers={TRACE_HEADER: "44444444-4444-4444-8444-444444444444"},
    )
    assert response.status_code == 200

    def _render_message(call: Any) -> str:
        if not call.args:
            return ""
        if len(call.args) == 1:
            return str(call.args[0])
        try:
            return str(call.args[0] % call.args[1:])
        except Exception:
            return " ".join(str(part) for part in call.args)

    logged_messages = " ".join(_render_message(call) for call in info_mock.call_args_list)
    assert "[http][request-start]" in logged_messages
    assert "request-start" in logged_messages
    assert "/api/v1/draft/generate" in logged_messages
    assert "trace_header" in logged_messages
    assert "44444444-4444-4444-8444-444444444444" in logged_messages


def test_draft_generate_provider_timeout_returns_controlled_error(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A provider timeout should surface as a controlled 504 error."""

    project_id = "proj_generate_provider_timeout"
    payload = _build_payload()
    payload["project_id"] = project_id
    build_response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
    assert build_response.status_code == 200
    build_payload = cast(dict[str, Any], build_response.json())
    scene_ids = [scene["id"] for scene in cast(list[dict[str, Any]], build_payload["scenes"])]
    _write_project_budget(tmp_path, project_id, soft_limit=5.0, hard_limit=10.0, spent_usd=0.0)

    async def _generate(self, *_args: Any, **_kwargs: Any) -> Any:
        raise draft_generation_router.DraftGenerationProviderTimeoutError(
            "Provider call exceeded 0.01 seconds."
        )

    monkeypatch.setattr(DraftGenerationService, "generate", _generate)

    response = test_client.post(
        f"{API_PREFIX}/draft/generate",
        json={
            "project_id": project_id,
            "unit_scope": "scene",
            "unit_ids": [scene_ids[0]],
        },
        headers={TRACE_HEADER: "33333333-3333-4333-8333-333333333333"},
    )
    assert response.status_code == status.HTTP_504_GATEWAY_TIMEOUT
    error = response.json()
    assert error["code"] == "PROVIDER_TIMEOUT"
    assert error["message"] == "Provider/model timed out."


def test_draft_rewrite_success(test_client: TestClient, tmp_path: Path) -> None:
    """Rewriting a scene updates markdown and returns a structured diff."""

    project_id = "proj_rewrite_success"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    original_body = _bootstrap_scene(tmp_path, project_id, scene_ids[0])

    revised_body = f"{original_body}\n\nNew beat emerges along the stairwell."
    payload = {
        "project_id": project_id,
        "draft_id": "dr_101",
        "unit_id": scene_ids[0],
        "instructions": "Tighten the close.",
        "new_text": revised_body,
        "unit": {
            "id": scene_ids[0],
            "text": original_body,
            "meta": {"purpose": "payoff", "emotion_tag": "revelation"},
        },
    }

    response = test_client.post(f"{API_PREFIX}/draft/rewrite", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["schema_version"] == "DraftUnitSchema v1"
    assert data["model"]["name"] == "qwen3:4b"
    assert data["model"]["provider"] == "ollama"
    assert data["unit_id"] == scene_ids[0]
    assert data["revised_text"].endswith("New beat emerges along the stairwell.")

    diff = data["diff"]
    assert isinstance(diff["anchors"], dict)
    assert diff["anchors"]["left"] >= 0
    assert diff["anchors"]["right"] >= 0
    assert diff["added"] or diff["changed"]

    draft_path = tmp_path / project_id / "drafts" / f"{scene_ids[0]}.md"
    content = draft_path.read_text(encoding="utf-8")
    assert "purpose: payoff" in content
    assert "emotion_tag: revelation" in content
    assert "New beat emerges" in content


def test_draft_rewrite_conflict(test_client: TestClient, tmp_path: Path) -> None:
    """Conflicting rewrites surface 409 responses and diagnostics."""

    project_id = "proj_rewrite_conflict"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    original_body = _bootstrap_scene(tmp_path, project_id, scene_ids[0])

    draft_path = tmp_path / project_id / "drafts" / f"{scene_ids[0]}.md"
    draft_path.write_text(
        draft_path.read_text(encoding="utf-8") + "\nExternal edit.",
        encoding="utf-8",
    )

    payload = {
        "project_id": project_id,
        "draft_id": "dr_202",
        "unit_id": scene_ids[0],
        "instructions": "Reword the last line.",
        "new_text": original_body + "\n\nA controlled cadence takes hold.",
        "unit": {"id": scene_ids[0], "text": original_body},
    }

    response = test_client.post(f"{API_PREFIX}/draft/rewrite", json=payload)
    assert response.status_code == 409

    detail = _read_error(response)
    assert detail["code"] == "CONFLICT"

    diagnostics_dir = tmp_path / project_id / "history" / "diagnostics"
    assert diagnostics_dir.exists()
    assert list(diagnostics_dir.glob("*.json"))


def test_draft_rewrite_validation_error(test_client: TestClient) -> None:
    """Malformed rewrite payloads raise validation errors."""

    response = test_client.post(f"{API_PREFIX}/draft/rewrite", json={"project_id": "proj_bad"})
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"


def test_draft_accept_success_creates_snapshot(test_client: TestClient, tmp_path: Path) -> None:
    """Accepting a critique updates the scene and writes a snapshot."""

    project_id = "proj_accept_success"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    accepted_text = f"{scene_body}\n\nShe braces for the next surge."
    checksum = _compute_sha256(scene_body)

    payload = {
        "project_id": project_id,
        "draft_id": "dr_301",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": accepted_text,
            "meta": {"purpose": "payoff"},
        },
        "message": "Applying critique suggestions.",
        "snapshot_label": "accept",
    }

    response = test_client.post(f"{API_PREFIX}/draft/accept", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["unit_id"] == "sc_0001"
    assert data["snapshot"]["snapshot_id"]
    assert data["snapshot"]["path"].startswith("history/snapshots/")

    scene_path = tmp_path / project_id / "drafts" / "sc_0001.md"
    content = scene_path.read_text(encoding="utf-8")
    assert "She braces for the next surge." in content

    state_path = tmp_path / project_id / "history" / "recovery" / "state.json"
    assert state_path.exists()
    state = json.loads(state_path.read_text(encoding="utf-8"))
    assert state["status"] == "idle"
    assert state["needs_recovery"] is False
    assert state["last_snapshot"]["snapshot_id"] == data["snapshot"]["snapshot_id"]

    snapshot_dir = tmp_path / project_id / data["snapshot"]["path"]
    assert snapshot_dir.exists()
    metadata_path = snapshot_dir / "metadata.json"
    assert metadata_path.exists()
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    assert metadata["snapshot_id"] == data["snapshot"]["snapshot_id"]

    manifest_path = snapshot_dir / "snapshot.yaml"
    assert manifest_path.exists()
    manifest = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
    assert manifest["schema_version"] == "SnapshotManifest v1"
    assert manifest["snapshot_id"] == data["snapshot"]["snapshot_id"]
    drafts = manifest.get("drafts")
    assert isinstance(drafts, list)
    draft_entry = next(item for item in drafts if item.get("id") == "sc_0001")
    assert draft_entry["path"].startswith("drafts/")
    assert draft_entry["purpose"] == "payoff"
    assert "missing_drafts" not in manifest


def test_draft_accept_rejects_missing_draft_state(test_client: TestClient, tmp_path: Path) -> None:
    """Accepted draft state is not fabricated for scaffolded projects."""

    project_id = "proj_accept_missing_draft"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    project_meta_path = tmp_path / project_id / "project.json"
    project_meta = json.loads(project_meta_path.read_text(encoding="utf-8"))
    project_meta["bootstrap_state"] = "scaffold_initialized"
    project_meta["bootstrap_template"] = "starter-scaffold-v1"
    project_meta_path.write_text(json.dumps(project_meta, indent=2), encoding="utf-8")

    payload = {
        "project_id": project_id,
        "draft_id": "dr_missing",
        "unit_id": scene_ids[0],
        "unit": {
            "id": scene_ids[0],
            "previous_sha256": "0" * 64,
            "text": "Static text that should never be accepted.",
            "meta": {},
        },
        "message": "Missing draft state probe.",
        "snapshot_label": "accept",
    }

    response = test_client.post(f"{API_PREFIX}/draft/accept", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["message"] == "Scene markdown is missing."

    state_path = tmp_path / project_id / "history" / "recovery" / "state.json"
    assert not state_path.exists()
    snapshot_dir = tmp_path / project_id / "history" / "snapshots"
    assert not snapshot_dir.exists()

    project_meta_after = json.loads(project_meta_path.read_text(encoding="utf-8"))
    assert project_meta_after["bootstrap_state"] == "scaffold_initialized"
    assert project_meta_after["bootstrap_template"] == "starter-scaffold-v1"


def test_draft_accept_logs_slow_timing_metadata_without_payload_text(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Slow accept timings emit a bounded warning without changing the response."""

    project_id = "proj_accept_timing"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    accepted_text = f"{scene_body}\n\nAccepted text should not leak into logs."
    checksum = _compute_sha256(scene_body)

    payload = {
        "project_id": project_id,
        "draft_id": "dr_timing_001",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": accepted_text,
            "meta": {"purpose": "payoff"},
        },
        "message": "Timing probe.",
        "snapshot_label": "accept",
    }

    slow_timings = {
        "request_validation_ms": 1.0,
        "draft_lookup_ms": 2.0,
        "audited_chain_write_ms": 3.0,
        "diff_ms": 4.0,
        "accept_apply_ms": 120.0,
        "snapshot_create_allocate_ms": 10.0,
        "snapshot_create_include_ms": 20.0,
        "snapshot_create_copy_ms": 30.0,
        "snapshot_create_metadata_ms": 5.0,
        "snapshot_create_manifest_ms": 15.0,
        "snapshot_create_total_ms": 80.0,
        "recovery_finalize_ms": 1.0,
        "budget_update_ms": 2.0,
        "response_assembly_ms": 0.5,
        "total_ms": 150.0,
    }

    async def _fake_accept(
        self: DraftAcceptService,
        *,
        request: Any,
        project_root: Path,
        updated_front_matter: dict[str, Any],
        normalized_text: str,
        current_normalized: str,
    ) -> DraftAcceptanceResult:
        await asyncio.sleep(0.12)
        return DraftAcceptanceResult(
            response={
                "project_id": request.project_id,
                "unit_id": request.unit_id,
                "status": "accepted",
                "snapshot": {"snapshot_id": "20260430T000001Z", "path": "history/snapshots/x"},
                "diff": {"added": [], "removed": [], "changed": [], "anchors": []},
                "budget": {
                    "soft_limit_usd": 5.0,
                    "hard_limit_usd": 10.0,
                    "spent_usd": 1.0,
                },
                "schema_version": "DraftAcceptResult v1",
            },
            timings=slow_timings,
        )

    recorded_messages: list[str] = []
    monkeypatch.setattr(
        snapshots_module.LOGGER,
        "warning",
        lambda message, *args: recorded_messages.append(message % args if args else message),
    )
    monkeypatch.setattr(DraftAcceptService, "accept", _fake_accept)

    response = test_client.post(f"{API_PREFIX}/draft/accept", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["unit_id"] == "sc_0001"
    assert data["snapshot"]["snapshot_id"] == "20260430T000001Z"
    assert recorded_messages
    warning = recorded_messages[0]
    assert warning
    assert "Slow draft accept request path=/api/v1/draft/accept" in warning
    assert "project_id=proj_accept_timing" in warning
    assert "unit_id=sc_0001" in warning
    assert "draft_id=dr_timing_001" in warning
    assert "total_ms=" in warning
    assert "Accepted text should not leak into logs." not in warning


def test_draft_accept_handles_unexpected_error(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Unexpected acceptance errors surface INTERNAL responses."""

    project_id = "proj_accept_unexpected"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    checksum = _compute_sha256(scene_body)

    def _raise_runtime(*_args: Any, **_kwargs: Any) -> None:
        raise RuntimeError("acceptance pipeline offline")

    monkeypatch.setattr(DraftAcceptService, "accept", _raise_runtime)

    payload = {
        "project_id": project_id,
        "draft_id": "dr_unexpected",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": scene_body,
            "meta": {"purpose": "setup"},
        },
        "message": "Trigger unexpected failure.",
    }

    response = test_client.post(f"{API_PREFIX}/draft/accept", json=payload)
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = _read_error(response)
    assert detail["code"] == "INTERNAL"
    assert detail["message"] == "Failed to accept draft unit."


def test_draft_accept_ignores_tampered_cost(test_client: TestClient, tmp_path: Path) -> None:
    """Accept uses server-side estimates even if the request zeros out cost."""

    project_id = "proj_accept_budget_guard"
    draft_id = "dr_secure_001"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    checksum = _compute_sha256(scene_body)

    project_path = _write_project_budget(
        tmp_path, project_id, soft_limit=5.0, hard_limit=10.0, spent_usd=1.0
    )
    metadata = json.loads(project_path.read_text(encoding="utf-8"))
    metadata.setdefault("budget", {})["last_generate_response"] = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": ["sc_0001"],
        "draft_id": draft_id,
        "schema_version": "DraftUnitSchema v1",
        "units": [
            {
                "id": "sc_0001",
                "text": scene_body,
                "meta": {
                    "word_target": 1500,
                    "order": 1,
                    "chapter_id": "ch_0001",
                },
            }
        ],
        "budget": {
            "estimated_usd": 0.03,
            "status": "ok",
            "message": "Estimate within budget.",
            "soft_limit_usd": 5.0,
            "hard_limit_usd": 10.0,
            "spent_usd": 1.03,
            "total_after_usd": 1.03,
        },
    }
    project_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    payload = {
        "project_id": project_id,
        "draft_id": draft_id,
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": f"{scene_body}\n\nAccepted text.",
            "meta": {"purpose": "setup"},
            "estimated_cost_usd": 0.0,
        },
        "message": "Tamper attempt should be ignored.",
        "snapshot_label": "accept",  # ensure snapshot flow still succeeds
    }

    response = test_client.post(f"{API_PREFIX}/draft/accept", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["budget"]["spent_usd"] == pytest.approx(1.03)

    persisted_meta = json.loads(project_path.read_text(encoding="utf-8"))
    assert persisted_meta["budget"]["spent_usd"] == pytest.approx(1.03)


def test_draft_accept_uses_nondurable_writes_in_synthetic_mode(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Synthetic smoke accept keeps correctness while skipping durability fsyncs."""

    project_id = "proj_accept_synthetic_writes"
    draft_id = "dr_synthetic_001"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    checksum = _compute_sha256(scene_body)
    _write_project_budget(tmp_path, project_id, soft_limit=5.0, hard_limit=10.0, spent_usd=1.0)

    recorded: dict[str, Any] = {}

    def _write_scene(
        self: DraftPersistence,
        project_id: str,
        front_matter: dict[str, Any],
        body: str,
        *,
        durable: bool | None = None,
    ) -> Path:
        recorded["scene_durable"] = durable
        target = tmp_path / project_id / "drafts" / f"{front_matter['id']}.md"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(self._render(front_matter, body), encoding="utf-8")
        return target

    def _create_snapshot(
        self: SnapshotPersistence,
        project_id: str,
        *,
        label: str | None = None,
        include_entries: Any | None = None,
        timing_hook=None,
        durable: bool = True,
    ) -> dict[str, Any]:
        recorded["snapshot_durable"] = durable
        if timing_hook is not None:
            timing_hook(
                {
                    "allocate_ms": 1.0,
                    "include_ms": 1.0,
                    "copy_ms": 1.0,
                    "metadata_ms": 1.0,
                    "manifest_ms": 1.0,
                    "total_ms": 5.0,
                }
            )
        return {
            "snapshot_id": "20260430T000000Z",
            "label": label or "accept",
            "created_at": "2026-04-30T00:00:00Z",
            "path": f"history/snapshots/20260430T000000Z_{label or 'accept'}",
            "includes": list(include_entries or []),
        }

    def _persist_budget(
        state: Any,
        new_spent_usd: float,
        *,
        durable: bool = True,
    ) -> None:
        recorded["budget_durable"] = durable
        budget_section = state.metadata.setdefault("budget", {})
        budget_section["spent_usd"] = round(max(new_spent_usd, 0.0), 2)
        state.spent_usd = budget_section["spent_usd"]

    monkeypatch.setenv("BLACKSKIES_E2E_MODE", "1")
    monkeypatch.setenv("BLACKSKIES_E2E_SYNTHETIC_MODE", "1")
    monkeypatch.setattr(DraftPersistence, "write_scene", _write_scene)
    monkeypatch.setattr(SnapshotPersistence, "create_snapshot", _create_snapshot)
    monkeypatch.setattr(draft_accept_module, "persist_project_budget", _persist_budget)

    payload = {
        "project_id": project_id,
        "draft_id": draft_id,
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": f"{scene_body}\n\nSynthetic accept.",
            "meta": {
                "word_target": 900,
                "order": 1,
                "chapter_id": "ch_0001",
            },
            "estimated_cost_usd": 0.02,
        },
        "message": "Synthetic mode accept.",
        "snapshot_label": "accept",
    }

    response = test_client.post(f"{API_PREFIX}/draft/accept", json=payload)
    assert response.status_code == 200
    assert recorded["scene_durable"] is False
    assert recorded["snapshot_durable"] is False
    assert recorded["budget_durable"] is False


def test_draft_accept_snapshot_conflict(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Snapshot persistence conflicts return a structured 409 response."""

    project_id = "proj_accept_conflict_snapshot"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    checksum = _compute_sha256(scene_body)

    def _raise_snapshot(*args: Any, **kwargs: Any) -> dict[str, Any]:  # pragma: no cover - stub
        raise OSError(errno.EEXIST, "snapshot exists")

    monkeypatch.setattr(SnapshotPersistence, "create_snapshot", _raise_snapshot)

    payload = {
        "project_id": project_id,
        "draft_id": "dr_401",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": scene_body,
            "meta": {"purpose": "setup"},
        },
        "message": "Testing snapshot conflict.",
        "snapshot_label": "accept",
    }

    response = test_client.post(f"{API_PREFIX}/draft/accept", json=payload)
    assert response.status_code == status.HTTP_409_CONFLICT

    detail = _read_error(response)
    assert detail["code"] == "CONFLICT"
    assert detail["details"]["project_id"] == project_id

    diagnostics_dir = tmp_path / project_id / "history" / "diagnostics"
    entries = sorted(diagnostics_dir.glob("*.json"))
    assert entries, "Expected diagnostics to record the conflict"
    last_entry = json.loads(entries[-1].read_text(encoding="utf-8"))
    assert last_entry["code"] == "CONFLICT"


def test_wizard_lock_creates_snapshot(test_client: TestClient, tmp_path: Path) -> None:
    """Locking a wizard step writes a snapshot for the project."""

    project_id = "proj_wizard_lock"
    _bootstrap_outline(tmp_path, project_id, scene_count=1)
    _bootstrap_scene(tmp_path, project_id)

    payload = {
        "project_id": project_id,
        "step": "structure",
        "label": "wizard-structure",
        "includes": ["outline.json"],
    }

    response = test_client.post(f"{API_PREFIX}/draft/wizard/lock", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["snapshot_id"]
    assert data["label"] == "wizard-structure"
    assert data["path"].startswith("history/snapshots/")

    snapshot_dir = tmp_path / project_id / data["path"]
    assert snapshot_dir.exists()
    metadata_path = snapshot_dir / "metadata.json"
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    assert metadata["snapshot_id"] == data["snapshot_id"]


def test_wizard_lock_missing_project_returns_validation_error(
    test_client: TestClient,
) -> None:
    """Locking fails when the project folder is absent."""

    payload = {"project_id": "proj_missing", "step": "themes"}
    response = test_client.post(f"{API_PREFIX}/draft/wizard/lock", json=payload)
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"


def test_wizard_lock_rejects_malicious_include(test_client: TestClient, tmp_path: Path) -> None:
    """Wizard lock snapshots reject include paths that escape the project."""

    project_id = "proj_wizard_escape"
    _bootstrap_scene(tmp_path, project_id)

    payload = {
        "project_id": project_id,
        "step": "structure",
        "label": "wizard-structure",
        "includes": ["../outside.txt"],
    }

    response = test_client.post(f"{API_PREFIX}/draft/wizard/lock", json=payload)
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"

    outside_path = tmp_path / "outside.txt"
    assert not outside_path.exists()

    snapshots_dir = tmp_path / project_id / "history" / "snapshots"
    assert snapshots_dir.exists()
    assert list(snapshots_dir.iterdir()) == []


def test_snapshot_restore_flow(test_client: TestClient, tmp_path: Path) -> None:
    """Create a snapshot, mutate the project, and restore to verified state."""

    project_id = "proj_snapshot_restore_flow"
    payload = _build_payload()
    payload["project_id"] = project_id

    build_response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
    assert build_response.status_code == 200
    outline_path = tmp_path / project_id / "outline.json"
    original_outline = outline_path.read_text(encoding="utf-8")

    build_payload = cast(dict[str, Any], build_response.json())
    scene_ids = [scene["id"] for scene in cast(list[dict[str, Any]], build_payload["scenes"])]
    draft_response = test_client.post(
        f"{API_PREFIX}/draft/generate",
        json={
            "project_id": project_id,
            "unit_scope": "scene",
            "unit_ids": [scene_ids[0]],
        },
    )
    assert draft_response.status_code == status.HTTP_200_OK
    draft_unit = draft_response.json()["units"][0]
    draft_path = tmp_path / project_id / "drafts" / f"{scene_ids[0]}.md"
    original_draft = draft_path.read_text(encoding="utf-8")

    snapshot_response = test_client.post(
        f"{API_PREFIX}/draft/wizard/lock",
        json={
            "project_id": project_id,
            "step": "structure",
            "label": "snapshot-restore",
            "includes": ["outline.json", "drafts"],
        },
    )
    assert snapshot_response.status_code == 200
    snapshot_info = snapshot_response.json()
    outline_path.write_text("{}", encoding="utf-8")
    draft_path.write_text("corrupted text", encoding="utf-8")

    restore_response = test_client.post(
        f"{API_PREFIX}/draft/recovery/restore",
        json={"project_id": project_id, "snapshot_id": snapshot_info["snapshot_id"]},
    )
    assert restore_response.status_code == status.HTTP_200_OK
    restored_outline = outline_path.read_text(encoding="utf-8")
    restored_draft = draft_path.read_text(encoding="utf-8")
    # Normalise JSON to account for formatting differences.
    assert json.loads(restored_outline) == json.loads(original_outline)
    assert restored_draft == original_draft

    critique_payload = _build_critique_payload(
        draft_id=draft_response.json()["draft_id"],
        unit_id=scene_ids[0],
    )
    critique_payload["project_id"] = project_id

    critique_response = test_client.post(f"{API_PREFIX}/draft/critique", json=critique_payload)
    assert critique_response.status_code == status.HTTP_200_OK


def test_draft_accept_conflict_on_checksum(test_client: TestClient, tmp_path: Path) -> None:
    """Out-of-date accept requests return a conflict."""

    project_id = "proj_accept_conflict"
    _bootstrap_scene(tmp_path, project_id)
    payload = {
        "project_id": project_id,
        "draft_id": "dr_302",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": "0" * 64,
            "text": "Stale text",
        },
    }

    response = test_client.post(f"{API_PREFIX}/draft/accept", json=payload)
    assert response.status_code == 409
    detail = _read_error(response)
    assert detail["code"] == "CONFLICT"

    state_path = tmp_path / project_id / "history" / "recovery" / "state.json"
    assert not state_path.exists()


def test_recovery_status_marks_needs_recovery(test_client: TestClient, tmp_path: Path) -> None:
    """Stale in-progress markers are promoted to a recovery state."""

    project_id = "proj_recovery_status"
    _bootstrap_scene(tmp_path, project_id)
    state_path = tmp_path / project_id / "history" / "recovery" / "state.json"
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(
        json.dumps({"status": "accept-in-progress", "pending_unit_id": "sc_0001"}),
        encoding="utf-8",
    )

    response = test_client.get(f"{API_PREFIX}/draft/recovery", params={"project_id": project_id})
    assert response.status_code == 200
    data = response.json()
    assert data["needs_recovery"] is True
    assert data["status"] == "needs-recovery"

    state = json.loads(state_path.read_text(encoding="utf-8"))
    assert state["status"] == "needs-recovery"
    assert state["needs_recovery"] is True


def test_recovery_tracker_normalises_legacy_state(tmp_path: Path) -> None:
    """Legacy recovery files with only `needs_recovery` are normalised."""

    project_id = "proj_recovery_legacy"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    state_path = project_root / "history" / "recovery" / "state.json"
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps({"needs_recovery": True}), encoding="utf-8")

    settings = ServiceSettings(project_base_dir=tmp_path)
    tracker = RecoveryTracker(settings)
    snapshots = SnapshotPersistence(settings)

    state = tracker.status(project_id, snapshots)
    assert state["status"] == "needs-recovery"
    assert state["needs_recovery"] is True

    persisted = json.loads(state_path.read_text(encoding="utf-8"))
    assert persisted["status"] == "needs-recovery"
    assert persisted["needs_recovery"] is True


@pytest.mark.anyio("asyncio")
async def test_recovery_restore_runs_in_threadpool(
    async_client: "httpx.AsyncClient",
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Recovery restores execute outside the event loop thread."""

    project_id = "proj_recovery_thread"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    checksum = _compute_sha256(scene_body)
    accepted_text = f"{scene_body}\n\nThreaded restore text."

    accept_payload = {
        "project_id": project_id,
        "draft_id": "dr_thread_001",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": accepted_text,
        },
    }

    accept_response = await async_client.post(
        f"{API_PREFIX}/draft/accept",
        json=accept_payload,
    )
    assert accept_response.status_code == status.HTTP_200_OK

    loop_thread = threading.current_thread()
    captured_threads: list[threading.Thread] = []

    original_restore = SnapshotPersistence.restore_snapshot

    def _capture_thread(
        self: SnapshotPersistence,
        project: str,
        snapshot: str,
    ) -> dict[str, Any]:
        captured_threads.append(threading.current_thread())
        return original_restore(self, project, snapshot)

    monkeypatch.setattr(SnapshotPersistence, "restore_snapshot", _capture_thread)

    restore_response = await async_client.post(
        f"{API_PREFIX}/draft/recovery/restore",
        json={"project_id": project_id},
    )
    assert restore_response.status_code == status.HTTP_200_OK
    assert captured_threads, "Restore should execute exactly once"
    assert captured_threads[0] is not loop_thread


def test_recovery_restore_overwrites_scene(test_client: TestClient, tmp_path: Path) -> None:
    """Restoring recovery snapshots rehydrates the latest accepted content."""

    project_id = "proj_recovery_restore"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    checksum = _compute_sha256(scene_body)
    accepted_text = f"{scene_body}\n\nRestored text ready."

    accept_payload = {
        "project_id": project_id,
        "draft_id": "dr_303",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": accepted_text,
        },
    }

    accept_response = test_client.post(f"{API_PREFIX}/draft/accept", json=accept_payload)
    assert accept_response.status_code == 200
    snapshot_rel_path = accept_response.json()["snapshot"]["path"]

    scene_path = tmp_path / project_id / "drafts" / "sc_0001.md"
    scene_path.write_text("Corrupted content", encoding="utf-8")

    restore_response = test_client.post(
        f"{API_PREFIX}/draft/recovery/restore",
        json={"project_id": project_id},
    )
    assert restore_response.status_code == 200
    restore_data = restore_response.json()
    assert restore_data["status"] == "idle"
    assert restore_data["needs_recovery"] is False
    assert restore_data["restore_observation"]["claim_scope"] == (
        "current-project-recovery-snapshot-restore"
    )
    assert restore_data["restore_observation"]["historical_only"] is False
    assert restore_data["restore_semantic_context"]["current_project_files_replaced"] is True
    assert restore_data["restore_semantic_context"]["restored_copy_materialized"] is False
    assert (
        restore_data["last_snapshot"]["snapshot_id"]
        == accept_response.json()["snapshot"]["snapshot_id"]
    )
    restored = scene_path.read_text(encoding="utf-8")
    assert "Restored text ready." in restored

    state_path = tmp_path / project_id / "history" / "recovery" / "state.json"
    state = json.loads(state_path.read_text(encoding="utf-8"))
    assert state["status"] == "idle"
    assert state["needs_recovery"] is False
    assert state["last_snapshot"]["path"] == snapshot_rel_path


def test_restore_from_zip_returns_copy_materialization_semantics(
    test_client: TestClient, tmp_path: Path
) -> None:
    """ZIP restore reports copy-materialization semantics without replacing the current project."""

    project_id = "proj_restore_zip_semantics"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    exports_dir = project_root / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)
    _bootstrap_scene(tmp_path, project_id, scene_id="sc_0001")
    scene_markdown = (project_root / "drafts" / "sc_0001.md").read_text(encoding="utf-8")

    zip_path = exports_dir / "demo_export.zip"
    with zipfile.ZipFile(zip_path, "w") as archive:
        archive.writestr(
            "project.json",
            json.dumps({"project_id": project_id, "name": "Restore ZIP Semantics"}),
        )
        archive.writestr(
            "outline.json",
            json.dumps(
                {
                    "schema_version": "OutlineSchema v1",
                    "outline_id": "out_001",
                    "acts": ["Act I"],
                    "chapters": [{"id": "ch_0001", "order": 1, "title": "Chapter 1"}],
                    "scenes": [
                        {
                            "id": "sc_0001",
                            "order": 1,
                            "title": "Scene 1",
                            "chapter_id": "ch_0001",
                            "beat_refs": [],
                        }
                    ],
                }
            ),
        )
        archive.writestr("drafts/sc_0001.md", scene_markdown)

    response = test_client.post(
        f"{API_PREFIX}/restore",
        json={"projectId": project_id, "zipName": "demo_export.zip", "restoreAsNew": True},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["restore_observation"]["claim_scope"] == "restored-copy-materialized-from-zip"
    assert payload["restore_observation"]["historical_only"] is False
    assert payload["restore_semantic_context"]["current_project_files_replaced"] is False
    assert payload["restore_semantic_context"]["restored_copy_materialized"] is True
    assert payload["restore_semantic_context"]["browseable_path_available"] is True
    assert payload["eligibility_decision"]["source_family"] == "export-zip"
    assert payload["eligibility_decision"]["selection_mode"] == "named"
    assert payload["eligibility_decision"]["source_label"] == "named-zip"
    assert payload["eligibility_decision"]["authority_state"] == "eligible"
    assert payload["eligibility_decision"]["target_semantics"] == "unique-sibling-copy"


def test_restore_from_zip_blocks_copy_overwrite_attempt(
    test_client: TestClient, tmp_path: Path
) -> None:
    """Copy restore rejects unsafe overwrite intent before materialization."""

    project_id = "proj_restore_zip_blocked"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    exports_dir = project_root / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)
    _bootstrap_scene(tmp_path, project_id, scene_id="sc_0001")
    scene_markdown = (project_root / "drafts" / "sc_0001.md").read_text(encoding="utf-8")

    zip_path = exports_dir / "demo_export.zip"
    with zipfile.ZipFile(zip_path, "w") as archive:
        archive.writestr(
            "project.json",
            json.dumps({"project_id": project_id, "name": "Restore ZIP Blocked"}),
        )
        archive.writestr(
            "outline.json",
            json.dumps(
                {
                    "schema_version": "OutlineSchema v1",
                    "outline_id": "out_001",
                    "acts": ["Act I"],
                    "chapters": [{"id": "ch_0001", "order": 1, "title": "Chapter 1"}],
                    "scenes": [
                        {
                            "id": "sc_0001",
                            "order": 1,
                            "title": "Scene 1",
                            "chapter_id": "ch_0001",
                            "beat_refs": [],
                        }
                    ],
                }
            ),
        )
        archive.writestr("drafts/sc_0001.md", scene_markdown)

    response = test_client.post(
        f"{API_PREFIX}/restore",
        json={"projectId": project_id, "zipName": "demo_export.zip", "restoreAsNew": False},
    )

    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["details"]["eligibility_decision"]["blocked_reasons"] == [
        "overwrite_not_allowed"
    ]
    assert detail["details"]["eligibility_decision"]["source_family"] == "export-zip"
    assert detail["details"]["eligibility_decision"]["selection_mode"] == "named"
    assert detail["details"]["eligibility_decision"]["source_label"] == "named-zip"


def test_restore_latest_without_zip_name_uses_latest_backup_bundle(
    test_client: TestClient, tmp_path: Path
) -> None:
    """Restore-latest aligns with the backup list when only backup bundles exist."""

    project_id = "proj_restore_latest_backup"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "project.json").write_text(
        json.dumps({"project_id": project_id, "name": "Restore Latest Backup"}),
        encoding="utf-8",
    )
    (project_root / "outline.json").write_text(
        json.dumps(
            {
                "schema_version": "OutlineSchema v1",
                "outline_id": "out_001",
                "acts": ["Act I"],
                "chapters": [{"id": "ch_0001", "order": 1, "title": "Chapter 1"}],
                "scenes": [
                    {
                        "id": "sc_0001",
                        "order": 1,
                        "title": "Scene 1",
                        "chapter_id": "ch_0001",
                        "beat_refs": [],
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    _bootstrap_scene(tmp_path, project_id, scene_id="sc_0001", body="Backup restore body.")

    with patch(
        "blackskies.services.backup_service._timestamp",
        side_effect=["20260510_012515", "20260510_012516"],
    ):
        first_backup = test_client.post("/api/v1/backups", json={"projectId": project_id})
        assert first_backup.status_code == 200
        (project_root / "outline.json").write_text(
            json.dumps(
                {
                    "schema_version": "OutlineSchema v1",
                    "outline_id": "out_001",
                    "acts": ["Act I"],
                    "chapters": [{"id": "ch_0001", "order": 1, "title": "Chapter 1"}],
                    "scenes": [
                        {
                            "id": "sc_0001",
                            "order": 1,
                            "title": "Scene 1",
                            "chapter_id": "ch_0001",
                            "beat_refs": [],
                        },
                        {
                            "id": "sc_0002",
                            "order": 2,
                            "title": "Scene 2",
                            "chapter_id": "ch_0001",
                            "beat_refs": [],
                        },
                    ],
                }
            ),
            encoding="utf-8",
        )
        _bootstrap_scene(
            tmp_path, project_id, scene_id="sc_0002", order=2, body="Later backup body."
        )
        second_backup = test_client.post("/api/v1/backups", json={"projectId": project_id})
        assert second_backup.status_code == 200

    response = test_client.post(
        f"{API_PREFIX}/restore",
        json={"projectId": project_id, "restoreAsNew": True},
    )
    assert response.status_code == 200
    payload = response.json()

    assert payload["status"] == "ok"
    assert payload["restore_observation"]["claim_scope"] == (
        "restored-copy-materialized-from-backup-archive"
    )
    assert payload["restore_observation"]["historical_only"] is False
    assert payload["restore_semantic_context"]["current_project_files_replaced"] is False
    assert payload["restore_semantic_context"]["restored_copy_materialized"] is True
    assert payload["eligibility_decision"]["source_family"] == "backup-bundle"
    assert payload["eligibility_decision"]["selection_mode"] == "latest"
    assert payload["eligibility_decision"]["source_label"] == "latest-backup"
    assert payload["eligibility_decision"]["authority_state"] == "eligible"
    assert payload["eligibility_decision"]["target_semantics"] == "unique-sibling-copy"
    restored_dir = Path(payload["restored_path"])
    assert restored_dir.exists()
    assert (restored_dir / "drafts" / "sc_0002.md").exists()
    assert second_backup.json()["filename"] in [
        entry["filename"]
        for entry in test_client.get("/api/v1/backups", params={"projectId": project_id}).json()
    ]


def test_restore_latest_without_zip_name_uses_latest_zip_source_label(
    test_client: TestClient, tmp_path: Path
) -> None:
    """Restore-latest falls back to the latest ZIP and reports the source label explicitly."""

    project_id = "proj_restore_latest_zip"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "project.json").write_text(
        json.dumps({"project_id": project_id, "name": "Restore Latest Zip"}),
        encoding="utf-8",
    )
    (project_root / "outline.json").write_text(
        json.dumps(
            {
                "schema_version": "OutlineSchema v1",
                "outline_id": "out_001",
                "acts": ["Act I"],
                "chapters": [{"id": "ch_0001", "order": 1, "title": "Chapter 1"}],
                "scenes": [
                    {
                        "id": "sc_0001",
                        "order": 1,
                        "title": "Scene 1",
                        "chapter_id": "ch_0001",
                        "beat_refs": [],
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    _bootstrap_scene(tmp_path, project_id, scene_id="sc_0001", body="Latest ZIP body.")
    scene_markdown = (project_root / "drafts" / "sc_0001.md").read_text(encoding="utf-8")

    exports_dir = project_root / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)
    zip_path = exports_dir / "demo_export.zip"
    with zipfile.ZipFile(zip_path, "w") as archive:
        archive.writestr(
            "project.json",
            json.dumps({"project_id": project_id, "name": "Restore Latest Zip"}),
        )
        archive.writestr(
            "outline.json",
            json.dumps(
                {
                    "schema_version": "OutlineSchema v1",
                    "outline_id": "out_001",
                    "acts": ["Act I"],
                    "chapters": [{"id": "ch_0001", "order": 1, "title": "Chapter 1"}],
                    "scenes": [
                        {
                            "id": "sc_0001",
                            "order": 1,
                            "title": "Scene 1",
                            "chapter_id": "ch_0001",
                            "beat_refs": [],
                        }
                    ],
                }
            ),
        )
        archive.writestr("drafts/sc_0001.md", scene_markdown)

    response = test_client.post(
        f"{API_PREFIX}/restore",
        json={"projectId": project_id, "restoreAsNew": True},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["eligibility_decision"]["source_family"] == "export-zip"
    assert payload["eligibility_decision"]["selection_mode"] == "latest"
    assert payload["eligibility_decision"]["source_label"] == "latest-zip"
    assert payload["eligibility_decision"]["authority_state"] == "eligible"


def test_restore_from_zip_cleans_invalid_materialized_copy(
    test_client: TestClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_id = "proj_restore_zip_invalid_cleanup"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    exports_dir = project_root / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)
    _bootstrap_scene(tmp_path, project_id, scene_id="sc_0001")
    scene_markdown = (project_root / "drafts" / "sc_0001.md").read_text(encoding="utf-8")

    zip_path = exports_dir / "demo_export.zip"
    with zipfile.ZipFile(zip_path, "w") as archive:
        archive.writestr("project.json", json.dumps({"project_id": project_id}))
        archive.writestr("outline.json", json.dumps({"schema_version": "OutlineSchema v1"}))
        archive.writestr("drafts/sc_0001.md", scene_markdown)

    monkeypatch.setattr(
        "blackskies.services.restore_service.validate_project",
        lambda *_args, **_kwargs: SimpleNamespace(
            is_ok=False,
            errors=["scene metadata invalid"],
            warnings=[],
        ),
    )

    response = test_client.post(
        f"{API_PREFIX}/restore",
        json={"projectId": project_id, "zipName": "demo_export.zip", "restoreAsNew": True},
    )

    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["details"]["operation"]["cleanup_status"] == "completed"
    assert detail["details"]["operation"]["completion_status"] == "failed-cleaned"
    assert not any(project_root.parent.glob(f"{project_id}_restored_*"))


def test_restore_from_zip_preserves_copy_when_cleanup_fails(
    test_client: TestClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_id = "proj_restore_zip_preserved"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    exports_dir = project_root / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)
    _bootstrap_scene(tmp_path, project_id, scene_id="sc_0001")
    scene_markdown = (project_root / "drafts" / "sc_0001.md").read_text(encoding="utf-8")

    zip_path = exports_dir / "demo_export.zip"
    with zipfile.ZipFile(zip_path, "w") as archive:
        archive.writestr("project.json", json.dumps({"project_id": project_id}))
        archive.writestr("outline.json", json.dumps({"schema_version": "OutlineSchema v1"}))
        archive.writestr("drafts/sc_0001.md", scene_markdown)

    monkeypatch.setattr(
        "blackskies.services.restore_service.validate_project",
        lambda *_args, **_kwargs: SimpleNamespace(
            is_ok=False,
            errors=["scene metadata invalid"],
            warnings=[],
        ),
    )

    real_rmtree = shutil.rmtree

    def _fail_cleanup(path: str | Path, ignore_errors: bool = False) -> None:
        if f"{project_id}_restored_" in str(path):
            raise OSError("cleanup failed")
        real_rmtree(path, ignore_errors=ignore_errors)

    monkeypatch.setattr("blackskies.services.restore_service.shutil.rmtree", _fail_cleanup)

    response = test_client.post(
        f"{API_PREFIX}/restore",
        json={"projectId": project_id, "zipName": "demo_export.zip", "restoreAsNew": True},
    )

    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["details"]["operation"]["cleanup_status"] == "failed-preserved"
    assert detail["details"]["operation"]["completion_status"] == "degraded-preserved"
    preserved_path = Path(detail["details"]["operation"]["destination_path"])
    assert preserved_path.exists()


def test_restore_from_zip_keeps_healthz_responsive_during_restore(
    test_client: TestClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_id = "proj_restore_zip_health"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "project.json").write_text(
        json.dumps({"project_id": project_id, "name": "Restore ZIP Health"}),
        encoding="utf-8",
    )
    (project_root / "outline.json").write_text(
        json.dumps(
            {
                "schema_version": "OutlineSchema v1",
                "outline_id": "out_001",
                "acts": ["Act I"],
                "chapters": [{"id": "ch_0001", "order": 1, "title": "Chapter 1"}],
                "scenes": [
                    {
                        "id": "sc_0001",
                        "order": 1,
                        "title": "Scene 1",
                        "chapter_id": "ch_0001",
                        "beat_refs": [],
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    exports_dir = project_root / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)
    (exports_dir / "demo_export.zip").write_bytes(b"placeholder")

    started = threading.Event()
    release = threading.Event()
    restored_dir = project_root.parent / f"{project_id}_restored_20260603_120001"

    def _restore_from_zip(
        project_root_arg: str,
        zip_name: str,
        *,
        restore_as_new: bool,
        project_id: str,
        selection_mode: str = "named",
    ) -> dict[str, Any]:
        started.set()
        assert release.wait(timeout=5), "restore test was not released"
        restored_dir.mkdir(parents=True, exist_ok=True)
        return {
            "status": "ok",
            "restored_project_slug": restored_dir.name,
            "restored_path": str(restored_dir),
            "operation": {
                "source_kind": "export-zip",
                "archive_path": str(project_root / "exports" / zip_name),
                "destination_path": str(restored_dir),
                "elapsed_ms": 5000,
                "completion_status": "validated-success",
                "validation_status": "passed",
                "cleanup_status": "not-needed",
                "degraded_reasons": [],
                "source_family": "export-zip",
                "selection_mode": selection_mode,
                "source_label": "named-zip" if selection_mode == "named" else "latest-zip",
            },
            "eligibility_decision": {
                "eligible": True,
                "blocked_reasons": [],
                "warnings": [],
                "source_kind": "export-zip",
                "source_family": "export-zip",
                "selection_mode": selection_mode,
                "source_label": "named-zip" if selection_mode == "named" else "latest-zip",
                "authority_state": "eligible",
                "target_semantics": "unique-sibling-copy",
                "source_name": zip_name,
                "source_scope": "project-exports",
                "source_project_id": project_id,
                "expected_project_id": project_id,
                "restore_as_new": True,
                "current_project_root": str(project_root),
                "destination_preview": str(restored_dir),
                "checksum_state": "unavailable",
                "checks": {
                    "source_exists": True,
                    "source_readable": True,
                    "source_kind_explicit": True,
                    "source_family_explicit": True,
                    "selection_mode_explicit": True,
                    "restore_as_new_requested": True,
                    "manifest_present": True,
                    "manifest_valid": True,
                    "checksum_state": "unavailable",
                    "checksum_required": False,
                    "destination_exists": False,
                    "destination_parent_exists": True,
                    "current_root_safe": True,
                    "scope_matches": True,
                    "target_is_unique_sibling": True,
                },
            },
        }

    def _validate_restored_copy(*, settings, diagnostics, restored_path, operation):
        return True, {
            **operation,
            "validation_status": "passed",
            "completion_status": "validated-success",
            "cleanup_status": "not-needed",
            "degraded_reasons": [],
        }

    monkeypatch.setattr(
        "blackskies.services.routers.restore.restore_from_zip",
        _restore_from_zip,
    )
    monkeypatch.setattr(
        "blackskies.services.routers.restore.validate_restored_copy",
        _validate_restored_copy,
    )

    response_holder: dict[str, object] = {}

    def _run_restore() -> None:
        response_holder["response"] = test_client.post(
            f"{API_PREFIX}/restore",
            json={"projectId": project_id, "zipName": "demo_export.zip", "restoreAsNew": True},
        )

    restore_thread = threading.Thread(target=_run_restore, daemon=True)
    restore_thread.start()

    assert started.wait(timeout=5)

    health_started = time.monotonic()
    health_response = test_client.get(f"{API_PREFIX}/healthz")
    health_elapsed = time.monotonic() - health_started
    assert health_response.status_code == 200
    assert health_elapsed < 2

    release.set()
    restore_thread.join(timeout=5)
    assert "response" in response_holder
    response = response_holder["response"]
    assert response.status_code == 200
    assert restored_dir.exists()


def test_recovery_restore_normalises_legacy_flag(test_client: TestClient, tmp_path: Path) -> None:
    """Restoring snapshots clears stale recovery flags that predate status fields."""

    project_id = "proj_recovery_normalise"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    checksum = _compute_sha256(scene_body)
    accept_payload = {
        "project_id": project_id,
        "draft_id": "dr_legacy",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": scene_body,
        },
    }

    response = test_client.post(f"{API_PREFIX}/draft/accept", json=accept_payload)
    assert response.status_code == 200

    state_path = tmp_path / project_id / "history" / "recovery" / "state.json"
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps({"needs_recovery": True}), encoding="utf-8")

    restore_response = test_client.post(
        f"{API_PREFIX}/draft/recovery/restore",
        json={"project_id": project_id},
    )
    assert restore_response.status_code == 200

    restored_state = json.loads(state_path.read_text(encoding="utf-8"))
    assert restored_state["needs_recovery"] is False
    assert restored_state["status"] == "idle"


def test_snapshot_restore_resets_project_state(test_client: TestClient, tmp_path: Path) -> None:
    """Snapshot restore reinstates accepted metadata after destructive edits."""

    project_id = "proj_snapshot_state"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    checksum = _compute_sha256(scene_body)
    accepted_text = f"{scene_body}\n\nArchive path confirmed."

    accept_payload = {
        "project_id": project_id,
        "draft_id": "dr_snapshot_state",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": accepted_text,
        },
    }

    accept_response = test_client.post(f"{API_PREFIX}/draft/accept", json=accept_payload)
    assert accept_response.status_code == 200

    project_json_path = tmp_path / project_id / "project.json"
    original_project = json.loads(project_json_path.read_text(encoding="utf-8"))

    drafts_path = tmp_path / project_id / "drafts" / "sc_0001.md"
    drafts_path.write_text("Corrupted content", encoding="utf-8")
    tampered_project = dict(original_project)
    tampered_project["name"] = "Tampered Name"
    tampered_project["budget"]["soft"] = 999.0
    project_json_path.write_text(json.dumps(tampered_project, indent=2), encoding="utf-8")

    restore_response = test_client.post(
        f"{API_PREFIX}/draft/recovery/restore",
        json={"project_id": project_id},
    )
    assert restore_response.status_code == 200

    restored_project = json.loads(project_json_path.read_text(encoding="utf-8"))
    assert restored_project["project_id"] == original_project["project_id"]
    restored_draft = drafts_path.read_text(encoding="utf-8")
    assert "Archive path confirmed." in restored_draft


def test_recovery_restore_rejects_malicious_include(
    test_client: TestClient, tmp_path: Path
) -> None:
    """Recovery restore refuses to apply snapshots with unsafe includes."""

    project_id = "proj_recovery_escape"
    _bootstrap_scene(tmp_path, project_id)

    snapshot_dir = tmp_path / project_id / "history" / "snapshots" / "20240101T000000Z_accept"
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    metadata_path = snapshot_dir / "metadata.json"
    metadata_path.write_text(
        json.dumps(
            {
                "snapshot_id": "20240101T000000Z",
                "project_id": project_id,
                "label": "accept",
                "created_at": "2024-01-01T00:00:00Z",
                "includes": ["../outside.txt"],
            }
        ),
        encoding="utf-8",
    )

    response = test_client.post(
        f"{API_PREFIX}/draft/recovery/restore",
        json={"project_id": project_id, "snapshot_id": "20240101T000000Z"},
    )
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"

    outside_path = tmp_path / "outside.txt"
    assert not outside_path.exists()


def test_restore_snapshot_ignores_fsync_error(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Snapshot restores tolerate fsync errors such as EBADF on Windows."""

    project_id = "proj_restore_fsync"
    project_root = tmp_path / project_id
    (project_root / "drafts").mkdir(parents=True, exist_ok=True)
    target_path = project_root / "drafts" / "sc_0001.md"
    target_path.write_text("stale", encoding="utf-8")

    snapshot_dir = project_root / "history" / "snapshots" / "20240101T000000Z_accept"
    (snapshot_dir / "drafts").mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "drafts" / "sc_0001.md").write_text(
        "fresh",
        encoding="utf-8",
    )
    metadata = {
        "snapshot_id": "20240101T000000Z",
        "project_id": project_id,
        "label": "accept",
        "created_at": "2024-01-01T00:00:00Z",
        "includes": ["drafts"],
    }
    (snapshot_dir / "metadata.json").write_text(
        json.dumps(metadata),
        encoding="utf-8",
    )

    settings = ServiceSettings(project_base_dir=tmp_path)
    persistence = SnapshotPersistence(settings)

    def _failing_fsync(fd: int) -> None:
        raise OSError(errno.EBADF, "Bad file descriptor")

    monkeypatch.setattr("blackskies.services.persistence.os.fsync", _failing_fsync)

    result = persistence.restore_snapshot(project_id, "20240101T000000Z")
    assert result["snapshot_id"] == "20240101T000000Z"
    assert target_path.read_text(encoding="utf-8") == "fresh"


def test_draft_export_manuscript_success(test_client: TestClient, tmp_path: Path) -> None:
    """Exporting a manuscript produces draft_full.md with expected content."""

    project_id = "proj_export_success"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=2)
    bodies = [
        "Storm cellar hums with static.",
        "Radio console crackles to life.",
    ]
    for index, (scene_id, body) in enumerate(zip(scene_ids, bodies), start=1):
        _bootstrap_scene(
            tmp_path,
            project_id,
            scene_id=scene_id,
            order=index,
            body=body,
        )

    response = test_client.post(f"{API_PREFIX}/draft/export", json={"project_id": project_id})
    assert response.status_code == 200
    data = response.json()
    assert data["schema_version"] == "DraftExportResult v1"
    assert data["chapters"] == 1
    assert data["scenes"] == 2
    assert data["meta_header"] is False
    assert data["path"] == "draft_full.md"

    assert "artifacts" in data
    assert data["artifacts"]["analytics_report"] == "analytics_report.json"
    assert data["artifacts"]["critique_bundle"] == "critique_bundle.md"

    analytics_path = tmp_path / project_id / "analytics_report.json"
    assert analytics_path.exists()
    analytics_payload = json.loads(analytics_path.read_text(encoding="utf-8"))
    assert analytics_payload["schema_version"] == "AnalyticsReport v1"
    assert len(analytics_payload["emotion_arc"]) == len(scene_ids)

    critique_bundle_path = tmp_path / project_id / "critique_bundle.md"
    assert critique_bundle_path.exists()
    bundle_text = critique_bundle_path.read_text(encoding="utf-8")
    assert "Batch Critique Summary" in bundle_text
    assert "No batch critiques recorded yet." in bundle_text
    export_path = tmp_path / project_id / "draft_full.md"
    assert export_path.exists()
    manuscript = export_path.read_text(encoding="utf-8")
    assert "# Chapter 1" in manuscript
    assert manuscript.count("## ") == 2
    assert "> purpose:" not in manuscript
    assert "Storm cellar hums with static." in manuscript
    assert "Radio console crackles to life." in manuscript

    response_meta = test_client.post(
        f"{API_PREFIX}/draft/export",
        json={"project_id": project_id, "include_meta_header": True},
    )
    assert response_meta.status_code == 200
    manuscript_with_meta = export_path.read_text(encoding="utf-8")
    manuscript_with_meta = export_path.read_text(encoding="utf-8")
    assert "> purpose: setup" in manuscript_with_meta
    assert "emotion: tension" in manuscript_with_meta
    assert "pov: Mara" in manuscript_with_meta


def test_draft_export_missing_front_matter_fields(test_client: TestClient, tmp_path: Path) -> None:
    """Export raises a validation error when required front-matter is missing."""

    project_id = "proj_export_missing"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    _bootstrap_scene(tmp_path, project_id, scene_id=scene_ids[0], order=1)

    scene_path = tmp_path / project_id / "drafts" / f"{scene_ids[0]}.md"
    content_lines = [
        line
        for line in scene_path.read_text(encoding="utf-8").splitlines()
        if not line.startswith("order:")
    ]
    scene_path.write_text("\n".join(content_lines) + "\n", encoding="utf-8")

    response = test_client.post(f"{API_PREFIX}/draft/export", json={"project_id": project_id})
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["message"] == "Scene front-matter is missing required fields."
    assert detail["details"]["unit_id"] == scene_ids[0]
    assert "order" in detail["details"]["missing_fields"]


def test_draft_export_rejects_path_traversal_project_id(test_client: TestClient) -> None:
    """Traversal tokens in project identifiers are rejected during export requests."""

    response = test_client.post(
        f"{API_PREFIX}/draft/export",
        json={"project_id": "../outside"},
    )
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    errors = detail["details"].get("errors", [])
    assert any(
        "Project ID must not contain path separators." in error.get("msg", "") for error in errors
    )
