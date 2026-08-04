"""Regression coverage for downloaded gauntlet proof artifact locations."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from scripts.write_gauntlet_ci_manifest import main


def test_manifest_uses_artifact_root_paths_after_download(monkeypatch, tmp_path: Path) -> None:
    output = tmp_path / "gauntlet_ci_proof.json"
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "write_gauntlet_ci_manifest.py",
            "--commit-sha",
            "a" * 40,
            "--artifact-root",
            "ci_artifacts",
            "--output",
            str(output),
            "--pass3-result",
            "success",
            "--pass4-result",
            "success",
            "--pass5-result",
            "success",
            "--pass6-result",
            "success",
        ],
    )

    main()

    manifest = json.loads(output.read_text(encoding="utf-8"))
    assert manifest["jobs"]["PASS 3"]["artifacts"] == [
        {"role": "summary", "path": "pass3/summary.json"}
    ]
    assert manifest["jobs"]["PASS 4"]["artifacts"] == [
        {"role": "summary", "path": "pass4/ci_proof/pass4/summary.json"},
        {
            "role": "truth_receipt_json",
            "path": "pass4/truth_receipts/latest.json",
        },
        {
            "role": "truth_receipt_txt",
            "path": "pass4/truth_receipts/latest.txt",
        },
    ]
    assert manifest["jobs"]["PASS 5"]["artifacts"] == [
        {"role": "summary", "path": "pass5/summary.json"}
    ]
    assert manifest["jobs"]["PASS 6"]["artifacts"] == [
        {"role": "summary", "path": "pass6/summary.json"}
    ]
