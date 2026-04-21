"""Tests for the Runtime Truth Ledger artifact."""

from __future__ import annotations

import json
from pathlib import Path

from tools.runtime_truth.build_runtime_truth import (
    REPO_ROOT,
    RuntimeTruth,
    normalized_payload,
    render_runtime_truth_payload,
    render_runtime_truth_schema,
)


def _load_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def test_runtime_truth_schema_matches_generated_model() -> None:
    schema_path = REPO_ROOT / "build" / "runtime_truth.schema.json"
    payload_path = REPO_ROOT / "build" / "runtime_truth.json"

    assert schema_path.exists(), "Committed runtime truth schema is missing."
    assert payload_path.exists(), "Committed runtime truth artifact is missing."

    schema = _load_json(schema_path)
    payload = _load_json(payload_path)

    RuntimeTruth.model_validate(payload)
    assert schema == render_runtime_truth_schema()


def test_runtime_truth_artifact_is_fresh() -> None:
    payload_path = REPO_ROOT / "build" / "runtime_truth.json"

    committed = _load_json(payload_path)
    generated = render_runtime_truth_payload()

    assert normalized_payload(committed) == normalized_payload(generated)


def test_runtime_truth_semantic_defaults() -> None:
    payload = render_runtime_truth_payload()
    memory = payload["memory"]
    routes = payload["routes"]
    providers = payload["providers"]
    features = payload["features"]
    analytics = payload["analytics"]
    canonical_docs = payload["canonical_docs"]
    deferred_docs = payload["deferred_docs"]

    assert memory["scene_memory_live"] is True
    assert memory["memory_lab_live"] is True
    assert memory["memory_prototype_runtime"] is False

    long_form_execute = next(
        route
        for route in routes
        if route["path"] == "/api/v1/long-form/execute" and route["method"] == "POST"
    )
    assert long_form_execute["baseline_enabled"] is False
    assert "BLACKSKIES_LONG_FORM_PROVIDER_ENABLED" in long_form_execute["guarded_by"]

    backup_report = next(
        route
        for route in routes
        if route["path"] == "/api/v1/backup_verifier/report" and route["method"] == "GET"
    )
    assert backup_report["baseline_enabled"] is False
    assert "BLACKSKIES_BACKUP_VERIFIER_ENABLED" in backup_report["guarded_by"]

    analytics_feature = next(feature for feature in features if feature["name"] == "analytics")
    assert analytics_feature["state"] == "production"
    assert analytics_feature["baseline_default"] == "on"
    assert analytics["enabled_by_default"] is True
    assert "production" in analytics["notes"]

    analytics_routes = [route for route in routes if route["path"].startswith("/api/v1/analytics/")]
    assert analytics_routes
    assert all(
        route["baseline_enabled"] is analytics["enabled_by_default"] for route in analytics_routes
    )

    assert any(doc["path"] == "docs/specs/current_state.md" for doc in canonical_docs)
    assert all("Curated policy pointer" in doc["notes"] for doc in canonical_docs)
    assert all("Curated policy pointer" in doc["notes"] for doc in deferred_docs)
    voice_notes_doc = next(doc for doc in deferred_docs if doc["name"] == "voice_notes")
    assert voice_notes_doc["live_runtime_dependency"] is True
    assert voice_notes_doc["seam_state"] == "disabled"
    assert voice_notes_doc["seam_type"] == "explicit_disabled_integration_seam"
    assert "services/src/blackskies/services/backup_verifier.py" in voice_notes_doc["seam_owners"]

    no_seam_docs = [
        doc for doc in deferred_docs if doc["name"] in {"smart_merge", "accessibility_toggles"}
    ]
    assert all(doc["live_runtime_dependency"] is False for doc in no_seam_docs)
    assert all(doc["seam_state"] == "none" for doc in no_seam_docs)
    assert all(doc["seam_type"] == "none" for doc in no_seam_docs)
    assert all(doc["seam_owners"] == [] for doc in no_seam_docs)
    assert "health_observed" not in providers
    assert isinstance(providers["health_check_targets"], list)
