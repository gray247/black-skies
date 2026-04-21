"""Tests for Canon Court v1 advisory contradiction handling."""

from __future__ import annotations

import json
import os
from pathlib import Path

from blackskies.services.canon_court import detect_candidate_ruling, persist_candidate_ruling
from blackskies.services.models.canon_court import CanonCourtContradictionType


def test_detect_candidate_ruling_positive_and_negative() -> None:
    positive = detect_candidate_ruling(
        project_id="proj_cc",
        scene_id="sc_0001",
        text="Mara carries the rusted key, but she says she is not mara carries the rusted key.",
        continuity_issues=["locked_fact_contradiction"],
        locked_facts=["Mara carries the rusted key"],
    )
    negative = detect_candidate_ruling(
        project_id="proj_cc",
        scene_id="sc_0001",
        text="Mara carries the rusted key and keeps moving.",
        continuity_issues=[],
        locked_facts=["Mara carries the rusted key"],
    )

    assert positive is not None
    assert positive.contradiction_type.value == "locked_fact_contradiction"
    assert positive.severity.value in {"low", "medium", "high"}
    assert positive.evidence.summary
    assert positive.evidence.source_origins
    assert positive.diagnostics_only is True
    assert positive.advisory is True
    assert positive.non_blocking is True
    assert negative is None


def test_candidate_rulings_persist_separately_from_canon_state(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_cc_store"
    project_root.mkdir(parents=True, exist_ok=True)

    locked_facts_path = project_root / "locked_facts.json"
    locked_facts_path.write_text(
        json.dumps({"facts": ["Mara carries the rusted key"]}, indent=2),
        encoding="utf-8",
    )
    continuity_dir = project_root / ".blackskies" / "continuity"
    continuity_dir.mkdir(parents=True, exist_ok=True)
    continuity_path = continuity_dir / "sc_0001.json"
    continuity_path.write_text(
        json.dumps({"summary": "Prior summary."}, indent=2),
        encoding="utf-8",
    )
    locked_before = locked_facts_path.read_text(encoding="utf-8")
    continuity_before = continuity_path.read_text(encoding="utf-8")

    ruling = detect_candidate_ruling(
        project_id="proj_cc_store",
        scene_id="sc_0001",
        text="Mara carries the rusted key. Later she says she is not mara carries the rusted key.",
        continuity_issues=["locked_fact_contradiction"],
        locked_facts=["Mara carries the rusted key"],
    )
    assert ruling is not None

    stored_path = persist_candidate_ruling(project_root, ruling)
    assert stored_path.exists()
    assert ".blackskies/canon_court/candidate_rulings".replace("/", os.sep) in str(stored_path)

    # Canon Court writes must not mutate canon/memory sources in v1.
    assert locked_facts_path.read_text(encoding="utf-8") == locked_before
    assert continuity_path.read_text(encoding="utf-8") == continuity_before


def test_canon_court_v1_contradiction_scope_remains_locked_fact_only() -> None:
    assert [entry.value for entry in CanonCourtContradictionType] == ["locked_fact_contradiction"]
