from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

pytest.importorskip("fastapi")

from blackskies.services.app import create_app

client = TestClient(create_app())


def test_legacy_route_includes_deprecation_headers() -> None:
    response = client.post("/draft/generate", json={})
    assert response.status_code == 400
    assert response.headers["deprecation"].lower() == "true"
    assert "sunset" in response.headers
    payload = response.json()
    assert payload["code"] == "VALIDATION"


def test_metrics_endpoint_returns_prometheus_payload() -> None:
    client.get("/api/v1/healthz")
    metrics_response = client.get("/api/v1/metrics")
    assert metrics_response.status_code == 200
    assert "blackskies_requests_total" in metrics_response.text


def test_metrics_endpoint_uses_canonical_media_type() -> None:
    """Metrics responses must use the documented text media type."""

    client.get("/api/v1/healthz")
    metrics_response = client.get("/api/v1/metrics")
    assert metrics_response.headers["content-type"] == "text/plain; version=0.0.4"


def test_legacy_metrics_alias_preserves_headers() -> None:
    """Legacy /metrics should emit canonical media type and sunset headers."""

    client.get("/api/v1/healthz")
    metrics_response = client.get("/metrics")
    assert metrics_response.headers["content-type"] == "text/plain; version=0.0.4"
    assert metrics_response.headers["deprecation"].lower() == "true"
    assert metrics_response.headers["sunset"]
    assert "successor-version" in metrics_response.headers["link"]
