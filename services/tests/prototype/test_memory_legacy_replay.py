"""Revision Pass B tests for legacy replay lineage containment."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from blackskies.services.memory_prototype.canonical_state_reader import (
    CanonicalInputEligibilityError,
    CanonicalStateReader,
)
from blackskies.services.memory_prototype.schemas import CanonicalLineageKey

from ._helpers import load_m5_fixture_manifest, materialize_case


def test_legacy_replay_without_hash_is_bounded_in_eval_mode(tmp_path: Path) -> None:
    manifest = load_m5_fixture_manifest()
    project = next(item for item in manifest["projects"] if item["project_id"] == "proj_m5_beta")
    case = next(
        item for item in project["cases"] if item["case_id"] == "beta_legacy_replay_without_hash"
    )

    project_root = tmp_path / "proj_m5_beta"
    materialize_case(project_root, "proj_m5_beta", case)
    lineage = CanonicalLineageKey.from_snapshot(
        project_id="proj_m5_beta",
        unit_id=case["unit_id"],
        snapshot_id=case["snapshot_id"],
        context="eval",
    )

    snapshot = CanonicalStateReader(project_root=project_root).read_snapshot(lineage)
    assert snapshot.source_hashes["accepted_source_hash_mode"] == "legacy_replay_derived"
    assert snapshot.source_hashes["legacy_replay_bounded"] == "true"


def test_legacy_replay_derivation_requires_accept_metadata_contract(tmp_path: Path) -> None:
    manifest = load_m5_fixture_manifest()
    project = next(item for item in manifest["projects"] if item["project_id"] == "proj_m5_beta")
    case = next(
        item for item in project["cases"] if item["case_id"] == "beta_legacy_replay_without_hash"
    )

    project_root = tmp_path / "proj_m5_beta"
    materialize_case(project_root, "proj_m5_beta", case)
    metadata_path = (
        project_root / "history" / "snapshots" / f"{case['snapshot_id']}_accept" / "metadata.json"
    )
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    metadata["label"] = "checkpoint"
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    lineage = CanonicalLineageKey.from_snapshot(
        project_id="proj_m5_beta",
        unit_id=case["unit_id"],
        snapshot_id=case["snapshot_id"],
        context="eval",
    )
    with pytest.raises(CanonicalInputEligibilityError, match="label='accept'"):
        CanonicalStateReader(project_root=project_root).read_snapshot(lineage)
