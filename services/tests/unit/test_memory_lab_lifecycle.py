from __future__ import annotations

import pytest

from blackskies.services.memory_lab.lifecycle import (
    derive_memory_status,
    derive_next_decay_status,
)


def test_derive_memory_status_across_thresholds() -> None:
    assert (
        derive_memory_status(
            0.60,
            fading_threshold=0.40,
            suppressed_threshold=0.20,
            archived_threshold=0.10,
        )
        == "active"
    )
    assert (
        derive_memory_status(
            0.30,
            fading_threshold=0.40,
            suppressed_threshold=0.20,
            archived_threshold=0.10,
        )
        == "fading"
    )
    assert (
        derive_memory_status(
            0.15,
            fading_threshold=0.40,
            suppressed_threshold=0.20,
            archived_threshold=0.10,
        )
        == "suppressed"
    )
    assert (
        derive_memory_status(
            0.05,
            fading_threshold=0.40,
            suppressed_threshold=0.20,
            archived_threshold=0.10,
        )
        == "archived"
    )


def test_derive_next_decay_status_enforces_one_step_per_tick() -> None:
    assert (
        derive_next_decay_status(
            "active",
            weight=0.30,
            fading_threshold=0.40,
            suppressed_threshold=0.20,
            archived_threshold=0.10,
        )
        == "fading"
    )
    assert (
        derive_next_decay_status(
            "fading",
            weight=0.15,
            fading_threshold=0.40,
            suppressed_threshold=0.20,
            archived_threshold=0.10,
        )
        == "suppressed"
    )
    assert (
        derive_next_decay_status(
            "suppressed",
            weight=0.05,
            fading_threshold=0.40,
            suppressed_threshold=0.20,
            archived_threshold=0.10,
        )
        == "archived"
    )
    assert (
        derive_next_decay_status(
            "archived",
            weight=0.90,
            fading_threshold=0.40,
            suppressed_threshold=0.20,
            archived_threshold=0.10,
        )
        == "archived"
    )


def test_weight_can_cross_deeper_threshold_but_status_advances_one_step() -> None:
    assert (
        derive_next_decay_status(
            "active",
            weight=0.01,
            fading_threshold=0.40,
            suppressed_threshold=0.20,
            archived_threshold=0.10,
        )
        == "fading"
    )
    assert (
        derive_next_decay_status(
            "fading",
            weight=0.01,
            fading_threshold=0.40,
            suppressed_threshold=0.20,
            archived_threshold=0.10,
        )
        == "suppressed"
    )


def test_derive_next_decay_status_rejects_unknown_status() -> None:
    with pytest.raises(ValueError, match="unsupported memory status"):
        derive_next_decay_status(
            "unknown",
            weight=0.50,
            fading_threshold=0.40,
            suppressed_threshold=0.20,
            archived_threshold=0.10,
        )
