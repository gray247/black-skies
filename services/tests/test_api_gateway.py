from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from blackskies.services.app import create_app
from blackskies.services.config import ServiceSettings
from blackskies.services.models.draft import DraftGenerateRequest


def _client(tmp_path: Path):
    settings = ServiceSettings(project_base_dir=tmp_path)
    app = create_app(settings)
    return TestClient(app)


def test_health_endpoint_reports_ok(tmp_path) -> None:
    client = _client(tmp_path)
    response = client.get('/api/v1/healthz')
    assert response.status_code == 200
    payload = response.json()
    assert payload.get('status') == 'ok'
    runtime = payload.get('runtime')
    assert isinstance(runtime, dict)
    assert runtime.get('provider_type') == 'real_openai_api'
    assert runtime.get('resolved_base_url') == 'https://api.openai.com/v1'
    assert runtime.get('resolved_model') == 'gpt-4o-mini'
    assert runtime.get('routing_policy') == 'local_only'
    assert runtime.get('provider_calls_enabled') is False
    assert runtime.get('long_form_provider_enabled') is False


def test_recovery_status_requires_existing_project(tmp_path) -> None:
    client = _client(tmp_path)
    response = client.get('/api/v1/draft/recovery', params={'project_id': 'missing_project'})
    assert response.status_code == 400
    body = response.json()
    assert body['code'] == 'VALIDATION'


def test_outline_build_roundtrip(tmp_path: Path) -> None:
    client = _client(tmp_path)
    body = {
        'project_id': 'proj_outline',
        'wizard_locks': {
            'acts': [{'title': 'Act I'}],
            'chapters': [{'title': 'Chapter 1', 'act_index': 1}],
            'scenes': [
                {
                    'title': 'Scene 1',
                    'chapter_index': 1,
                    'beat_refs': [],
                }
            ],
        },
        'force_rebuild': False,
    }
    response = client.post('/api/v1/outline/build', json=body)
    assert response.status_code == 200
    payload = response.json()
    assert payload['acts'] == ['Act I']
