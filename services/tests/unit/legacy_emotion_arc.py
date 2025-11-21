from __future__ import annotations

from blackskies.services.analytics import compute_emotion_arc
from blackskies.services.constants import (
    DEFAULT_EMOTION_INTENSITY,
    EMOTION_INTENSITY_MAP,
)


def test_compute_emotion_arc_respects_config_intensity() -> None:
    outline = {
        "scenes": [
            {"id": "sc-001", "order": 1, "title": "Scene 1"},
            {"id": "sc-002", "order": 2, "title": "Scene 2"},
        ],
        "chapters": [],
    }

    drafts = [
        {
            "id": "sc-001",
            "meta": {"emotion_tag": "dread"},
            "text": "We walk in dread.",
        },
        {
            "id": "sc-002",
            # Missing emotion tag should fall back to default intensity.
            "meta": {},
            "text": "Neutral tone.",
        },
    ]

    arc = compute_emotion_arc(outline, drafts)

    assert arc[0].intensity == EMOTION_INTENSITY_MAP["dread"]
    assert arc[1].intensity == DEFAULT_EMOTION_INTENSITY
