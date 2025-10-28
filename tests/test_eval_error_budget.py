from __future__ import annotations

import sys
from pathlib import Path

import pytest

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from scripts import eval as eval_script


def test_compute_error_budget_remaining() -> None:
    remaining, consumed = eval_script._compute_error_budget(0.98, 0.95)
    assert remaining == pytest.approx(0.03)
    assert consumed == pytest.approx(0.0)


def test_compute_error_budget_consumed() -> None:
    remaining, consumed = eval_script._compute_error_budget(0.9, 0.95)
    # Allowed error = 0.05, actual error = 0.10
    assert remaining == pytest.approx(0.0)
    assert consumed == pytest.approx(0.05)
