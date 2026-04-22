"""Enforce runtime-truth documentation policy for high-signal docs."""

from __future__ import annotations

from tools.runtime_truth.validate_runtime_docs import validate_runtime_docs


def test_runtime_docs_policy_compliance() -> None:
    violations = validate_runtime_docs()
    assert violations == [], "Runtime doc policy violations:\n" + "\n".join(
        f"- {item}" for item in violations
    )
