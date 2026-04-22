"""Validation tests for fracture diagnostics models."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from blackskies.services.models.fracture import (
    FractureDiagnostic,
    FractureReport,
)


def test_fracture_diagnostic_accepts_supported_category_and_severity() -> None:
    diagnostic = FractureDiagnostic(
        fracture_type="style_drift_risk",
        severity="medium",
        rationale="Draft text reads like scaffolded notes.",
        evidence={
            "summary": "Meta summary markers detected.",
            "source_hints": ["meta_summary=true"],
            "source_origins": ["prompt_pipeline"],
        },
    )

    assert diagnostic.fracture_type.value == "style_drift_risk"
    assert diagnostic.severity.value == "medium"


def test_fracture_diagnostic_rejects_unknown_category() -> None:
    with pytest.raises(ValidationError):
        FractureDiagnostic(
            fracture_type="unsupported_risk",
            severity="low",
            rationale="Invalid category.",
            evidence={"summary": "invalid"},
        )


def test_fracture_diagnostic_rejects_non_canonical_severity_label() -> None:
    with pytest.raises(ValidationError):
        FractureDiagnostic(
            fracture_type="style_drift_risk",
            severity="severe",
            rationale="Non-canonical severity label.",
            evidence={"summary": "invalid severity label"},
        )


def test_fracture_report_enforces_advisory_non_blocking_flags() -> None:
    with pytest.raises(ValidationError):
        FractureReport(
            source="generation",
            diagnostics_only=False,
            advisory=True,
            non_blocking=True,
        )
