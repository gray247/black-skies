from __future__ import annotations

from fastapi.testclient import TestClient

from blackskies.services.app import create_app
from blackskies.services.config import ServiceSettings


def _client(tmp_path):
    settings = ServiceSettings(project_base_dir=tmp_path)
    app = create_app(settings)
    return TestClient(app)


def test_health_endpoint_reports_ok(tmp_path) -> None:
    client = _client(tmp_path)
    response = client.get('/api/v1/healthz')
    assert response.status_code == 200
    payload = response.json()
    assert payload.get('status') == 'ok'


def test_recovery_status_requires_existing_project(tmp_path) -> None:
    client = _client(tmp_path)
    response = client.get('/api/v1/draft/recovery', params={'project_id': 'missing_project'})
    assert response.status_code == 400
    body = response.json()
    assert body['code'] == 'VALIDATION'
