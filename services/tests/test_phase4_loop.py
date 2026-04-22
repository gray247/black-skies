"""HARNESS_ONLY seam tests for the mock Phase 4 critique & rewrite loop API.

Reason: preserve explicit coverage for dev/test-only mock seams.
Owner: services/routers/phase4.py
Retire when: phase4 mock router is deleted and no harness depends on /api/v1/phase4/*.
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from blackskies.services.app import create_app
from blackskies.services.config import ServiceSettings


@pytest.fixture()
def phase4_test_client(tmp_path) -> Iterator[TestClient]:
    """Expose phase4 routes explicitly for seam-only tests."""

    app = create_app(
        ServiceSettings(
            project_base_dir=tmp_path,
            phase4_mock_routes_enabled=True,
        )
    )
    with TestClient(app) as client:
        yield client


def _build_critique_payload() -> dict[str, object]:
    """Return a minimal critique request body."""

    return {
        "project_id": "proj_mock",
        "scene_id": "sc_0001",
        "text": "The cellar hums. A figure waits. The door creaks open wide.",
        "mode": "line_edit",
    }


def test_phase4_routes_return_404_by_default(test_client) -> None:
    """Default runtime must not expose phase4 mock routes."""

    critique_response = test_client.post("/api/v1/phase4/critique", json=_build_critique_payload())
    assert critique_response.status_code == 404

    rewrite_response = test_client.post(
        "/api/v1/phase4/rewrite",
        json={
            "project_id": "proj_mock",
            "scene_id": "sc_0001",
            "original_text": "Line one. Line two stays steady.",
            "instructions": "Boost the suspense",
        },
    )
    assert rewrite_response.status_code == 404


def test_phase4_critique_returns_summary_and_issues(phase4_test_client: TestClient) -> None:
    """Critique endpoint returns summary, issues, and suggestions."""

    response = phase4_test_client.post("/api/v1/phase4/critique", json=_build_critique_payload())
    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"].startswith("Mock Line Edit critique")
    assert isinstance(payload["issues"], list)
    assert isinstance(payload["suggestions"], list)
    assert payload["suggestions"], "Expected at least one suggestion"
    assert all("message" in issue for issue in payload["issues"])


def test_phase4_rewrite_applies_mock_header_and_body(phase4_test_client: TestClient) -> None:
    """Rewrite endpoint stamps the mock tag and echoes trimmed content."""

    payload = {
        "project_id": "proj_mock",
        "scene_id": "sc_0001",
        "original_text": "Line one. Line two stays steady.",
        "instructions": "Boost the suspense",
    }
    response = phase4_test_client.post("/api/v1/phase4/rewrite", json=payload)
    assert response.status_code == 200
    revised = response.json()["revised_text"]
    assert revised.startswith("[REWRITE MOCK] Boost the suspense")
    assert "Line one" in revised
