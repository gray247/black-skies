"""Tests for the mock Phase 4 critique & rewrite loop API."""

from __future__ import annotations

def _build_critique_payload() -> dict[str, object]:
    """Return a minimal critique request body."""

    return {
        "project_id": "proj_mock",
        "scene_id": "sc_0001",
        "text": "The cellar hums. A figure waits. The door creaks open wide.",
        "mode": "line_edit",
    }


def test_phase4_critique_returns_summary_and_issues(test_client) -> None:
    """Critique endpoint returns summary, issues, and suggestions."""

    response = test_client.post("/api/v1/phase4/critique", json=_build_critique_payload())
    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"].startswith("Mock Line Edit critique")
    assert isinstance(payload["issues"], list)
    assert isinstance(payload["suggestions"], list)
    assert payload["suggestions"], "Expected at least one suggestion"
    assert all("message" in issue for issue in payload["issues"])


def test_phase4_rewrite_applies_mock_header_and_body(test_client) -> None:
    """Rewrite endpoint stamps the mock tag and echoes trimmed content."""

    payload = {
        "project_id": "proj_mock",
        "scene_id": "sc_0001",
        "original_text": "Line one. Line two stays steady.",
        "instructions": "Boost the suspense",
    }
    response = test_client.post("/api/v1/phase4/rewrite", json=payload)
    assert response.status_code == 200
    revised = response.json()["revised_text"]
    assert revised.startswith("[REWRITE MOCK] Boost the suspense")
    assert "Line one" in revised
