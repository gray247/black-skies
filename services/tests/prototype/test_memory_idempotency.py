"""M1 placeholder for lineage dedup/idempotency coverage."""

from __future__ import annotations

import pytest


@pytest.mark.skip(reason="M1 scaffold only; idempotency coverage pending.")
def test_memory_idempotency_dedup() -> None:
    assert True

