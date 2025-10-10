from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

pytest.importorskip("fastapi")

from blackskies.services.app import create_app

client = TestClient(create_app())


def test_metrics_endpoint_returns_prometheus_payload() -> None:
    client.get("/api/v1/healthz")
    metrics_response = client.get("/api/v1/metrics")
    assert metrics_response.status_code == 200
    assert "blackskies_requests_total" in metrics_response.text
