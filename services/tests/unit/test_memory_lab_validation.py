from __future__ import annotations

import pytest

from blackskies.services.memory_lab.validation import validate_memory_thresholds


def test_validate_memory_thresholds_accepts_ordered_thresholds() -> None:
    validate_memory_thresholds(
        fading_threshold=0.40,
        suppressed_threshold=0.20,
        archived_threshold=0.10,
    )


def test_validate_memory_thresholds_rejects_misordered_thresholds() -> None:
    with pytest.raises(
        ValueError,
        match="archived_threshold < suppressed_threshold < fading_threshold",
    ):
        validate_memory_thresholds(
            fading_threshold=0.20,
            suppressed_threshold=0.40,
            archived_threshold=0.10,
        )


def test_validate_memory_thresholds_rejects_min_weight_above_archived_threshold() -> None:
    with pytest.raises(ValueError, match="min_weight <= archived_threshold"):
        validate_memory_thresholds(
            fading_threshold=0.40,
            suppressed_threshold=0.20,
            archived_threshold=0.10,
            min_weight=0.11,
        )
