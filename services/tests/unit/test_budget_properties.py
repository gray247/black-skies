from __future__ import annotations

import math

import pytest
from hypothesis import given, strategies as st

from blackskies.services.budgeting import (
    COST_PER_1000_WORDS_USD,
    classify_budget,
    derive_critique_cost,
)


@given(
    st.text(
        alphabet=st.characters(blacklist_categories=("Cs",), blacklist_characters=["\x00"]),
        min_size=0,
        max_size=2000,
    )
)
def test_derive_critique_cost_is_non_negative(body: str) -> None:
    cost = derive_critique_cost(body)
    assert cost >= 0.0


@given(st.floats(min_value=0.0, max_value=50.0))
def test_derive_critique_cost_respects_front_matter(word_target: float) -> None:
    cost = derive_critique_cost(
        "",
        front_matter={"word_target": word_target},
    )
    expected = round((word_target / 1000.0) * COST_PER_1000_WORDS_USD, 2)
    if expected > 0:
        assert cost == pytest.approx(expected)
    else:
        fallback = round(COST_PER_1000_WORDS_USD * 0.25, 2)
        assert cost == pytest.approx(0.0) or cost == pytest.approx(fallback)


@given(
    st.floats(min_value=0.0, max_value=25.0),
    st.floats(min_value=0.0, max_value=25.0),
    st.floats(min_value=0.0, max_value=25.0),
    st.floats(min_value=0.0, max_value=25.0),
)
def test_classify_budget_returns_consistent_totals(
    estimated: float,
    soft_limit: float,
    hard_limit: float,
    current_spend: float,
) -> None:
    effective_hard = hard_limit if hard_limit > 0 else 0.01
    status, _, total_after = classify_budget(
        estimated,
        soft_limit=soft_limit,
        hard_limit=effective_hard,
        current_spend=current_spend,
    )

    expected_total = round(current_spend + estimated, 2)
    assert total_after == pytest.approx(expected_total)
    assert status in {"ok", "soft-limit", "blocked"}

    effective_soft = (
        soft_limit
        if 0 <= soft_limit <= effective_hard
        else effective_hard
    )

    if expected_total >= effective_hard:
        assert status == "blocked"
    elif expected_total >= effective_soft:
        assert status in {"soft-limit", "blocked"}
    else:
        assert status == "ok"
