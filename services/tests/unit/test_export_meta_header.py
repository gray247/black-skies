"""Unit tests for the export meta header formatting helper."""

from __future__ import annotations

import pytest

from blackskies.services.app import _build_meta_header


@pytest.mark.parametrize(
    ("front_matter", "expected"),
    [
        pytest.param({}, None, id="no-meta"),
        pytest.param(
            {"emotion_tag": "Calm"},
            "> emotion: Calm",
            id="single-field",
        ),
        pytest.param(
            {"pov": "First person", "emotion_tag": "Joy"},
            "> emotion: Joy · pov: First person",
            id="two-fields-ordering",
        ),
        pytest.param(
            {
                "pov": "  close third  ",
                "emotion_tag": " reflective  ",
                "purpose": "  introspection ",
            },
            "> purpose: introspection · emotion: reflective · pov: close third",
            id="three-fields-trimming",
        ),
    ],
)
def test_build_meta_header(front_matter: dict[str, str], expected: str | None) -> None:
    """Verify the meta header renders with the expected formatting."""

    assert _build_meta_header(front_matter) == expected
