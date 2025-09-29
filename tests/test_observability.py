from __future__ import annotations

from black_skies.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_validation_error_schema_includes_trace_id():
    response = client.post("/outline", json={})
    assert response.status_code == 422
    payload = response.json()
    assert payload["code"] == "VALIDATION"
    assert isinstance(payload["detail"], list)
    assert "trace_id" in payload
    assert response.headers["x-trace-id"] == payload["trace_id"]


def test_metrics_counter_increments():
    client.post(
        "/outline",
        json={"project_id": "proj_metrics", "wizard_locks": {}, "metadata": {}},
    )
    metrics_response = client.get("/metrics")
    assert metrics_response.status_code == 200
    body = metrics_response.text
    assert "outline_requests_total" in body
    assert "http_requests_total" in body
