from __future__ import annotations

import pytest

from blackskies.services.budgeting import _normalize_budget_token


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("10", "10"),
        ("  10.50  ", "10.50"),
        ("\u00a0$1,234.56", "1234.56"),
        ("+2_000", "+2000"),
        ("-1,200", "-1200"),
        ("€3.500,40", "3500.40"),
        ("1,2,3,4", "1234"),
    ],
)
def test_normalize_budget_token_valid(raw: str, expected: str) -> None:
    assert _normalize_budget_token(raw) == expected


@pytest.mark.parametrize(
    "raw",
    [
        "",
        "   ",
        "abc",
        "--5",
        "1.2.3",
    ],
)
def test_normalize_budget_token_invalid(raw: str) -> None:
    assert _normalize_budget_token(raw) is None
