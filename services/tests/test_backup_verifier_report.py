import json
from pathlib import Path


def _prepare_project(test_client, project_id: str) -> Path:
    base_dir = Path(test_client.app.state.settings.project_base_dir)
    project_root = base_dir / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "project.json").write_text('{"project_id": "%s"}' % project_id, encoding="utf-8")
    (project_root / "outline.json").write_text(
        '{"schema_version": "OutlineSchema v1"}',
        encoding="utf-8",
    )
    return project_root


def test_backup_verification_report_endpoint_returns_payload(test_client):
    project_root = _prepare_project(test_client, "verify-report")
    snapshot_dir = project_root / ".snapshots"
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "project_id": "verify-report",
        "status": "ok",
        "verified_at": "2025-11-20T00:00:00Z",
        "message": "Verification succeeded",
        "checked_snapshots": 1,
        "failed_snapshots": 0,
        "snapshots": [],
    }
    (snapshot_dir / "last_verification.json").write_text(json.dumps(payload), encoding="utf-8")

    response = test_client.get("/api/v1/backup_verifier/report?projectId=verify-report")

    assert response.status_code == 200
    assert response.json() == payload


def test_backup_verification_report_endpoint_missing_file(test_client):
    _prepare_project(test_client, "verify-missing")

    response = test_client.get("/api/v1/backup_verifier/report?projectId=verify-missing")

    assert response.status_code == 404
    assert response.json()["message"] == "Verification report not found."
