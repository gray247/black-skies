from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

pytest.importorskip("fastapi")

from blackskies.services.app import create_app

client = TestClient(create_app())
API_PREFIX = "/api/v1"


def test_healthz() -> None:
    response = client.get(f"{API_PREFIX}/healthz")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["version"]


def test_outline_build_validation_error() -> None:
    response = client.post(f"{API_PREFIX}/outline/build", json={})
    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "VALIDATION"
    assert "trace_id" in payload


def test_generate_validation_error_includes_trace_id() -> None:
    response = client.post(f"{API_PREFIX}/draft/generate", json={})
    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "VALIDATION"
    assert "trace_id" in payload
    assert response.headers["x-trace-id"] == payload["trace_id"]


def test_metrics_endpoint_records_requests() -> None:
    client.get(f"{API_PREFIX}/healthz")
    response = client.get(f"{API_PREFIX}/metrics")
    assert response.status_code == 200
    body = response.text
    assert "blackskies_requests_total" in body
