from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

pytest.importorskip("fastapi")

from blackskies.services.app import create_app

client = TestClient(create_app())


def test_generate_validation_error_includes_trace_id() -> None:
    response = client.post("/api/v1/draft/generate", json={})
    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "VALIDATION"
    assert "trace_id" in payload
    assert response.headers["x-trace-id"] == payload["trace_id"]


def test_metrics_endpoint_returns_prometheus_payload() -> None:
    client.get("/api/v1/healthz")
    metrics_response = client.get("/api/v1/metrics")
    assert metrics_response.status_code == 200
    assert "blackskies_requests_total" in metrics_response.text
