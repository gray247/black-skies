"""M1 placeholder for degraded-mode and failure isolation coverage."""

from __future__ import annotations

import pytest


@pytest.mark.skip(reason="M1 scaffold only; failure isolation coverage pending.")
def test_memory_failure_isolation() -> None:
    assert True

