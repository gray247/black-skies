"""Enforce deferred-feature containment policy against runtime truth ledger."""

from __future__ import annotations

from tools.runtime_truth.validate_deferred_feature_containment import (
    validate_deferred_feature_containment,
)


def test_deferred_feature_containment_policy_compliance() -> None:
    violations = validate_deferred_feature_containment()
    assert violations == [], "Deferred feature containment violations:\n" + "\n".join(
        f"- {item}" for item in violations
    )
