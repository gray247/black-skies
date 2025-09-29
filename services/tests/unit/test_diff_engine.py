"""Unit tests for the diff engine helpers."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import ModuleType

import pytest


@pytest.fixture(scope="module")
def diff_engine_module() -> ModuleType:
    """Load the diff engine module without requiring FastAPI dependencies."""

    repo_root = Path(__file__).resolve().parents[3]
    module_path = repo_root / "services" / "src" / "blackskies" / "services" / "diff_engine.py"
    module_name = "tests.diff_engine_under_test"

    spec = importlib.util.spec_from_file_location(module_name, module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load diff engine module specification")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def test_compute_diff_insert_only(diff_engine_module: ModuleType) -> None:
    """Pure insert operations should populate the added list and anchors."""

    result = diff_engine_module.compute_diff("abc", "abcXYZ")

    assert result.added == [{"range": [3, 3], "text": "XYZ"}]
    assert result.removed == []
    assert result.changed == []
    assert result.anchors == {"left": 3, "right": 0}


def test_compute_diff_delete_only(diff_engine_module: ModuleType) -> None:
    """Pure delete operations should populate the removed list and anchors."""

    result = diff_engine_module.compute_diff("abcXYZ", "abc")

    assert result.added == []
    assert result.removed == [{"range": [3, 6]}]
    assert result.changed == []
    assert result.anchors == {"left": 3, "right": 0}


def test_compute_diff_replace_only(diff_engine_module: ModuleType) -> None:
    """Replacing text should produce a changed entry and zero anchors."""

    result = diff_engine_module.compute_diff("cat", "dog")

    assert result.added == []
    assert result.removed == []
    assert result.changed == [{"range": [0, 3], "replacement": "dog"}]
    assert result.anchors == {"left": 0, "right": 0}


def test_compute_diff_mixed_operations(diff_engine_module: ModuleType) -> None:
    """Mixed edits should report insert, delete, and replace entries."""

    result = diff_engine_module.compute_diff("garden hose", "yard hose reel")

    assert result.added == [{"range": [11, 11], "text": " reel"}]
    assert result.removed == [{"range": [4, 6]}]
    assert result.changed == [{"range": [0, 1], "replacement": "y"}]
    assert result.anchors == {"left": 0, "right": 0}


def test_compute_diff_empty_inputs(diff_engine_module: ModuleType) -> None:
    """Empty inputs should produce an empty diff payload with zero anchors."""

    result = diff_engine_module.compute_diff("", "")

    assert result.added == []
    assert result.removed == []
    assert result.changed == []
    assert result.anchors == {"left": 0, "right": 0}
