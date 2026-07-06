import json
from pathlib import Path


def _prepare_project(test_client, project_id: str) -> Path:
    base_dir = Path(test_client.app.state.settings.project_base_dir)
    project_root = base_dir / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "project.json").write_text(
        '{"project_id": "%s"}' % project_id, encoding="utf-8"
    )
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
    assert response.json() == {
        **payload,
        "report_observation": {
            "claim_scope": "persisted-verification-report-read",
            "strongest_authority": "A3",
            "supporting_authorities": [],
            "historical_only": True,
            "does_not_imply": [
                "integrity-valid",
                "report-fresh",
                "restorable",
                "browseable",
            ],
        },
    }


def test_backup_verification_report_endpoint_missing_file(test_client):
    _prepare_project(test_client, "verify-missing")

    response = test_client.get("/api/v1/backup_verifier/report?projectId=verify-missing")

    assert response.status_code == 404
    assert response.json()["message"] == "Verification report not found."


def test_backup_verification_run_persists_latest_report_only_to_requested_root(test_client):
    project_root = _prepare_project(test_client, "verify-run-writes-report")
    alias_root = project_root.parent / "Esther_Estate"
    alias_root.mkdir(parents=True, exist_ok=True)
    (alias_root / "project.json").write_text(
        json.dumps({"project_id": "verify-run-writes-report"}, indent=2),
        encoding="utf-8",
    )
    (alias_root / "outline.json").write_text(
        json.dumps({"schema_version": "OutlineSchema v1"}, indent=2),
        encoding="utf-8",
    )
    snapshot_dir = project_root / ".snapshots" / "ss_20251120T000000Z"
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    manifest = {
        "snapshot_id": "ss_20251120T000000Z",
        "created_at": "2025-11-20T00:00:00Z",
        "files_included": [
            {"path": "project.json", "checksum": "unused"},
        ],
    }
    (snapshot_dir / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")

    run_response = test_client.post(
        "/api/v1/backup_verifier/run?projectId=verify-run-writes-report&latest_only=true"
    )

    assert run_response.status_code == 200
    assert (
        run_response.json()["semantic_context"]["verification_basis"]["claim_scope"]
        == "current-runtime-project-verification"
    )
    assert run_response.json()["semantic_context"]["historical_only"] is False
    canonical_report_path = project_root / ".snapshots" / "last_verification.json"
    alias_report_path = alias_root / ".snapshots" / "last_verification.json"
    assert canonical_report_path.exists()
    assert not alias_report_path.exists()
    report_response = test_client.get(
        "/api/v1/backup_verifier/report?projectId=verify-run-writes-report"
    )
    assert report_response.status_code == 200
    assert report_response.json()["project_id"] == "verify-run-writes-report"
    assert report_response.json()["report_observation"]["historical_only"] is True
    assert report_response.json()["report_observation"]["strongest_authority"] == "A3"
