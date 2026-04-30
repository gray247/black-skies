"""Unit tests for the load harness script."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import ModuleType

import pytest


@pytest.fixture(scope="module")
def load_script_module() -> ModuleType:
    """Load ``scripts/load.py`` as a module for direct helper testing."""

    repo_root = Path(__file__).resolve().parents[3]
    module_path = repo_root / "scripts" / "load.py"
    module_name = "tests.load_script_under_test"

    spec = importlib.util.spec_from_file_location(module_name, module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load load script module specification")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def test_load_service_env_enables_synthetic_e2e_mode(load_script_module: ModuleType) -> None:
    """Self-hosted load runs should opt into the existing synthetic e2e path."""

    env = load_script_module._build_started_service_env({"PATH": "C:/bin"})

    assert env["PATH"] == "C:/bin"
    assert env["BLACKSKIES_E2E_MODE"] == "1"
    assert env["BLACKSKIES_E2E_SYNTHETIC_MODE"] == "1"
