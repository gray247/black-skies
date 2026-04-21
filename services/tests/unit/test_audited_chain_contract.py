from __future__ import annotations

import json
from pathlib import Path


def _contract_path() -> Path:
    return Path(__file__).resolve().parents[3] / "docs" / "specs" / "audited_chain_contract.json"


def test_audited_chain_contract_has_required_steps() -> None:
    payload = json.loads(_contract_path().read_text(encoding="utf-8"))
    assert payload["schema_version"] == "AuditedChainContract v1"

    ui_steps = [entry["step"] for entry in payload["ui_chain"]]
    assert ui_steps == [
        "project_load",
        "scene_select",
        "critique",
        "rewrite",
        "export",
    ]

    extension_steps = [entry["step"] for entry in payload["service_extension_chain"]]
    assert extension_steps == ["accept", "snapshot", "recovery"]


def test_audited_chain_contract_guards_phase4_from_ui_truth_lane() -> None:
    payload = json.loads(_contract_path().read_text(encoding="utf-8"))
    guards = payload["default_route_guards"]
    allowed_origins = set(guards["ui_truth_lane_allowed_result_origins"])
    assert {"provider", "fallback", "local"}.issubset(allowed_origins)
    forbidden_routes = set(guards["ui_truth_lane_forbidden_routes"])
    assert "/api/v1/phase4/critique" in forbidden_routes
    assert "/api/v1/phase4/rewrite" in forbidden_routes
    assert "mock" in set(guards["ui_truth_lane_forbidden_result_origins"])


def test_snapshot_authority_rule_is_explicit() -> None:
    payload = json.loads(_contract_path().read_text(encoding="utf-8"))
    authority = payload["snapshot_authority"]
    assert authority["accept_recovery_flow"] == "history/snapshots/*"
    assert authority["manual_snapshot_feature"] == ".snapshots/*"
