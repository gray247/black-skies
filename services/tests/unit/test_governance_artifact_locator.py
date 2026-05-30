"""Unit tests for the governance artifact locator script."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from types import ModuleType

import pytest


@pytest.fixture(scope="module")
def locator_script_module() -> ModuleType:
    """Load ``scripts/governance_artifact_locator.py`` as a module."""

    repo_root = Path(__file__).resolve().parents[3]
    module_path = repo_root / "scripts" / "governance_artifact_locator.py"
    module_name = "tests.governance_artifact_locator_under_test"

    spec = importlib.util.spec_from_file_location(module_name, module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load governance artifact locator module specification")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def test_locator_emits_records(
    locator_script_module: ModuleType, capsys: pytest.CaptureFixture[str]
) -> None:
    exit_code = locator_script_module.main([])

    captured = capsys.readouterr()
    assert exit_code == 0
    assert captured.err == ""

    payload = json.loads(captured.out)
    assert isinstance(payload["records"], list)
    assert payload["records"]


def test_locator_only_emits_allowlisted_paths(
    locator_script_module: ModuleType, capsys: pytest.CaptureFixture[str]
) -> None:
    locator_script_module.main([])
    payload = json.loads(capsys.readouterr().out)

    for record in payload["records"]:
        path = record["path"]
        assert (
            path.startswith("docs/audits/phase13/")
            or path == "docs/audits/reconstruction_dependency_and_authority_map_pass40.md"
            or path == "docs/BLACK_SKIES_FIX_TRACKER.md"
        )


def test_locator_record_schema_is_minimal(
    locator_script_module: ModuleType, capsys: pytest.CaptureFixture[str]
) -> None:
    locator_script_module.main([])
    payload = json.loads(capsys.readouterr().out)

    for record in payload["records"]:
        assert set(record.keys()) == {"path", "exists"}
        assert isinstance(record["path"], str)
        assert "\\" not in record["path"]
        assert isinstance(record["exists"], bool)


def test_locator_output_contains_no_banned_vocabulary(
    locator_script_module: ModuleType, capsys: pytest.CaptureFixture[str]
) -> None:
    locator_script_module.main([])
    output = capsys.readouterr().out.lower()

    banned_terms = (
        "approved",
        "recommended",
        "ready",
        "canonical",
        "current source of truth",
        "source of truth",
        "authoritative",
        "official",
        "blessed",
    )
    for term in banned_terms:
        assert term not in output
